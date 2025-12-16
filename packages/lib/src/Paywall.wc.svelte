<svelte:options customElement="sesamy-paywall" />

<script lang="ts">
  import Base from './Base.svelte';
  import Renderer from './components/paywall/Renderer.svelte';
  import type { Paywall } from './types/Paywall';
  import LoginRenderer from './components/paywall/LoginRenderer.svelte';
  import type { SesamyAPI } from '@sesamy/sesamy-js';

  import type { PaywallProps } from './types';

  let props: PaywallProps = $props();

  let paywall = $state<Paywall>();
  let template = $state<string>();
  let loading = $state(true);
  // Guard to prevent re-fetching on every render (not reactive to avoid state mutation errors in template)
  let fetched = false;

  async function fetchPaywall(api: SesamyAPI) {
    if (fetched) return;
    fetched = true;

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
      loading = false;
      return;
    }

    try {
      const response = await fetch(settingsUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch paywall: ${response.status} ${response.statusText}`);
      }
      paywall = await response.json();
      template = paywall?.settings.template || undefined;
    } catch (error) {
      console.error('Error fetching paywall settings:', error);
    } finally {
      loading = false;
    }
  }
</script>

<Base let:api let:t>
  {@const host = $host()}
  {@const _ = fetchPaywall(api)}

  {#if loading}
    <div class="sesamy-paywall" style="display: contents">
      <slot {api} {t} {...props} />
    </div>
  {/if}

  {#if paywall}
    {api.log(`sesamy-paywall with template ${template}`)}

    {#if template === 'ARTICLE'}
      <Renderer {api} {paywall} {host} {t} {...props} />
    {:else if template === 'BOXES'}
      <Renderer horizontal {api} {paywall} {host} {t} {...props} />
    {:else if template === 'LOGIN'}
      <LoginRenderer {api} {t} {paywall} {...props} />
    {/if}
  {/if}
</Base>
