<svelte:options customElement="sesamy-paywall" />

<script lang="ts">
  import Base from './Base.svelte';
  import type { IconName } from './icons/types';
  import type { PaywallProps } from './types';
  import PaywallRenderer from './components/PaywallRenderer.svelte';

  const paymentMethods = [
    'visa',
    'apple-pay',
    'google-pay',
    'klarna',
    'amex',
    'mastercard',
    'vipps',
    'swish'
  ] as IconName[];

  let {
    'settings-url': settingsUrl,
    template = 'ARTICLE',
    t
  }: PaywallProps & { t: { [key: string]: string } } = $props();
  let paywall = $state<{ [key: string]: any } | undefined>(undefined);

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
