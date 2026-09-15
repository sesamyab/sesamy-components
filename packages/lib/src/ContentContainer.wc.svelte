<svelte:options
  customElement={{
    tag: 'sesamy-content-container',
    shadow: 'open',
    extend: deferMountUntilParsed
  }}
/>

<script lang="ts">
  import { deferMountUntilParsed } from './defer-mount';
  import type { SesamyAPI } from '@sesamy/sesamy-js';
  import { onDestroy } from 'svelte';
  import Base from './Base.svelte';
  import type { ContentContainerProps } from './types';
  import { dispatchSesamyEvent, SesamyJsEvent } from './events';
  import { resolveAccessLevel, resolveArticleState, resolveItemSrc, track } from './tracking';
  import {
    ContentSlot,
    accessRetryDelay,
    applyAccessState,
    resolveAccessWithin,
    type AccessResolution,
    type AccessState
  } from './content-lock';

  let {
    'item-src': itemSrc = '',
    'access-level': accessLevelProp,
    'publisher-content-id': publisherContentIdProp,
    'lock-mode': lockMode = 'embed',
    'locked-content-selector': lockedContentSelector
  }: ContentContainerProps = $props();

  // Stored only for non-embed modes (encode) that need to read the original
  // slot HTML as their source. Embed mode never extracts; the slot is left in
  // place and projected via <slot name="content">.
  let storedContentElement: Element | null = null;
  let unlockEmitted = false;
  let viewTracked = false;

  // What we currently know about this reader. Starts `unknown`, which renders
  // the preview and — crucially — touches nothing in the light DOM.
  let access = $state<AccessState>('unknown');
  let contentSlot: ContentSlot | null = null;
  let apiRef: SesamyAPI | null = null;
  let started = false;
  // The fetched article, kept so a re-grant renders without a second round trip.
  let fetchedHtml: string | null = null;
  let fetchInFlight = false;
  // The node rendered beside the host, once it exists.
  let injectedNode: Element | null = null;
  // Sign-in and sign-out each start a new session epoch. An answer only counts
  // for the epoch it was asked in.
  let sessionEpoch = 0;
  // The newest epoch with a definite answer (granted or denied).
  let settledEpoch = -1;
  // Checks still waiting on sesamy-js, before their timeout.
  let pendingChecks = 0;
  // Checks without an answer in the current epoch; drives the backoff.
  let epochUnresolved = 0;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  // For telemetry, over the life of the element rather than one epoch.
  let unresolvedChecks = 0;
  let unresolvedSince = 0;
  let unresolvedReported = false;
  let recoveryReported = false;

  type MaybeContent = ReturnType<SesamyAPI['content']['get']>;
  type Content = NonNullable<MaybeContent>;

  function extractAndStoreContent() {
    const host = $host();
    if (!host || storedContentElement) return;

    const contentSlot = host.querySelector('[slot="content"]');
    if (contentSlot) {
      storedContentElement = contentSlot.cloneNode(true) as Element;
      contentSlot.remove();
    }
  }


  /**
   * Emitted once per container, as soon as the content container has resolved
   * an article and knows whether it is locked. This is what feeds the article
   * view rollups; the DOM events stay untouched for publisher-side hooks.
   */
  function trackViewArticle(
    api: SesamyAPI,
    content: Content,
    accessLevel: string | undefined,
    hasAccess: unknown
  ) {
    if (viewTracked) return;
    viewTracked = true;

    track(api, 'viewArticle', {
      itemSrc: resolveItemSrc(itemSrc, content.url),
      publisherContentId: publisherContentIdProp || content.id,
      state: resolveArticleState(accessLevel, hasAccess)
    });
  }

  /**
   * Resolve access and bring the page into line with the answer, then keep
   * doing so whenever the session changes.
   *
   * The first answer is not final. On a cold load — the first visit of the
   * morning, when the overnight token has expired — the session can still be
   * settling, or be unable to produce a token at all. A gate that decided once
   * and removed the article left a paying subscriber looking at the teaser,
   * with `<sesamy-login>` cheerfully showing them as signed in, until they
   * reloaded. So: re-check on every auth transition, and only ever remove the
   * article on a definite `denied`.
   */
  async function check(api: SesamyAPI, sessionChanged = false) {
    const host = $host();
    if (!host || !contentSlot) return;

    // Sign-in and sign-out can overlap, and their requests do not necessarily
    // come back in the order they were sent. Without this, a slow grant landing
    // after a logout would hand the article back to a reader who just signed
    // out — so an answer only counts for the session it was asked in.
    if (sessionChanged) {
      sessionEpoch++;
      epochUnresolved = 0;
    }
    const epoch = sessionEpoch;
    clearRetry();

    const content = api.content.get(host);

    // The container's own access-level attribute is the documented contract and
    // wins over what sesamy-js resolved from the surrounding <sesamy-article>.
    const accessLevel = resolveAccessLevel(accessLevelProp, content?.accessLevel);

    let resolution: AccessResolution;
    if (accessLevel === 'public') {
      api.log(`Content is public`);
      resolution = { state: 'granted' };
    } else {
      api.log(`Checking access`);
      pendingChecks++;
      try {
        resolution = await resolveAccessWithin(api, host);
      } finally {
        pendingChecks--;
      }
    }

    // A check that timed out can still answer. Use it, unless this session has
    // been answered some other way by then.
    void resolution.late?.then((late) => {
      if (late.state !== 'unknown' && settledEpoch !== epoch) {
        void settle(api, epoch, late, content, accessLevel);
      }
    });

    await settle(api, epoch, resolution, content, accessLevel);
  }

  /**
   * Bring the page into line with one check's outcome, if it still speaks for
   * the current session.
   *
   * No answer is not a final answer either. A check can throw (no token, the
   * network dropped) or never come back (a request stalled across a network
   * change), and either leaves the container on its preview — which on a page
   * with an empty preview slot is a blank gap where a subscriber's article
   * should be. Waiting for the next auth event is not enough, since nothing
   * promises there will be one, so the container asks again itself.
   */
  async function settle(
    api: SesamyAPI,
    epoch: number,
    resolution: AccessResolution,
    content: MaybeContent,
    accessLevel: string | undefined
  ) {
    if (epoch !== sessionEpoch || !contentSlot) return;
    // This session was answered already, by a retry or by a slow check that
    // came back late. The first definite answer stands. A check that was still
    // in flight when it arrived does not overturn it, and not knowing does not
    // undo it either.
    if (settledEpoch === epoch) return;

    if (resolution.state === 'unknown') {
      epochUnresolved++;
      unresolvedChecks++;
      unresolvedSince ||= Date.now();
      reportUnresolved(api, content, resolution.reason);
      scheduleRetry(api, resolution.reason);
      // `access` stays as it is. Not knowing never takes back what the reader
      // is already being shown, and never grants what they were refused.
      return;
    }

    settledEpoch = epoch;
    clearRetry();

    applyAccessState(resolution.state, contentSlot);
    access = resolution.state;

    // Report the article view once we actually know something. `unknown` says
    // nothing about the reader and must not be counted as a locked view.
    if (content) {
      trackViewArticle(api, content, accessLevel, access === 'granted');
    }
    reportRecovered(api, content, resolution.state);

    // On every grant, not only a change to one: the previous session may have
    // been granted too, but have had its render cut short by this session
    // starting. Rendering is idempotent, so a grant with nothing left to do
    // costs nothing.
    if (access === 'granted') {
      await unlockAndRenderContent(api, epoch);
    }
  }

  function clearRetry() {
    if (retryTimer !== null) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
  }

  function scheduleRetry(api: SesamyAPI, reason: string | undefined) {
    clearRetry();
    const delay = accessRetryDelay(epochUnresolved - 1);
    api.log(`Access unresolved (${reason ?? 'unknown'}); checking again in ${delay}ms`);
    retryTimer = setTimeout(() => {
      retryTimer = null;
      if ($host()?.isConnected) void check(api);
    }, delay);
  }

  /**
   * The browser is back online, or the reader is back on the tab. A check that
   * failed a moment ago is likely to work now, so skip the rest of the backoff.
   */
  function onConditionsChanged() {
    if (!apiRef || settledEpoch === sessionEpoch || epochUnresolved === 0) return;
    if (pendingChecks > 0 || document.visibilityState === 'hidden') return;
    void check(apiRef);
  }

  function reportUnresolved(api: SesamyAPI, content: MaybeContent, reason: string | undefined) {
    if (unresolvedReported) return;
    unresolvedReported = true;

    track(api, 'content_access_unresolved', {
      itemSrc: resolveItemSrc(itemSrc, content?.url),
      publisherContentId: publisherContentIdProp || content?.id,
      reason: reason ?? 'unknown'
    });
  }

  function reportRecovered(api: SesamyAPI, content: MaybeContent, state: 'granted' | 'denied') {
    if (!unresolvedReported || recoveryReported) return;
    recoveryReported = true;

    track(api, 'content_access_recovered', {
      itemSrc: resolveItemSrc(itemSrc, content?.url),
      publisherContentId: publisherContentIdProp || content?.id,
      state,
      attempts: unresolvedChecks,
      elapsedMs: Date.now() - unresolvedSince
    });
  }

  function onSessionChanged() {
    if (apiRef) void check(apiRef, true);
  }

  /** Called from the markup once Base has resolved a usable api. */
  function start(api: SesamyAPI) {
    if (started) return;
    started = true;
    apiRef = api;
    contentSlot = new ContentSlot($host());

    window.addEventListener(SesamyJsEvent.AUTHENTICATED, onSessionChanged);
    window.addEventListener(SesamyJsEvent.LOGOUT, onSessionChanged);
    window.addEventListener('online', onConditionsChanged);
    document.addEventListener('visibilitychange', onConditionsChanged);

    // Off the render pass: `check()` assigns `access`, and for public content it
    // gets there without awaiting anything. Svelte 5 discards a state mutation
    // made while the component is rendering, so the article would never be
    // projected.
    queueMicrotask(() => void check(api));
  }

  onDestroy(() => {
    window.removeEventListener(SesamyJsEvent.AUTHENTICATED, onSessionChanged);
    window.removeEventListener(SesamyJsEvent.LOGOUT, onSessionChanged);
    window.removeEventListener('online', onConditionsChanged);
    document.removeEventListener('visibilitychange', onConditionsChanged);
    clearRetry();
    // Checks still queued or in flight must not act for an element that is
    // gone: no unlock events, no tracking. A new epoch outdates them, and
    // without a slot or an api there is nothing left for them to act on.
    sessionEpoch++;
    contentSlot = null;
    apiRef = null;
  });

  function emitUnlockEvent(api: SesamyAPI) {
    if (unlockEmitted) return;
    unlockEmitted = true;
    const host = $host();
    const content = api.content.get(host);
    const publisherContentId = publisherContentIdProp || content?.id || '';

    const event = new CustomEvent('sesamyUnlocked', {
      detail: {
        publisherContentId,
        itemSrc
      },
      bubbles: true,
      composed: true
    });

    dispatchEvent(event);

    const contentName = host.dataset?.dcaContentName ?? publisherContentId ?? '';

    dispatchSesamyEvent(host, 'sesamy:content-unlocked', {
      contentName
    });

    track(api, 'content_unlocked', {
      itemSrc: resolveItemSrc(itemSrc, content?.url),
      publisherContentId,
      contentName
    });
  }

  async function injectContent(contentHtml: string): Promise<Element | null> {
    if (!contentHtml) return null;

    const host = $host();
    if (!host) return null;

    const lockedContentNode = document.createElement('div');
    lockedContentNode.setAttribute('position', 'relative');

    // Copy classes from the web component
    const componentClasses = host.getAttribute('class');
    if (componentClasses) {
      lockedContentNode.setAttribute('class', componentClasses);
    }

    lockedContentNode.innerHTML = contentHtml;

    // Handle scripts
    const scripts = lockedContentNode.querySelectorAll('script');
    const inlineScripts: HTMLScriptElement[] = [];

    scripts.forEach((script) => {
      try {
        const newScript = document.createElement('script');
        // Preserve all attributes (type, async, defer, crossorigin, etc.)
        Array.from(script.attributes).forEach((attr) =>
          newScript.setAttribute(attr.name, attr.value)
        );
        if (script.src) {
          document.head.appendChild(newScript);
        } else {
          newScript.textContent = script.textContent;
          inlineScripts.push(newScript);
        }
        script.parentNode?.removeChild(script);
      } catch (err) {
        console.error('Failed to process script:', err, script);
      }
    });

    // Insert in light DOM, beside the host rather than inside it.
    host.parentElement?.insertBefore(lockedContentNode, host);

    // Execute inline scripts
    inlineScripts.forEach((script) => {
      try {
        document.head.appendChild(script);
        // Module scripts execute asynchronously; don't remove them so the browser
        // can finish loading imports. Non-module scripts execute synchronously on
        // append so they can be removed immediately after.
        if (script.type !== 'module') {
          document.head.removeChild(script);
        }
      } catch (err) {
        console.error('Failed to execute inline script:', err, script);
      }
    });

    return lockedContentNode;
  }

  async function fetchContent(api: SesamyAPI): Promise<string> {
    switch (lockMode) {
      case 'encode':
        const base64 = storedContentElement?.innerHTML || '';
        // Convert base64 to UTF-8 string
        try {
          return new TextDecoder().decode(Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)));
        } catch (e) {
          console.error('Error decoding content:', e);
          return '';
        }
      case 'event':
        emitUnlockEvent(api);
        return '';
      case 'proxy':
      case 'signedUrl':
        return api.content.unlock($host().parentElement!, lockedContentSelector);
      case 'embed':
        // Embed leaves the DOM untouched; this branch is unreachable in the
        // entitled flow because the template projects <slot name="content">.
        return '';
      default:
        console.error('Invalid lock mode');
        return '';
    }
  }

  /**
   * Whether this unlock still speaks for the current session.
   *
   * Fetching the article takes a network round trip, and the reader can sign
   * out while it is in flight. Inserting the result then would hand the article
   * to someone who has just been denied it — the access check's own session
   * guard cannot catch that, because it returned long before.
   */
  function stillGranted(epoch: number): boolean {
    // `access` alone is not enough. It keeps the previous session's grant
    // while a new session's check is still out, so the epoch must have been
    // answered too.
    return epoch === sessionEpoch && settledEpoch === epoch && access === 'granted';
  }

  async function unlockAndRenderContent(api: SesamyAPI, epoch: number) {
    try {
      // Embed mode: content is already in the slot. Cloning+reinjecting via
      // innerHTML breaks ad iframes and any other stateful DOM injected by
      // publisher scripts, so we leave the DOM untouched and let the browser
      // project <slot name="content"> in the template.
      if (lockMode === 'embed') {
        emitUnlockEvent(api);
        return;
      }

      // Rendered once already. `ContentSlot` owns it from then on: a denial
      // detaches it and a grant puts it back, so there is nothing to redo here.
      if (injectedNode) return;
      if (!stillGranted(epoch)) return;

      // Fetch at most once. A reader who signs out and back in gets the article
      // without a second round trip, and `event` mode does not announce twice.
      if (fetchedHtml === null) {
        if (fetchInFlight) return;
        fetchInFlight = true;
        extractAndStoreContent();
        if (!$host()?.isConnected) return;
        try {
          fetchedHtml = await fetchContent(api);
        } finally {
          fetchInFlight = false;
        }
      }

      if (!$host()?.isConnected) return;
      // Re-checked after the await, not only before it: this is the window a
      // logout lands in. The fetched HTML is kept, so a later grant renders it
      // without asking again.
      //
      // Checked against the current session rather than the one the fetch
      // began in. A session that started and was granted during the fetch found
      // it in flight and left the rendering to it.
      if (!stillGranted(sessionEpoch)) return;

      injectedNode = await injectContent(fetchedHtml);

      // The article now lives beside the host, outside anything `ContentSlot`
      // knows about. Hand it over so a later denial takes it off the page too —
      // and so a later grant puts it back without fetching it again.
      if (injectedNode) contentSlot?.adopt(injectedNode);

      if (lockMode !== 'event') {
        emitUnlockEvent(api);
      }
    } catch (err) {
      console.error('Error unlocking content:', err);
    }
  }
</script>

<Base let:api applyStyles={false}>
  {start(api) ?? ''}
  {#if access === 'granted' && lockMode === 'embed'}
    <!-- Embed: project the original slot content untouched so ads, iframes,
         and any DOM injected by publisher scripts keep working. -->
    <slot name="content"></slot>
  {:else if access === 'granted'}
    <!-- Other modes: content has been rendered outside the shadow DOM. -->
  {:else}
    <!-- Denied, or not known yet. The preview is what an undecided gate shows;
         only a definite denial takes the article out of the light DOM. -->
    <slot name="preview"></slot>
  {/if}

  <!-- sesamy-js never became usable. Show the teaser rather than an error on
       the publisher's page — and leave the article in the light DOM, since
       nothing was ever established about this reader. -->
  <svelte:fragment slot="error">
    <slot name="preview"></slot>
  </svelte:fragment>
</Base>
