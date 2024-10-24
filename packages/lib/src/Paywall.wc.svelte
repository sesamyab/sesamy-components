<svelte:options customElement="sesamy-paywall" />

<script lang="ts">
  import Base from './Base.svelte';
  import type { PaywallProps } from './types';
  import Renderer from './components/paywall/Renderer.svelte';
  import type { Paywall } from './types/Paywall';

  let { template = 'ARTICLE', ...restProps }: PaywallProps = $props();

  let paywall = $state<Paywall>();

  $effect(() => {
    (async () => {
      const response = await fetch(restProps['settings-url']);
      paywall = await response.json();
    })();
  });
</script>

<Base let:api let:t>
  {#if paywall}
    <Renderer {api} {paywall} horizontal={template === 'BOXES'} {t} {...restProps} />
  {/if}
</Base>
