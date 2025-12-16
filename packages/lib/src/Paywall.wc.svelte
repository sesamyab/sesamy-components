<svelte:options customElement="sesamy-paywall" />

<script lang="ts">
  import Base from './Base.svelte';
  import Renderer from './components/paywall/Renderer.svelte';
  import type { Paywall } from './types/Paywall';
  import LoginRenderer from './components/paywall/LoginRenderer.svelte';
  import type { SesamyAPI } from '@sesamy/sesamy-js';

  import type { PaywallProps } from './types';

  let props: PaywallProps = $props();

  async function fetchPaywall(
    api: SesamyAPI
  ): Promise<{ paywall: Paywall; template: string } | null> {
    const host = $host();
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

    const response = await fetch(settingsUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch paywall: ${response.status} ${response.statusText}`);
    }
    const paywall: Paywall = await response.json();
    const template = paywall?.settings.template || '';
    return { paywall, template };
  }
</script>

<Base let:api let:t>
  {@const host = $host()}

  {#await fetchPaywall(api)}
    <div class="sesamy-paywall" style="display: contents">
      <slot {api} {t} {...props} />
    </div>
  {:then result}
    {#if result}
      {api.log(`sesamy-paywall with template ${result.template}`)}

      {#if result.template === 'ARTICLE'}
        <Renderer {api} paywall={result.paywall} {host} {t} {...props} />
      {:else if result.template === 'BOXES'}
        <Renderer horizontal {api} paywall={result.paywall} {host} {t} {...props} />
      {:else if result.template === 'LOGIN'}
        <LoginRenderer {api} {t} paywall={result.paywall} {...props} />
      {/if}
    {/if}
  {:catch error}
    <div class="sesamy-paywall-error">
      Error loading paywall: {error.message}
    </div>
  {/await}
</Base>
