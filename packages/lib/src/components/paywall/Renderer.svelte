<script lang="ts">
  import Column from '../Column.svelte';
  import Icon from '../Icon.svelte';
  import PaymentMethod from '../PaymentMethod.svelte';
  import Row from '../Row.svelte';
  import Button from '../../Button.wc.svelte';
  import Features from '../Features.svelte';
  import { twMerge } from 'tailwind-merge';
  import type { TranslationFunction } from '../../i18n';
  import { hexToHsl } from '../../utils/color';
  import type { Paywall, PaywallSubscription } from '../../types/Paywall';
  import type { IconName } from '../../icons/types';
  import Subscriptions from './Subscriptions.svelte';
  import SinglePurchase from './SinglePurchase.svelte';
  import type { SesamyAPI } from '@sesamy/sesamy-js';
  import type { Checkout } from '@sesamy/sdk';
  import type { PaywallProps } from '../../types';
  import Error from '../Error.svelte';
  import PayNowForm from './PayNowForm.svelte';
  import NotLoggedIn from '../NotLoggedIn.svelte';
  import { parsePrice } from '../../utils/money';
  import { goToCheckout } from '../../utils/checkout';

  type Props = {
    api: SesamyAPI;
    host: HTMLElement;
    paywall: Paywall;
    t: TranslationFunction;
    horizontal?: boolean;
  } & PaywallProps;

  type Product = PaywallSubscription & { features: string[] };

  let { api, t, horizontal = false, host, paywall, ...userProps }: Props = $props();

  let product = $state<Product>();
  let checkout = $state<Checkout>();
  let loading = $state(false);
  let error = $state('');

  const singlePurchasePrice = userProps?.['price']
    ? parsePrice(userProps['price'])
    : api.content.get(host)?.price;
  const articleUrl = userProps?.['item-src'] || api.content.get(host)?.url;
  const redirectUrl = userProps?.['redirect-url'] || window.location.href;

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

  const checkAccess = async () => {
    if (horizontal) return false;

    const passes = userProps?.pass
      ? userProps.pass.split(';')
      : api.content.get(host)?.pass?.split(';');

    const hasAccess = await api.entitlements.hasAccess(articleUrl || '', passes);

    api.events.emit('sesamyPaywallAccessChecked', {
      hasAccess,
      paywallId: paywall.id,
      articleUrl,
      passes
    });

    return hasAccess;
  };

  const createCheckout = async (e: SubmitEvent) => {
    error = '';
    e.preventDefault();
    if (!product) return;

    loading = true;

    if (product?.url && product?.url !== articleUrl) {
      window.location.assign(product.url);
      return;
    }

    const item = product?.url
      ? { url: product.url }
      : { sku: product.sku, purchaseOptionId: product.poId };

    try {
      checkout = await api.checkouts.create({
        items: [item],
        requestedDiscountCodes: product.discountCode ? [product.discountCode] : undefined,
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

      api.events.emit('sesamyPaywallProductSelected', {
        product,
        checkoutId: checkout.id,
        paywallId: paywall.id
      });

      loading = false;

      if (product.preferBusiness) {
        goToCheckout(checkout, undefined, true);
      }
    } catch (err) {
      console.error(err);
      error = t('something_went_wrong');
      loading = false;
      return;
    }
  };

  const selectProduct = (option: PaywallSubscription) => {
    error = '';
    product = {
      ...option,
      features:
        Array.isArray(option.features) && option.features.length > 0
          ? option.features
          : Array.isArray(features)
            ? features
            : []
    };
  };

  const onResetCheckout = () => {
    api.events.emit('sesamyPaywallResetCheckout', {
      paywallId: paywall.id
    });
    checkout = undefined;
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

  const paywallBgColor =
    styling?.showBackground && styling?.backgroundColor ? styling.backgroundColor : '#FFFFFF';
  const autoDarkMode = styling?.showBackground && hexToHsl(paywallBgColor)[2] < 50;
  const paywallTextColor = autoDarkMode ? '#FFFFFF' : '#000000';
  const autoBtnColor = hexToHsl(mainColor)[2] < 60 ? '#FFFFFF' : '#000000';

  let darkMode = $state(autoDarkMode);

  let sesamyPaywallDesignTokens = `
    :host * {
      --s-primary-color: var(--sesamy-paywall-primary-color, ${mainColor});
      --s-paywall-bg-color: var(--sesamy-paywall-bg-color, ${paywallBgColor});
      --s-paywall-text-color: var(--sesamy-paywall-text-color, ${paywallTextColor});
      --s-paywall-text-color-70: var(--s-paywall-text-color);
      --s-paywall-text-color-70: color-mix(in srgb, var(--s-paywall-text-color) 70%, transparent);
      --s-paywall-border-radius: var(--sesamy-paywall-border-radius, 0.5rem);
      --s-paywall-border-radius-desktop: var(--sesamy-paywall-border-radius-desktop, calc(var(--s-paywall-border-radius) * 3));
      --s-paywall-theme: var(--sesamy-paywall-theme, ${autoDarkMode ? 'dark' : 'light'});
      --s-paywall-btn-bg-color: var(--sesamy-paywall-btn-bg-color, var(--s-primary-color));
      --s-paywall-btn-text-color: var(--sesamy-paywall-btn-text-color, ${autoBtnColor});
    }
  `;

  let style = '<sty' + 'le>' + sesamyPaywallDesignTokens + '</style>';

  // Check for dark mode override from CSS variable
  $effect(() => {
    const computedStyle = getComputedStyle(host);
    const darkModeVar = computedStyle.getPropertyValue('--sesamy-paywall-theme').trim();

    if (darkModeVar === 'dark') {
      darkMode = true;
    } else if (darkModeVar === 'light') {
      darkMode = false;
    } else {
      darkMode = autoDarkMode;
    }
  });
</script>

{#await checkAccess() then hasAccess}
  {#if !hasAccess}
    <div class="@container">
      <Column
        class={twMerge(
          'w-full py-4 @md:py-6 rounded-[var(--s-paywall-border-radius)] @xl:rounded-[var(--s-paywall-border-radius-desktop)] bg-[var(--s-paywall-bg-color)] text-[var(--s-paywall-text-color)]',
          styling?.showBackground && styling?.dropShadow && 'shadow-md @xl:shadow-lg',
          darkMode && 'dark'
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
                class="w-full h-px from-transparent bg-gradient-to-r to-transparent via-primary opacity-30"
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

          <svelte:element this={'slot'} name="below-headline" />

          {#if product && !horizontal}
            <svelte:element this={'slot'} name="features">
              <Features features={product.features} class="font-bold mb-2" />
            </svelte:element>
          {/if}

          {#if checkout && !product?.preferBusiness}
            <PayNowForm {api} {paywall} {checkout} {t} {onResetCheckout} />
          {:else}
            <form class="contents" onsubmit={createCheckout}>
              {#if subscriptions.length}
                <Subscriptions
                  {api}
                  {horizontal}
                  {subscriptions}
                  {t}
                  {currency}
                  {selectProduct}
                  {redirectUrl}
                />
              {/if}

              {#if !horizontal}
                {#if singlePurchase?.enabled && singlePurchasePrice && articleUrl}
                  <SinglePurchase
                    {singlePurchase}
                    {currency}
                    {singlePurchasePrice}
                    {articleUrl}
                    {t}
                    {selectProduct}
                    {hasSubscriptions}
                    {...userProps}
                  />
                {/if}

                <Button
                  {loading}
                  disabled={loading}
                  class="mt-2 w-full shadow-md bg-[var(--s-paywall-btn-bg-color)] text-[var(--s-paywall-btn-text-color)]"
                  type="submit"
                >
                  {t('continue')}
                </Button>
              {/if}
            </form>
          {/if}
          {#if error}
            <Error text={error} />
          {/if}

          <div class="gap-3 row !justify-between w-full mt-4 @md:mt-8">
            <Row up left class="gap-2 text-xs !flex-nowrap text-[var(--s-paywall-text-color-70)]">
              <Icon name="lock" class="my-px" />
              <span>
                {@html t('powered_by_sesamy', {
                  0: (text) =>
                    `<a class="whitespace-nowrap text-[var(--s-paywall-text-color)]" href="https://sesamy.com/?utm_source=${encodeURIComponent(vendorId)}&utm_medium=referral&utm_campaign=paywall_component" target="_blank" rel="noopener">${text}</a>`
                })}
              </span>
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
  {/if}
{/await}

{@html style}
