<script lang="ts">
  import Column from '../Column.svelte';
  import Icon from '../Icon.svelte';
  import PaymentMethod from '../PaymentMethod.svelte';
  import Row from '../Row.svelte';
  import Button from '../../Button.wc.svelte';
  import Features from '../Features.svelte';
  import { twMerge } from 'tailwind-merge';
  import type { TranslationFunction } from '../../i18n';
  import { hexToHsl, hslArrayToCSS } from '../../utils/color';
  import type { Paywall, PaywallSubscription } from 'src/types/Paywall';
  import type { IconName } from 'src/icons/types';
  import Subscriptions from './Subscriptions.svelte';
  import SinglePurchase from './SinglePurchase.svelte';
  import type { SesamyAPI, Checkout } from '@sesamy/sesamy-js';
  import type { PaywallProps } from 'src/types';
  import Error from '../Error.svelte';
  import PayNowForm from './PayNowForm.svelte';
  import NotLoggedIn from '../NotLoggedIn.svelte';

  type Props = {
    api: SesamyAPI;
    host: HTMLElement;
    paywall: Paywall;
    t: TranslationFunction;
    horizontal?: boolean;
  } & PaywallProps;

  type Product = PaywallSubscription & {
    features: string[];
  };

  let { api, t, horizontal = false, host, paywall, ...userProps }: Props = $props();

  let product = $state<Product>();
  let checkout = $state<Checkout>();
  let loading = $state(false);
  let error = $state('');

  const redirectUrl = userProps?.['redirect-url'] || window.location.href;

  const articleElement = host.closest('sesamy-article');

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
    settings: { useDefaultLogo, styling }
  } = paywall;

  const createCheckout = async (e: SubmitEvent) => {
    error = '';
    e.preventDefault();
    if (!product) return;

    loading = true;

    const item = product?.url
      ? {
          url: product.url
        }
      : {
          sku: product.sku,
          purchaseOptionId: product.poId
        };

    try {
      checkout = await api.checkouts.create({
        vendorId,
        items: [item],
        discountCode: product.discountCode,
        redirectUrl,
        price: product.price,
        currency,
        attribution: {
          utmSource: userProps?.['utm-source'],
          utmMedium: userProps?.['utm-medium'],
          utmCampaign: userProps?.['utm-campaign'],
          utmTerm: userProps?.['utm-term'],
          utmContent: userProps?.['utm-content'],
          source: 'PAYWALL',
          sourceId: paywall.id
        }
      });
    } catch (err) {
      console.error(err);
      error = t('something_went_wrong');
      loading = false;
      return;
    }
  };

  const selectProduct = (option: PaywallSubscription) => {
    error = '';
    // TODO: decide if we should remove "features" from shallow paywall. And if so, if we should add it to singlePurchase.
    product = {
      ...option,
      features: option?.features || features
    };
  };

  const hasSubscriptions = subscriptions.length > 0;
  if (hasSubscriptions) {
    const selected = subscriptions.find(({ selected }) => selected);
    if (selected) {
      selectProduct(selected);
    } else {
      subscriptions[0].selected = true;
      selectProduct(subscriptions[0]);
    }
  }

  const paywallBgColor = hexToHsl(styling?.backgroundColor || '#FFFFFF');

  let sesamyPaywallDesignTokens = `
    :host * {
      --s-paywall-bg-start-color: var(--sesamy-paywall-bg-start-color, ${paywallBgColor[0]},${paywallBgColor[1]}%,${paywallBgColor[2]}%);
      --s-paywall-bg-end-color: var(--sesamy-paywall-bg-end-color, ${paywallBgColor[0]},${paywallBgColor[1]}%,${paywallBgColor[2] + (100 - paywallBgColor[2]) * 0.5}%);
      --s-primary-color: var(--sesamy-paywall-primary-color, ${hslArrayToCSS(hexToHsl(mainColor))}) !important;
    }
  `;

  let style = '<sty' + 'le>' + sesamyPaywallDesignTokens + '</style>';
</script>

<div class="@container">
  <Column
    class={twMerge(
      'w-full py-4 @md:py-6 rounded-lg @xl:rounded-3xl',
      styling?.showBackground &&
        'bg-gradient-to-b from-[hsl(var(--s-paywall-bg-start-color))] to-[hsl(var(--s-paywall-bg-end-color))]',
      styling?.showBackground && styling?.dropShadow && 'shadow-md @xl:shadow-lg'
    )}
  >
    <Column
      class={twMerge(
        'gap-2 @md:gap-4 pt-0 w-full',
        styling?.showBackground && 'px-2 pb-6 @xs:px-8 @md:pb-8 @3xl:px-16',
        horizontal && styling?.showBackground && 'px-6 pb-4',
        !horizontal && 'max-w-[800px]'
      )}
      up
      left
    >
      <NotLoggedIn {api}>
        {#if showLoginButton && !horizontal}
          <Row class="text-sm gap-1 font-bold w-full">
            <div>
              {t('already_subscribing')}
            </div>

            <sesamy-login
              class="p-0 border-none enabled:hover:bg-transparent hover:underline text-primary font-bold"
            ></sesamy-login>
          </Row>
          <div
            class="w-full h-px from-transparent bg-gradient-to-r to-transparent via-primary/30"
          ></div>
        {/if}
      </NotLoggedIn>

      <div class={twMerge('w-full pt-2 @md:pt-4', horizontal && 'column text-center mb-6')}>
        {#if useDefaultLogo}
          <img class="h-7 mb-6" src={logoUrl} alt={`${t('logo_of')} ${vendorId}`} />
        {/if}
        <div class="text-2xl leading-tight @md:text-3xl font-bold max-w-[600px]">
          {headline}
        </div>
      </div>

      {#if product && !horizontal}
        <Features features={product.features} class="font-bold text-black mb-2" />
      {/if}

      {#if checkout}
        <PayNowForm {api} {checkout} {t} />
      {:else}
        <form class="contents" onsubmit={createCheckout}>
          {#if subscriptions.length}
            <Subscriptions
              {horizontal}
              {subscriptions}
              {t}
              {currency}
              {selectProduct}
              {redirectUrl}
            />
          {/if}

          {#if singlePurchase && singlePurchase.enabled && !horizontal}
            <SinglePurchase
              {api}
              {singlePurchase}
              {t}
              {selectProduct}
              {hasSubscriptions}
              {articleElement}
              {...userProps}
            />
          {/if}

          {#if !horizontal}
            <Button {loading} disabled={loading} class="mt-2 w-full shadow-md" type="submit">
              {t('continue')}
            </Button>
          {/if}
        </form>
      {/if}
      {#if error}
        <Error text={error} />
      {/if}

      <div class="column gap-4 @md:row !justify-between w-full mt-4 @md:mt-8">
        <Row class="gap-2 text-[#5F6D85] text-xs">
          <Icon name="lock" />{t('secure_payment')}
        </Row>
        <Row class="gap-2">
          {#each footerPaymentMethods as IconName[] as paymentMethod}
            <PaymentMethod name={paymentMethod} />
          {/each}
        </Row>
      </div>
    </Column>
  </Column>
</div>

{@html style}
