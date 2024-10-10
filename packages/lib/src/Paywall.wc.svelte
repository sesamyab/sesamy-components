<svelte:options customElement="sesamy-paywall" />

<script lang="ts">
  import Base from './Base.svelte';
  import type { IconName } from './icons/types';
  import type { Translate } from './i18n';
  import type { PaywallProps } from './types';
  import { onMount } from 'svelte';
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
  }: PaywallProps & { t: Translate  } = $props();
  let paywall = $state<{ [key: string]: any } | undefined>(undefined);

  onMount(async () => {
    const response = await fetch(settingsUrl);
    paywall = await response.json();
  });
</script>

<Base let:api let:t>
  {#if paywall}
    <PaywallRenderer {paywall} horizontal={template === 'BOXES'} {t} />
  {/if}
</Base>
