<script lang="ts">
  import PurchaseOptions from './../components/PurchaseOptions.svelte';
  import PurchaseOption from './../components/PurchaseOption.svelte';
  import Column from './../components/Column.svelte';
  import Icon from './../components/Icon.svelte';
  import PaymentMethod from './../components/PaymentMethod.svelte';
  import Row from './../components/Row.svelte';
  import Button from './../Button.wc.svelte';
  import Features from './../components/Features.svelte';
  import { twMerge } from 'tailwind-merge';
  import type { TranslationFunction } from '../i18n';
  import { hexToHsl, hslArrayToCSS } from './../utils/color';
  import Clickable from './Clickable.svelte';
  import type { Paywall } from 'src/types/monorepo';
  import type { IconName } from 'src/icons/types';
  import Tag from './Tag.svelte';

  type Props = {
    t: TranslationFunction;
    horizontal?: boolean;
    paywall: Paywall;
  };

  let { t, horizontal = false, paywall }: Props = $props();
  let selectedFeatures = $state([]);

  let {
    subscriptions,
    singlePurchase,
    headline,
    currency,
    mainColor,
    showLoginButton,
    features,
    footerPaymentMethods,
    logoUrl,
    vendorId,
    settings: {
      useDefaultLogo,
      styling: { showBackground, dropShadow, backgroundColor }
    }
  } = paywall;

  const selectPurchaseOption = (option: any) => {
    // console.log(option);
    // TODO: decide if we should remove "features" from shallow paywall. And if so, if we should add it to singlePurchase.
    selectedFeatures = option?.features || features;
  };

  if (subscriptions.length) {
    const selected = subscriptions.find(({ selected }) => selected);
    selectPurchaseOption(selected);
  }

  const paywallBgColor = hexToHsl(backgroundColor || '#FFFFFF');

  let sesamyPaywallDesignTokens = `
    :host {
      --s-paywall-bg-start-color: var(--sesamy-paywall-bg-start-color, ${paywallBgColor[0]},${paywallBgColor[1]}%,${paywallBgColor[2]}%);
      --s-paywall-bg-end-color: var(--sesamy-paywall-bg-end-color, ${paywallBgColor[0]},${paywallBgColor[1]}%,${paywallBgColor[2] + (100 - paywallBgColor[2]) * 0.5}%);
      
      --s-primary-color: var(--sesamy-paywall-primary-color, ${hslArrayToCSS(hexToHsl(mainColor))}) !important;
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
  <Column class={twMerge('gap-4 px-16 pb-8 pt-0 w-full', horizontal && 'px-6 pb-4')} up left>
    {#if showLoginButton}
      <Row class="text-sm gap-1 font-bold w-full">
        {t('already_subscribing')}

        <Clickable href="/" class="text-primary">{t('login')}</Clickable>
      </Row>
      <div
        class="w-full h-px from-transparent bg-gradient-to-r to-transparent via-primary/30"
      ></div>
    {/if}

    <div class={twMerge('w-full pt-4', horizontal && 'column text-center mb-4')}>
      {#if useDefaultLogo}
        <img class="h-7 mb-6" src={logoUrl} alt={`${t('logo_of')} ${vendorId}`} />
      {/if}
      <div class="text-3xl font-bold max-w-[440px]">
        {headline}
      </div>
    </div>

    {#if !horizontal}
      <Features features={selectedFeatures} bold />
    {/if}

    {#if subscriptions.length}
      <PurchaseOptions
        class={twMerge(
          'mt-2',
          !horizontal && 'column-left',
          horizontal && 'grid-cols-3',
          horizontal && subscriptions.length === 2 && 'grid-cols-2',
          horizontal && subscriptions.length === 1 && 'flex justify-center'
        )}
        {horizontal}
      >
        {#each subscriptions as subscription, i}
          {@const {
            id,
            title,
            description,
            price,
            periodText,
            features,
            selected,
            tag,
            buttonText,
            url
          } = subscription}

          {#if horizontal}
            <Column
              class={twMerge(
                'border bg-white border-gray-300 rounded-lg relative',
                tag && 'border-primary mt-0 border-2'
              )}
            >
              {#if tag}
                <Tag text={tag} {t} chunky />
              {/if}

              <Column class="p-4 flex-1 w-full !justify-between gap-8 shadow-md" left up>
                <Column class="gap-1 p-2" left>
                  <div class="text-lg font-bold mb-1">{title}</div>
                  {#if typeof price === 'number'}
                    <div class="d mb-4 leading-none">
                      <span class="font-bold text-4xl">
                        {price}
                        {currency}
                      </span> <span class="text-2xl">/ {periodText}</span>
                    </div>
                  {/if}

                  {#if features}
                    <Features {features} />
                  {/if}
                </Column>

                <Button href={url} class="w-full mt-2" variant={tag ? 'primary' : 'secondary'}>
                  {buttonText || t('continue')}
                </Button>
              </Column>
            </Column>
          {:else}
            {#if i}
              <hr class="w-full border-gray-100" />
            {/if}
            <PurchaseOption
              {id}
              name="purchase-option"
              checked={selected}
              onchange={() => selectPurchaseOption(subscription)}
            >
              <Column left>
                <div class="text-base font-bold">{title}</div>
                {#if description}
                  <div class="text-sm">
                    {description}
                  </div>
                {/if}
              </Column>
              <div class="text-base font-bold">{price} {currency} / {periodText}</div>
              {#if tag}
                <Tag text={tag} {t} />
              {/if}
            </PurchaseOption>
          {/if}
        {/each}
      </PurchaseOptions>
    {/if}

    {#if singlePurchase && singlePurchase.enabled && !horizontal}
      {@const { title, description } = singlePurchase}
      <PurchaseOptions>
        <PurchaseOption
          id="five"
          name="purchase-option"
          onchange={() => selectPurchaseOption(singlePurchase)}
        >
          <Column left>
            <div class="text-base font-bold">{title}</div>
            <div class="text-sm">
              {description}
            </div>
          </Column>
          <div class="text-base font-bold">TODO</div>
        </PurchaseOption>
      </PurchaseOptions>

      <Button class="mt-2 w-full shadow-md" onclick={() => console.info('continue')}>
        {t('continue')}
      </Button>
    {/if}

    <Row class="!justify-between w-full mt-8">
      <Row class="gap-2 text-[#5F6D85] text-xs">
        <Icon name="lock" />{t('secure_payment')}
      </Row>
      <Row class="gap-2">
        {#each footerPaymentMethods as IconName[] as paymentMethod}
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
