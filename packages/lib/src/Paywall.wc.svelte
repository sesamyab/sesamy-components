<svelte:options customElement="sesamy-paywall" />

<script lang="ts">
  import Base from './Base.svelte';
  import type { PaywallProps } from './types';
  import Renderer from './components/paywall/Renderer.svelte';
  import type { Paywall } from './types/Paywall';

  let { template, ...restProps }: PaywallProps = $props();

  let paywall = $state<Paywall>();

  $effect(() => {
    (async () => {
      const response = await fetch(restProps['settings-url']);
      paywall = await response.json();
      if (!template && paywall?.settings?.template) {
        template = paywall.settings.template;
      }
    })();
  });
</script>

<Base let:api let:t>
  {#if paywall}
    <Renderer
      {api}
      {paywall}
      horizontal={template === 'BOXES'}
      host={$host()}
      {t}
      {...{ ...restProps, template }}
    />
  {/if}
</Base>
