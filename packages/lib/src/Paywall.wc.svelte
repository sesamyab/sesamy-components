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
  import { dispatchSesamyEvent, SesamyJsEvent } from './events';

  import type { PaywallProps } from './types';

  let props: PaywallProps = $props();

  let revision = $state(0);
  const refresh = () => {
    grantedOnPage = undefined;
    revision++;
  };
  window.addEventListener(SesamyJsEvent.AUTHENTICATED, refresh);
  window.addEventListener(SesamyJsEvent.LOGOUT, refresh);
  window.addEventListener('online', refresh);
  let grantedOnPage: string | undefined;
  const unlocked = (event: Event) => {
    const detail = (event as CustomEvent).detail;
    const id = $host().getAttribute('publisher-content-id');
    if (id && detail?.publisherContentId === id) {
      grantedOnPage = id;
      revision++;
    }
  };
  window.addEventListener('sesamyUnlocked', unlocked);
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
    window.removeEventListener('sesamyUnlocked', unlocked);
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

  async function fetchPaywall(
    api: SesamyAPI,
    _revision: number
  ): Promise<{ paywall: Paywall; template: string; accessDenied?: boolean } | null> {
    const host = $host();
    const metadata = api.content.get(host);
    const unified =
      metadata?.legacyContentAccess === false && typeof api.content.hasAccess === 'function';
    if (unified) {
      if (
        (grantedOnPage &&
          grantedOnPage === (host.getAttribute('publisher-content-id') || metadata?.id)) ||
        (await api.content.hasAccess(host))
      ) {
        markAccessGranted();
        return null;
      }
      const selected = api.content.get(host)?.resolvedPaywall as Paywall | undefined;
      if (selected)
        return { paywall: selected, template: selected.settings.template, accessDenied: true };
    }
    const urlParams = new URLSearchParams(window.location.search);
    const hasLabOpts = urlParams.has('lab_opts');

    // Get paywall-url from content config
    const contentPaywallUrl = api.content.get(host)?.paywallUrl;

    // If lab_opts is set, content paywallUrl takes priority; otherwise settings-url takes priority
    const settingsUrl = hasLabOpts
      ? contentPaywallUrl || props['settings-url']
      : props['settings-url'] || contentPaywallUrl;

    if (!settingsUrl) {
      return null;
    }

    // Pass the full settings URL, not a bare id: sesamy-js requests a URL as-is,
    // while an id goes via the api-proxy route, which validates the response
    // against a stale schema and strips fields the renderer needs.
    const paywall = (await api.paywalls.get(resolveSettingsUrl(settingsUrl))) as Paywall;
    const template = paywall?.settings.template || '';
    return { paywall, template, accessDenied: unified };
  }
</script>

<Base let:api let:t>
  {@const host = $host()}

  {#await fetchPaywall(api, revision)}
    <div class="sesamy-paywall" style="display: contents">
      <slot {api} {t} {...props} />
    </div>
  {:then result}
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
          {...props}
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
          {...props}
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
          {...props}
        />
      {:else if result.template === 'LOGIN'}
        <LoginRenderer
          {api}
          {t}
          accessDenied={result.accessDenied}
          paywall={result.paywall}
          {host}
          onShown={markShown}
          onAccessGranted={markAccessGranted}
          {...props}
        />
      {/if}
    {/if}
  {:catch error}
    <div class="sesamy-paywall-error">
      Error loading paywall: {error.message}
    </div>
  {/await}
</Base>
