<script lang="ts">
  import type { SesamyAPI } from '@sesamy/sesamy-js';
  import emailSpellChecker from '@zootools/email-spell-checker';
  import { onDestroy } from 'svelte';
  import { twMerge } from 'tailwind-merge';
  import type { TranslationFunction } from '../../i18n';
  import type { Paywall, PaywallSubscription } from '../../types/Paywall';
  import type { PaywallProps } from '../../types';
  import Column from '../Column.svelte';
  import Row from '../Row.svelte';
  import Button from '../Button.svelte';
  import Input from '../Input.svelte';
  import InputGroup from '../InputGroup.svelte';
  import Icon from '../Icon.svelte';
  import Error from '../Error.svelte';
  import Features from '../Features.svelte';
  import DescriptionWithReadMore from './DescriptionWithReadMore.svelte';
  import PaymentMethod from '../PaymentMethod.svelte';
  import type { IconName } from '../../icons/types';
  import { isLight } from '../../utils/color';
  import { isValidEmail } from '../../utils/email';
  import {
    goToCheckout,
    resolveRedirectLabel,
    resolveRedirectUrl,
    utmAttribution
  } from '../../utils/checkout';
  import { dispatchSesamyEvent } from '../../events';
  import { resolveItemSrc, track } from '../../tracking';

  type Props = {
    api: SesamyAPI;
    host: HTMLElement;
    paywall: Paywall;
    t: TranslationFunction;
    accessDenied?: boolean;
    onShown?: () => void;
    onAccessGranted?: () => void;
  } & PaywallProps;

  let {
    accessDenied = false,
    api,
    t,
    host,
    paywall,
    onShown,
    onAccessGranted,
    ...userProps
  }: Props = $props();

  let email = $state('');
  let emailSuggestion = $state('');
  let suggestionTimeout: ReturnType<typeof setTimeout>;
  let loading = $state(false);
  let error = $state('');
  let showLogin = $state(false);

  const contentArticle = api.content.get(host);
  const articleUrl = userProps?.['item-src'] || contentArticle?.url;

  let {
    subscriptions,
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
      styling,
      redirectUrl: paywallRedirectUrl,
      redirectLabel: paywallRedirectLabel
    }
  } = paywall;

  // The email template sells a single offer: the selected option, or the first
  // one. Its description is the sub-headline and its features (or the
  // paywall-wide ones) the list of benefits.
  const product: PaywallSubscription | undefined =
    subscriptions.find(({ selected }) => selected) || subscriptions[0];
  const productFeatures =
    Array.isArray(product?.features) && product.features.length > 0
      ? product.features
      : Array.isArray(features)
        ? features
        : [];

  onDestroy(() => clearTimeout(suggestionTimeout));

  const checkAccess = async () => {
    const passes = userProps?.pass
      ? userProps.pass.split(';')
      : api.content.get(host)?.pass?.split(';');

    const hasAccess = accessDenied
      ? false
      : await api.entitlements.hasAccess(articleUrl || '', passes);

    api.events.emit('sesamyPaywallAccessChecked', {
      hasAccess,
      paywallId: paywall.id,
      articleUrl,
      passes
    });

    if (hasAccess) {
      onAccessGranted?.();
      dispatchSesamyEvent(host, 'sesamy:access-granted', {
        scopes: passes ?? []
      });
      return true;
    }

    onShown?.();
    let isAuthed = false;
    try {
      isAuthed = await api.auth.isAuthenticated();
    } catch (error) {
      console.error('Auth check failed:', error);
    }
    if (isAuthed) {
      // A logged-in reader without access buys with the account they are
      // logged in with, so the address is filled in for them.
      const user = await api.auth.getUser().catch(() => null);
      if (typeof user?.email === 'string' && !email) email = user.email;
    } else {
      showLogin = showLoginButton;
    }
    dispatchSesamyEvent(host, 'sesamy:paywall-shown', {
      reason: isAuthed ? 'no-entitlement' : 'unauthenticated'
    });

    return false;
  };

  const provideSuggestion = () => {
    clearTimeout(suggestionTimeout);

    suggestionTimeout = setTimeout(() => {
      emailSuggestion =
        emailSpellChecker.run({
          email
        })?.full || '';
    }, 400);
  };

  const createCheckout = async (event: SubmitEvent) => {
    event.preventDefault();
    if (!product || loading) return;

    // An option that sends the reader to an external URL doesn't use the
    // address, so it neither needs nor validates one.
    const externalUrl = product.url && product.url !== articleUrl ? product.url : undefined;
    const address = email.trim();
    if (!externalUrl && !isValidEmail(address)) {
      error = t('invalid_email');
      return;
    }

    error = '';
    loading = true;

    track(api, 'addToCart', {
      itemSrc: resolveItemSrc(articleUrl),
      publisherContentId: contentArticle?.id,
      sku: product.sku,
      purchaseOptionId: product.poId,
      price: product.price,
      currency,
      paywallId: paywall.id
    });

    if (externalUrl) {
      window.location.assign(externalUrl);
      return;
    }

    const item = product.url
      ? { url: product.url }
      : { sku: product.sku, purchaseOptionId: product.poId };

    try {
      const checkoutPayload = {
        items: [item],
        email: address,
        requestedDiscountCodes: product.discountCode ? [product.discountCode] : undefined,
        redirectUrl: resolveRedirectUrl(
          product.redirectUrl,
          paywallRedirectUrl,
          userProps?.['redirect-url']
        ),
        redirectLabel: resolveRedirectLabel(
          product.redirectLabel,
          paywallRedirectLabel,
          userProps?.['redirect-label']
        ),
        price: product.price,
        currency,
        attribution: {
          ...utmAttribution(userProps),
          ...(articleUrl ? { itemSrc: articleUrl } : {}),
          source: 'PAYWALL' as const,
          sourceId: paywall.id,
          ...(paywall.decisionId ? { decisionId: paywall.decisionId } : {}),
          ...(paywall.strategyId ? { strategyId: paywall.strategyId } : {})
        }
      };

      // The address is part of the payload, so a listener that forwards the
      // payload anywhere is handling personal data.
      const createEvent = api.events.emit(
        'sesamyPaywallCreateCheckout',
        {
          payload: checkoutPayload,
          product,
          paywallId: paywall.id
        },
        true
      );

      if (createEvent.canceled) {
        loading = false;
        return;
      }

      const createdCheckout = await api.checkouts.create(checkoutPayload);

      api.events.emit('sesamyPaywallProductSelected', {
        product,
        checkoutId: createdCheckout.id,
        paywallId: paywall.id
      });

      goToCheckout(createdCheckout);
    } catch (err) {
      console.error(err);
      error = t('something_went_wrong');
      loading = false;
    }
  };

  const paywallBgColor =
    styling?.showBackground && styling?.backgroundColor ? styling.backgroundColor : '#FFFFFF';
  const darkMode = styling?.showBackground && !isLight(paywallBgColor);
  const paywallTextColor = darkMode ? '#FFFFFF' : '#000000';
  const autoBtnColor = isLight(mainColor) ? '#000000' : '#FFFFFF';

  let sesamyPaywallDesignTokens = `
    :host * {
      --s-primary-color: var(--sesamy-paywall-primary-color, ${mainColor});
      --s-paywall-bg-color: var(--sesamy-paywall-bg-color, ${paywallBgColor});
      --s-paywall-text-color: var(--sesamy-paywall-text-color, ${paywallTextColor});
      --s-paywall-text-color-70: var(--s-paywall-text-color);
      --s-paywall-text-color-70: color-mix(in srgb, var(--s-paywall-text-color) 70%, transparent);
      --s-login-button-default-text-color: var(--s-paywall-text-color);
      --s-login-button-default-text-size: var(--s-base-font-size, 16px);
      --s-paywall-border-radius: var(--sesamy-paywall-border-radius, calc(0.5 * var(--s-base-font-size, 16px)));
      --s-paywall-border-radius-desktop: var(--sesamy-paywall-border-radius-desktop, calc(var(--s-paywall-border-radius) * 3));
      --s-paywall-btn-bg-color: var(--sesamy-paywall-btn-bg-color, var(--s-primary-color));
      --s-paywall-btn-text-color: var(--sesamy-paywall-btn-text-color, ${autoBtnColor});
      --s-paywall-headline-font-family: var(--sesamy-paywall-headline-font-family, var(--s-font-family));
      --s-paywall-headline-font-weight: var(--sesamy-paywall-headline-font-weight, 700);
      --s-paywall-max-width: var(--sesamy-paywall-max-width, calc(30.625 * var(--s-base-font-size, 16px)));
    }
  `;

  let style = '<sty' + 'le>' + sesamyPaywallDesignTokens + '</style>';
</script>

{#if product}
  {#await checkAccess().catch((err) => {
    console.error('Access check failed:', err);
    return true;
  }) then hasAccess}
    {#if !hasAccess}
      <div class="@container" style="font-size: var(--s-base-font-size, 16px)">
        <!-- A compact, centered card: one offer, one field, one button. -->
        <form
          onsubmit={createCheckout}
          novalidate
          class={twMerge(
            'mx-auto w-full max-w-[var(--s-paywall-max-width)] rounded-[var(--s-paywall-border-radius)] bg-[var(--s-paywall-bg-color)] text-[var(--s-paywall-text-color)]',
            styling?.showBackground && 'px-5 py-8 @sm:px-10 @sm:pt-6 @sm:pb-10',
            styling?.showBackground && styling?.dropShadow && 'shadow-md @xl:shadow-lg',
            darkMode && 'dark'
          )}
        >
          <Column class="w-full gap-4 text-center">
            {#if useDefaultLogo}
              <img class="h-8 max-w-full" src={logoUrl} alt={`${t('logo_of')} ${vendorId}`} />
              <div class="w-full h-px bg-gray-200 dark:bg-gray-700"></div>
            {/if}

            <Column class="w-full gap-2">
              <div
                class="text-2xl @sm:text-[2rem] leading-tight [font-weight:var(--s-paywall-headline-font-weight)] [font-family:var(--s-paywall-headline-font-family)]"
              >
                <svelte:element this={'slot'} name="headline">{headline}</svelte:element>
              </div>
              <svelte:element this={'slot'} name="below-headline">
                {#if product.description}
                  <DescriptionWithReadMore
                    description={product.description}
                    readMoreLink={product.readMoreLink}
                    readMoreText={product.readMoreText}
                    {t}
                    class="text-sm"
                  />
                {/if}
              </svelte:element>
            </Column>

            <div class="w-full h-px bg-gray-200 dark:bg-gray-700"></div>

            <svelte:element this={'slot'} name="features">
              {#if productFeatures.length}
                <Features features={productFeatures} class="w-full text-left text-sm space-y-2" />
              {/if}
            </svelte:element>

            <InputGroup class="text-left">
              <Input
                type="email"
                autocomplete="email"
                oninput={provideSuggestion}
                bind:value={email}
                compact
                hasError={!!error}
                placeholder={t('email')}
              />
              {#if emailSuggestion}
                <button
                  type="button"
                  class="text-sm gap-1 row mt-2"
                  onclick={() => {
                    email = emailSuggestion;
                    emailSuggestion = '';
                  }}
                >
                  <Icon class="text-primary text-xl" name="info" />
                  <span>
                    {t('did_you_mean')}{' '}
                    <span class="text-primary">{emailSuggestion}</span>?
                  </span>
                </button>
              {/if}
            </InputGroup>

            <Button
              {loading}
              disabled={loading}
              size="lg"
              class="w-full shadow-md bg-[var(--s-paywall-btn-bg-color)] text-[var(--s-paywall-btn-text-color)]"
              type="submit"
            >
              {product.buttonText || t('continue')}
            </Button>

            {#if error}
              <Error text={error} />
            {/if}

            <svelte:element this={'slot'} name="below-button" />

            {#if showLogin}
              <Row class="w-full">
                <sesamy-login
                  class="border-0 p-0 text-sm transition-opacity enabled:hover:bg-transparent enabled:hover:opacity-80"
                >
                  <svelte:element this={'slot'} name="login-button-text" slot="button-text">
                    {t('already_subscribing')}
                    <span class="text-primary underline underline-offset-4">{t('login')}</span>
                  </svelte:element>
                </sesamy-login>
              </Row>
            {/if}

            {#if footerPaymentMethods?.length}
              <Row class="gap-2">
                {#each footerPaymentMethods as IconName[] as paymentMethod}
                  <PaymentMethod name={paymentMethod} />
                {/each}
              </Row>
            {/if}
          </Column>
        </form>
      </div>
    {/if}
  {/await}
{/if}

{@html style}
