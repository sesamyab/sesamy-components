<svelte:options customElement={{ tag: 'sesamy-paywall', extend: deferMountUntilParsed }} />

<script lang="ts">
  import { deferMountUntilParsed } from './defer-mount';
  import { onDestroy } from 'svelte';
  import Base from './Base.svelte';
  import Renderer from './components/paywall/Renderer.svelte';
  import type { Paywall } from './types/Paywall';
  import LoginRenderer from './components/paywall/LoginRenderer.svelte';
  import EmailRenderer from './components/paywall/EmailRenderer.svelte';
  import type { SesamyAPI } from '@sesamy/sesamy-js';
  import { dispatchSesamyEvent, SesamyInternalEvent, SesamyJsEvent } from './events';

  import type { PaywallElementProps } from './types';

  let props: PaywallElementProps = $props();
  // The renderers take the fetched paywall as `paywall`, so the reference attribute must not reach them.
  const rendererProps = $derived.by(() => {
    const { paywall: _reference, ...rest } = props;
    return rest;
  });

  type PaywallResult = { paywall: Paywall; template: string; accessDenied?: boolean } | null;
  type LoadState =
    | { status: 'pending' }
    | { status: 'done'; result: PaywallResult }
    | { status: 'error'; error: Error };

  let loadState = $state.raw<LoadState>({ status: 'pending' });
  let apiRef: SesamyAPI | null = null;
  let loadToken = 0;
  // Only unified access is re-decided on session changes; the legacy flow
  // renders once, as it always has.
  let unified = false;
  // A consuming grant the content container obtained for this content.
  let grantedOnPage: string | undefined;

  function contentId(api: SesamyAPI): string | undefined {
    const host = $host();
    return host.getAttribute('publisher-content-id') || api.content.get(host)?.id || undefined;
  }

  function sameResult(a: PaywallResult, b: PaywallResult): boolean {
    if (a === null || b === null) return a === b;
    return (
      a.paywall?.id === b.paywall?.id &&
      a.template === b.template &&
      a.accessDenied === b.accessDenied
    );
  }

  function load(api: SesamyAPI) {
    apiRef = api;
    const token = ++loadToken;
    fetchPaywall(api).then(
      (result) => {
        if (token !== loadToken) return;
        // Keep the mounted renderer when the outcome has not changed, so a
        // re-check does not flicker or re-announce the paywall.
        if (loadState.status === 'done' && sameResult(loadState.result, result)) return;
        loadState = { status: 'done', result };
      },
      (error: Error) => {
        if (token !== loadToken) return;
        loadState = { status: 'error', error };
      }
    );
  }

  let started = false;
  function start(api: SesamyAPI) {
    if (started) return;
    started = true;
    // Off the render pass: Svelte discards state set while rendering.
    queueMicrotask(() => load(api));
  }

  const refresh = () => {
    grantedOnPage = undefined;
    if (unified && apiRef) load(apiRef);
  };
  window.addEventListener(SesamyJsEvent.AUTHENTICATED, refresh);
  window.addEventListener(SesamyJsEvent.LOGOUT, refresh);
  window.addEventListener('online', refresh);
  const granted = (event: Event) => {
    const id = (event as CustomEvent).detail?.publisherContentId;
    if (!id || !apiRef || id !== contentId(apiRef)) return;
    grantedOnPage = id;
    if (unified) load(apiRef);
  };
  window.addEventListener(SesamyInternalEvent.CONTENT_GRANTED, granted);
  let shown = false;
  let accessGranted = false;

  const markShown = () => {
    shown = true;
  };
  const markAccessGranted = () => {
    accessGranted = true;
  };

  onDestroy(() => {
    window.removeEventListener(SesamyJsEvent.AUTHENTICATED, refresh);
    window.removeEventListener(SesamyJsEvent.LOGOUT, refresh);
    window.removeEventListener('online', refresh);
    window.removeEventListener(SesamyInternalEvent.CONTENT_GRANTED, granted);
    if (shown && !accessGranted) {
      dispatchSesamyEvent($host(), 'sesamy:paywall-dismissed', {});
    }
  });

  // sesamy-js decides url-vs-id with `new URL(value)`, which a relative URL
  // fails, so resolve a path-like value against the page before handing it over.
  function resolveSettingsUrl(value: string): string {
    const isPathLike =
      value.startsWith('/') ||
      value.startsWith('./') ||
      value.startsWith('../') ||
      value.includes('/');
    return isPathLike ? new URL(value, document.baseURI).href : value;
  }

  async function fetchPaywall(api: SesamyAPI): Promise<PaywallResult> {
    const host = $host();
    const metadata = api.content.get(host);
    unified =
      metadata?.legacyContentAccess === false && typeof api.content.hasAccess === 'function';
    // Whether the renderer should show without deciding entitlements itself.
    // A failed check counts too: the paywall stays until the content container
    // reports a grant, rather than a second check deciding on its own.
    let accessDenied = false;
    if (unified) {
      let hasAccess: unknown;
      try {
        hasAccess =
          (grantedOnPage && grantedOnPage === contentId(api)) ||
          (await api.content.hasAccess(host));
      } catch (error) {
        api.log(`Content access check failed, using the configured paywall: ${error}`);
        hasAccess = undefined;
      }
      if (hasAccess) {
        markAccessGranted();
        return null;
      }
      accessDenied = true;
      accessGranted = false;
      if (hasAccess !== undefined) {
        const selected = api.content.get(host)?.resolvedPaywall as Paywall | undefined;
        if (selected?.settings) {
          return { paywall: selected, template: selected.settings.template, accessDenied };
        }
      }
    }
    const urlParams = new URLSearchParams(window.location.search);
    const hasLabOpts = urlParams.has('lab_opts');

    // Get paywall-url from content config
    const contentPaywallUrl = api.content.get(host)?.paywallUrl;

    // If lab_opts is set, content paywallUrl takes priority; otherwise the element's own reference does
    const explicit = props.paywall || props['settings-url'];
    const settingsUrl = hasLabOpts ? contentPaywallUrl || explicit : explicit || contentPaywallUrl;

    if (!settingsUrl) {
      return null;
    }

    // sesamy-js fetches a URL as-is and resolves an id (incl. a strategy `st_…`) via api-proxy.
    const paywall = (await api.paywalls.get(resolveSettingsUrl(settingsUrl))) as Paywall;
    const template = paywall?.settings.template || '';
    return { paywall, template, accessDenied };
  }
</script>

<Base let:api let:t>
  {@const host = $host()}

  {start(api) ?? ''}
  {#if loadState.status === 'pending'}
    <div class="sesamy-paywall" style="display: contents">
      <slot {api} {t} {...props} />
    </div>
  {:else if loadState.status === 'done'}
    {@const result = loadState.result}
    {#if result}
      {api.log(`sesamy-paywall with template ${result.template}`)}

      {#if result.template === 'ARTICLE'}
        <Renderer
          {api}
          accessDenied={result.accessDenied}
          paywall={result.paywall}
          {host}
          {t}
          onShown={markShown}
          onAccessGranted={markAccessGranted}
          {...rendererProps}
        />
      {:else if result.template === 'BOXES'}
        <Renderer
          horizontal
          {api}
          accessDenied={result.accessDenied}
          paywall={result.paywall}
          {host}
          {t}
          onShown={markShown}
          onAccessGranted={markAccessGranted}
          {...rendererProps}
        />
      {:else if result.template === 'EMAIL'}
        <EmailRenderer
          {api}
          accessDenied={result.accessDenied}
          paywall={result.paywall}
          {host}
          {t}
          onShown={markShown}
          onAccessGranted={markAccessGranted}
          {...rendererProps}
        />
      {:else if result.template === 'LOGIN'}
        <LoginRenderer
          {api}
          {t}
          paywall={result.paywall}
          {host}
          onShown={markShown}
          onAccessGranted={markAccessGranted}
          {...rendererProps}
        />
      {/if}
    {/if}
  {:else if loadState.status === 'error'}
    <div class="sesamy-paywall-error">
      Error loading paywall: {loadState.error.message}
    </div>
  {/if}
</Base>
