<svelte:options customElement="sesamy-paywall" />

<script lang="ts">
  import Base from './Base.svelte';
  import type { PaywallProps } from './types';
  import Renderer from './components/paywall/Renderer.svelte';
  import type { Paywall } from './types/Paywall';
  import LoginRenderer from './components/paywall/LoginRenderer.svelte';

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
  {@const host = $host()}
  {@const content = host ? api.content.get(host) : null}

  {#if paywall}
    {@const accessLevel = content?.accessLevel}

    {#if accessLevel === 'entitlement'}
      <Renderer
        {api}
        {paywall}
        horizontal={template === 'BOXES'}
        {host}
        {t}
        {...{ ...restProps, template }}
      />
    {:else if accessLevel === 'logged-in'}
      <LoginRenderer {api} {...{ ...restProps, template }} />
    {/if}
  {/if}
</Base>
