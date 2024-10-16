<svelte:options customElement="sesamy-paywall" />

<script lang="ts">
  import Base from './Base.svelte';
  import type { PaywallProps } from './types';
  import PaywallRenderer from './components/PaywallRenderer.svelte';
  import type { Paywall } from './types/monorepo';

  let { 'settings-url': settingsUrl, template = 'ARTICLE' }: PaywallProps = $props();

  let paywall = $state<Paywall>();

  $effect(() => {
    (async () => {
      const response = await fetch(settingsUrl);
      paywall = await response.json();
    })();
  });
</script>

<Base let:api let:t>
  {#if paywall}
    <PaywallRenderer {paywall} horizontal={template === 'BOXES'} {t} />
  {/if}
</Base>
