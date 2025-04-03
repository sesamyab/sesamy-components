<svelte:options customElement="sesamy-paywall" />

<script lang="ts">
  import Base from './Base.svelte';
  import type { PaywallProps } from './types';
  import Renderer from './components/paywall/Renderer.svelte';
  import type { Paywall } from './types/Paywall';
  import LoginRenderer from './components/paywall/LoginRenderer.svelte';

  let props: PaywallProps = $props();

  let paywall = $state<Paywall>();
  let template = $state<string>();

  $effect(() => {
    (async () => {
      const response = await fetch(props['settings-url']);
      paywall = await response.json();
      template = paywall?.settings.template || undefined;
    })();
  });
</script>

<Base let:api let:t>
  {@const host = $host()}
  {#if props['settings-url']}
    <div class="sesamy-paywall" style="display: contents">
      <slot {api} {t} {...props} />
    </div>
  {/if}

  {#if !paywall}
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
      <LoginRenderer {api} {t} {paywall} {...props}>
        <div slot="below-headline">
          <slot name="below-headline" />
        </div>
      </LoginRenderer>
    {/if}
  {/if}
</Base>
