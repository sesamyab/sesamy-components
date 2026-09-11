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
  import { ContentSlot, applyAccessState, resolveAccess, type AccessState } from './content-lock';

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
  let unlockStarted = false;
  // Only the newest access check may change what the reader sees.
  let checkSeq = 0;

  type Content = NonNullable<ReturnType<SesamyAPI['content']['get']>>;

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
  async function check(api: SesamyAPI) {
    const host = $host();
    if (!host || !contentSlot) return;

    // Sign-in and sign-out can overlap, and their requests do not necessarily
    // come back in the order they were sent. Without this, a slow grant landing
    // after a logout would hand the article back to a reader who just signed
    // out — so only the newest check is allowed to change anything.
    const seq = ++checkSeq;

    const content = api.content.get(host);
    const previous = access;

    // The container's own access-level attribute is the documented contract and
    // wins over what sesamy-js resolved from the surrounding <sesamy-article>.
    const accessLevel = resolveAccessLevel(accessLevelProp, content?.accessLevel);

    let resolved: AccessState;
    if (accessLevel === 'public') {
      api.log(`Content is public`);
      resolved = 'granted';
    } else {
      api.log(`Checking access`);
      resolved = await resolveAccess(api, host);
    }

    if (seq !== checkSeq) return;

    applyAccessState(resolved, contentSlot);
    access = resolved;

    // Report the article view once we actually know something. `unknown` says
    // nothing about the reader and must not be counted as a locked view.
    if (access !== 'unknown' && content) {
      trackViewArticle(api, content, accessLevel, access === 'granted');
    }

    if (access === 'granted' && previous !== 'granted') {
      await unlockAndRenderContent(api);
    }
  }

  function onSessionChanged() {
    if (apiRef) void check(apiRef);
  }

  /** Called from the markup once Base has resolved a usable api. */
  function start(api: SesamyAPI) {
    if (started) return;
    started = true;
    apiRef = api;
    contentSlot = new ContentSlot($host());

    window.addEventListener(SesamyJsEvent.AUTHENTICATED, onSessionChanged);
    window.addEventListener(SesamyJsEvent.LOGOUT, onSessionChanged);

    // Off the render pass: `check()` assigns `access`, and for public content it
    // gets there without awaiting anything. Svelte 5 discards a state mutation
    // made while the component is rendering, so the article would never be
    // projected.
    queueMicrotask(() => void check(api));
  }

  onDestroy(() => {
    window.removeEventListener(SesamyJsEvent.AUTHENTICATED, onSessionChanged);
    window.removeEventListener(SesamyJsEvent.LOGOUT, onSessionChanged);
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

  async function unlockAndRenderContent(api: SesamyAPI) {
    // A re-check after a session change can grant access a second time; the
    // fetch-and-inject modes must not run twice and stack two copies of the
    // article into the page.
    if (unlockStarted) return;
    unlockStarted = true;

    try {
      // Embed mode: content is already in the slot. Cloning+reinjecting via
      // innerHTML breaks ad iframes and any other stateful DOM injected by
      // publisher scripts, so we leave the DOM untouched and let the browser
      // project <slot name="content"> in the template.
      if (lockMode === 'embed') {
        emitUnlockEvent(api);
        return;
      }

      extractAndStoreContent();
      if (!$host()?.isConnected) return;
      const contentHtml = await fetchContent(api);
      if (!$host()?.isConnected) return;
      const injected = await injectContent(contentHtml);

      // The article now lives beside the host, outside anything `ContentSlot`
      // knows about. Hand it over so a later denial takes it off the page too —
      // and so a later grant puts it back without fetching it again.
      if (injected) contentSlot?.adopt(injected);

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
