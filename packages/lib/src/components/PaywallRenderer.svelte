<script lang="ts">
  import PurchaseOptions from './../components/paywall/SelectionGroup.svelte';
  import PurchaseOption from './../components/paywall/Selection.svelte';
  import Column from './../components/Column.svelte';
  import Icon from './../components/Icon.svelte';
  import PaymentMethod from './../components/PaymentMethod.svelte';
  import Row from './../components/Row.svelte';
  import Button from './Button.svelte';
  import type { IconName } from './../icons/types';
  import Features from './../components/Features.svelte';
  import { twMerge } from 'tailwind-merge';
  import type { TranslationFunction } from '../i18n';
  import { hexToHsl, hslArrayToCSS } from './../utils/color';
  import Clickable from './Clickable.svelte';

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

  type Props = {
    t: TranslationFunction;
    horizontal?: boolean;
    paywall: { [key: string]: any }; // TODO: type define paywall props
  };

  let { t, horizontal = false, paywall }: Props = $props();

  const {
    subscriptions,
    currency,
    mainColor,
    features,
    settings: {
      styling: { showBackground, dropShadow, backgroundColor }
    }
  } = paywall;

  const paywallBgColor = hexToHsl(backgroundColor || '#FFFFFF');

  let sesamyPaywallDesignTokens = `
    :host {
      --s-paywall-bg-start-color: var(--sesamy-paywall-bg-start-color, ${paywallBgColor[0]},${paywallBgColor[1]}%,${paywallBgColor[2]}%);
      --s-paywall-bg-end-color: var(--sesamy-paywall-bg-end-color, ${paywallBgColor[0]},${paywallBgColor[1]}%,${paywallBgColor[2] + (100 - paywallBgColor[2]) * 0.5}%);
      
      --s-primary-color: var(--sesamy-paywall-primary-color, ${hslArrayToCSS(hexToHsl(mainColor))});
    }
  `;

  let style = '<sty' + 'le>' + sesamyPaywallDesignTokens + '</style>';
</script>

<Column
  class={twMerge(
    'w-full pt-6 rounded-3xl',
    showBackground &&
      'bg-gradient-to-b from-[hsl(var(--s-paywall-bg-start-color))] to-[hsl(var(--s-paywall-bg-end-color))]',
    showBackground && dropShadow && 'shadow-lg'
  )}
>
  <Row class="text-sm gap-1 pt-2 font-bold">
    {t('already_subscribing')}
    <Clickable href="/" class="text-primary">Logga in</Clickable>
  </Row>

  <Column class={twMerge('gap-4 px-16 pb-16 pt-6 w-full', horizontal && 'px-6 pb-4')} up left>
    <div
      class="w-full h-px from-transparent bg-gradient-to-r to-transparent via-primary/30 mb-4"
    ></div>
    <div class={twMerge('w-full', horizontal && 'column text-center')}>
      <div class="text-3xl mt-6 font-bold">
        Läs Fokus Digital i 6 månader<br /> för bara 79kr!
      </div>
    </div>

    {#if !horizontal}
      <Features {features} />
    {/if}

    <PurchaseOptions
      class={twMerge(
        'mt-4',
        !horizontal && 'column-left',
        horizontal && 'grid-cols-3',
        horizontal && subscriptions.length === 2 && 'grid-cols-2',
        horizontal && subscriptions.length === 1 && 'flex justify-center'
      )}
      {horizontal}
    >
      {#each subscriptions as subscription, i}
        {@const { id, title, description, price, periodText, features, selected } = subscription}

        {#if horizontal}
          <Column
            class={twMerge(
              'border bg-white border-gray-300 rounded',
              selected && 'border-primary/75 mt-0 border-2 '
            )}
          >
            {#if selected}
              <Row class="w-full bg-primary/75 h-8 text-white text-sm font-bold">Mest populärt</Row>
            {/if}

            <Column class="p-4 flex-1 w-full !justify-between gap-8" left up>
              <Column class="gap-1" left>
                <div class="text-sm text-gray-600">{title}</div>
                <div class="text-2xl font-bold mb-4 leading-none">
                  {price}
                  {currency} / {periodText}
                </div>

                <Features {features} />
              </Column>

              <Button class="w-full mt-2" variant="secondary">Gå vidare</Button>
            </Column>
          </Column>
        {:else}
          {#if i}
            <hr class="w-full border-gray-100" />
          {/if}
          <PurchaseOption {id} name="purchase-option" checked>
            <Column left>
              <div class="text-base font-bold">{title}</div>
              {#if description}
                <div class="text-sm">
                  {description}
                </div>
              {/if}
            </Column>
            <div class="text-base font-bold">{price} {currency} / {periodText}</div>
          </PurchaseOption>
        {/if}
      {/each}
    </PurchaseOptions>

    {#if !horizontal}
      <PurchaseOptions>
        <PurchaseOption id="five" name="purchase-option">
          <Column left>
            <div class="text-base font-bold">Lås upp artikeln</div>
            <div class="text-sm">
              Betala snabbt och smidigt med och få tillgång til artikeln direkt.
            </div>
          </Column>
          <div class="text-base font-bold">19 kr</div>
        </PurchaseOption>
      </PurchaseOptions>

      <Button class="mt-2 w-full shadow-md" onclick={() => console.info('continue')}
        >Continue</Button
      >
    {/if}

    <Row class="!justify-between w-full mt-8">
      <Row class="gap-2 text-[#5F6D85] text-xs">
        <Icon name="lock" />Säker SSL-krypterad betalning
      </Row>
      <Row class="gap-2">
        {#each paymentMethods as paymentMethod}
          <PaymentMethod name={paymentMethod} />
        {/each}
      </Row>
    </Row>
  </Column>
</Column>
{@html style}
<!-- <pre class="text-xs">
    {JSON.stringify(paywall, null, 2)}
  </pre> -->
