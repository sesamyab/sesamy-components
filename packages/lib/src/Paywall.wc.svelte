<svelte:options customElement="sesamy-paywall" />

<script lang="ts">
  import Base from './Base.svelte';
  import type { PaywallProps } from './types';
  import Renderer from './components/paywall/Renderer.svelte';
  import type { Paywall } from './types/Paywall';

  let props: PaywallProps = $props();
  let { template = 'ARTICLE' } = props;

  let paywall = $state<Paywall>();

  $effect(() => {
    (async () => {
      const response = await fetch(props['settings-url']);
      paywall = await response.json();
    })();
  });
</script>

<Base let:api let:t>
  {#if paywall}
    <Renderer {api} {paywall} horizontal={template === 'BOXES'} {t} {...props} />
  {/if}
</Base>
