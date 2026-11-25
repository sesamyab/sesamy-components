<script lang="ts">
  import Column from '../Column.svelte';
  import Icon from '../Icon.svelte';
  import PaymentMethod from '../PaymentMethod.svelte';
  import Row from '../Row.svelte';
  import Button from '../../Button.wc.svelte';
  import Features from '../Features.svelte';
  import { twMerge } from 'tailwind-merge';
  import type { TranslationFunction } from '../../i18n';
  import { isLight } from '../../utils/color';
  import type { Paywall, PaywallSubscription } from '../../types/Paywall';
  import type { IconName } from '../../icons/types';
  import Subscriptions from './Subscriptions.svelte';
  import SinglePurchase from './SinglePurchase.svelte';
  import type { SesamyAPI, Checkout } from '@sesamy/sesamy-js';
  import type { PaywallProps } from '../../types';
  import Error from '../Error.svelte';
  import PayNowForm from './PayNowForm.svelte';
  import { onMount, onDestroy } from 'svelte';
  import { parsePrice } from '../../utils/money';
  import {
    goToCheckout,
    resolveRedirectLabel,
    resolveRedirectUrl,
    utmAttribution
  } from '../../utils/checkout';
  import { dispatchSesamyEvent, SesamyInternalEvent, SesamyJsEvent } from '../../events';
  import { resolveItemSrc, track } from '../../tracking';
  import ExpressCheckout from './ExpressCheckout.svelte';
  import {
    checkoutApiBase,
    createCheckoutApi,
    expressRefusal,
    inlineRequirements,
    prepareCheckout,
    type ApiCheckout,
    type CheckoutApi,
    type ExpressOutcome,
    type InlineDetails,
    type Wallet
  } from '../../utils/express-checkout';
  import BirthDateInput from '../BirthDateInput.svelte';
  import PhoneNumberInput from '../PhoneNumberInput.svelte';
  import { getCallingCode } from '../../utils/phone';

  type Props = {
    api: SesamyAPI;
    host: HTMLElement;
    paywall: Paywall;
    t: TranslationFunction;
    horizontal?: boolean;
    accessDenied?: boolean;
    onShown?: () => void;
    onAccessGranted?: () => void;
  } & PaywallProps;

  type Product = PaywallSubscription & { features: string[] };

  let {
    accessDenied = false,
    api,
    t,
    horizontal = false,
    host,
    paywall,
    onShown,
    onAccessGranted,
    ...userProps
  }: Props = $props();

  let product = $state<Product>();
  let checkout = $state<Checkout>();
  let loading = $state(false);
  let error = $state('');
  let authState = $state<'pending' | 'logged-out' | 'logged-in'>('pending');
  let email = $state<string | null>(null);

  // Express checkout (`express-checkout` attribute): a signed-in reader pays
  // the selected option with Apple Pay or Google Pay in place. A reader who
  // isn't signed in, a browser without a wallet, and a checkout the wallet
  // sheet can't complete all get the normal paywall.
  const isOn = (value: string | undefined) =>
    value !== undefined && value !== null && value !== 'false';
  const expressRequested = !horizontal && isOn(userProps?.['express-checkout']);
  const publishableKey = userProps?.['stripe-publishable-key']?.trim() || '';
  /** The signed-in reader's email, once known. Express mode only. */
  let readerEmail = $state<string | null>(null);
  /** Bumped on logout, so a reader lookup from before it is dropped. */
  let readerSession = 0;
  /** Which wallet buttons this browser shows, as each one reports. */
  let walletAvailability = $state<Partial<Record<Wallet, boolean>>>({});
  /** This browser has neither wallet, or Stripe didn't load. */
  const walletUnavailable = $derived(
    walletAvailability.applePay === false && walletAvailability.googlePay === false
  );
  const WALLETS: Wallet[] = ['applePay', 'googlePay'];
  // The fields the sheet can't give, asked next to the buttons (checkout-v4 #32).
  let birthYear = $state('');
  let birthMonth = $state('');
  let birthDay = $state('');
  let inlinePhone = $state<string | null>(null);
  let inlinePhoneValid = $state(false);
  let inlinePhoneCountry = $state('SE');
  let showInlineErrors = $state(false);
  let phonePrefilled = false;
  type ExpressPrepared =
    | { status: 'preparing' }
    | { status: 'ready'; checkout: ApiCheckout; created: Checkout; checkoutApi: CheckoutApi }
    | { status: 'refused' };
  let express = $state<{ key: string; state: ExpressPrepared } | null>(null);
  let expressPhase = $state<'idle' | 'unlocking'>('idle');
  let expressNotice = $state<{ kind: 'error' | 'info'; text: string } | null>(null);
  /** Re-runs the access check once an express purchase has unlocked the article. */
  let accessRun = $state(0);
  const prepared = new Map<string, Promise<ExpressPrepared>>();
  const PREPARE_TIMEOUT_MS = 15_000;

  const loadLoggedInUser = async () => {
    const user = await api.auth.getUser().catch(() => null);
    // A logout that arrived while the lookup was in flight wins over the stale profile.
    if (authState === 'logged-out') return;
    email = typeof user?.email === 'string' ? user.email : null;
    authState = 'logged-in';
  };

  const syncAuthOnLogout = () => {
    authState = 'logged-out';
    email = null;
    readerEmail = null;
    // A reader lookup still in flight speaks for the session that just ended.
    readerSession++;
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  onMount(() => {
    window.addEventListener(SesamyJsEvent.LOGOUT, syncAuthOnLogout);
  });
  onDestroy(() => {
    window.removeEventListener(SesamyJsEvent.LOGOUT, syncAuthOnLogout);
  });

  const contentArticle = api.content.get(host);
  const singlePurchasePrice = userProps?.['price']
    ? parsePrice(userProps['price'])
    : contentArticle?.price;
  const articleUrl = userProps?.['item-src'] || contentArticle?.url;

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
      styling,
      redirectUrl: paywallRedirectUrl,
      redirectLabel: paywallRedirectLabel
    }
  } = paywall;

  const checkAccess = async () => {
    if (horizontal) return false;

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
    } else {
      onShown?.();
      let isAuthed = false;
      try {
        isAuthed = await api.auth.isAuthenticated();
      } catch (error) {
        console.error('Auth check failed:', error);
      }
      if (!isAuthed) {
        authState = 'logged-out';
      } else if (showLoginButton) {
        void loadLoggedInUser();
      }
      if (isAuthed && expressRequested) {
        const session = readerSession;
        void api.auth
          .getUser()
          .then((user: { email?: unknown } | null) => {
            if (session !== readerSession) return;
            readerEmail = typeof user?.email === 'string' ? user.email : null;
          })
          .catch(() => {
            if (session === readerSession) readerEmail = null;
          });
      }
      dispatchSesamyEvent(host, 'sesamy:paywall-shown', {
        reason: isAuthed ? 'no-entitlement' : 'unauthenticated'
      });
    }

    return hasAccess;
  };

  const trackAddToCart = (selectedProduct: Product) =>
    // The user committed to a product — the new-components equivalent of the
    // legacy `sesamy-button` click, tracked before we branch off to an external
    // product URL so both purchase routes are counted.
    track(api, 'addToCart', {
      itemSrc: resolveItemSrc(articleUrl),
      publisherContentId: contentArticle?.id,
      sku: selectedProduct.sku,
      purchaseOptionId: selectedProduct.poId,
      price: selectedProduct.price,
      currency,
      paywallId: paywall.id
    });

  const doCreateCheckout = async (selectedProduct: Product) => {
    error = '';
    loading = true;

    trackAddToCart(selectedProduct);

    if (selectedProduct?.url && selectedProduct?.url !== articleUrl) {
      window.location.assign(selectedProduct.url);
      return;
    }

    try {
      const checkoutPayload = checkoutPayloadFor(selectedProduct);

      const event = api.events.emit(
        'sesamyPaywallCreateCheckout',
        {
          payload: checkoutPayload,
          product: selectedProduct,
          paywallId: paywall.id
        },
        true
      );

      if (event.canceled) {
        loading = false;
        return;
      }

      const createdCheckout = await api.checkouts.create(checkoutPayload);

      api.events.emit('sesamyPaywallProductSelected', {
        product: selectedProduct,
        checkoutId: createdCheckout.id,
        paywallId: paywall.id
      });

      if (horizontal || selectedProduct.preferBusiness) {
        await goToCheckout(createdCheckout, {
          auth: api.auth,
          business: selectedProduct.preferBusiness
        });
        return;
      }

      checkout = createdCheckout;
      loading = false;
    } catch (err) {
      console.error(err);
      error = t('something_went_wrong');
      loading = false;
      return;
    }
  };

  const checkoutPayloadFor = (selectedProduct: Product) => {
    const item = selectedProduct?.url
      ? { url: selectedProduct.url }
      : { sku: selectedProduct.sku, purchaseOptionId: selectedProduct.poId };

    // Resolved per purchase, since the chosen option can carry its own
    // redirect. Options of type URL never get here — they left above — and the
    // single purchase has no per-option field, so it resolves paywall-wide.
    const redirectUrl = resolveRedirectUrl(
      selectedProduct.redirectUrl,
      paywallRedirectUrl,
      userProps?.['redirect-url']
    );
    const redirectLabel = resolveRedirectLabel(
      selectedProduct.redirectLabel,
      paywallRedirectLabel,
      userProps?.['redirect-label']
    );

    return {
      items: [item],
      requestedDiscountCodes: selectedProduct.discountCode
        ? [selectedProduct.discountCode]
        : undefined,
      redirectUrl,
      // Typed in sesamy-js from the release that adds it to checkout
      // creation; older versions pass it through to api2 untyped.
      redirectLabel,
      price: selectedProduct.price,
      currency,
      attribution: {
        ...utmAttribution(userProps),
        // Attribute the checkout to this paywall's article: the explicit
        // `item-src` attribute, or the URL resolved from the paywall host
        // (which itself falls back to the page URL in sesamy-js).
        ...(articleUrl ? { itemSrc: articleUrl } : {}),
        source: 'PAYWALL' as const,
        sourceId: paywall.id,
        ...(paywall.decisionId ? { decisionId: paywall.decisionId } : {}),
        ...(paywall.strategyId ? { strategyId: paywall.strategyId } : {})
      }
    };
  };

  // --- Express checkout

  const productKey = (p: Product) => `${p.sku ?? ''}|${p.poId ?? ''}|${p.url ?? ''}`;

  /** Options paid elsewhere (an external URL, a business checkout) never go express. */
  const expressEligible = (p: Product | undefined): p is Product =>
    !!p && !p.preferBusiness && (!p.url || p.url === articleUrl);

  const expressActive = $derived(
    expressRequested &&
      !!publishableKey &&
      !!readerEmail &&
      !walletUnavailable &&
      !checkout &&
      expressEligible(product)
  );

  /**
   * The checkout for one option, created as the normal paywall creates it
   * and owned by the signed-in reader. Created when the option is selected,
   * since a wallet sheet must open on the tap itself; reused when it is
   * selected again.
   */
  const prepareExpress = (selectedProduct: Product, owner: string): Promise<ExpressPrepared> => {
    const key = productKey(selectedProduct);
    let promise = prepared.get(key);
    if (!promise) {
      promise = (async (): Promise<ExpressPrepared> => {
        const checkoutPayload = checkoutPayloadFor(selectedProduct);
        // An integration that cancels checkout creation cancels it here too.
        const event = api.events.emit(
          'sesamyPaywallCreateCheckout',
          { payload: checkoutPayload, product: selectedProduct, paywallId: paywall.id },
          true
        );
        if (event.canceled) return { status: 'refused' };
        const created = await api.checkouts.create(checkoutPayload);
        const base = checkoutApiBase(created.checkoutUrl);
        if (!base) return { status: 'refused' };
        const checkoutApi = createCheckoutApi(base);
        const apiCheckout = await prepareCheckout(checkoutApi, created.id, owner, () =>
          api.auth.getTokenSilently(false)
        );
        const refusal = expressRefusal(apiCheckout);
        if (refusal) {
          api.log(`Express checkout not offered for ${key}: ${refusal}`);
          return { status: 'refused' };
        }
        return { status: 'ready', checkout: apiCheckout, created, checkoutApi };
      })().catch((err) => {
        console.error('Express checkout could not be prepared', err);
        prepared.delete(key);
        return { status: 'refused' } as const;
      });
      prepared.set(key, promise);
    }
    return promise;
  };

  $effect(() => {
    if (!expressActive || !product || !readerEmail) return;
    const key = productKey(product);
    if (express?.key === key) return;
    express = { key, state: { status: 'preparing' } };
    // Preparation that doesn't settle in time gives the normal paywall back.
    const timeout = new Promise<ExpressPrepared>((resolve) =>
      setTimeout(() => resolve({ status: 'refused' }), PREPARE_TIMEOUT_MS)
    );
    void Promise.race([prepareExpress(product, readerEmail), timeout]).then((state) => {
      if (express?.key === key && express.state.status === 'preparing') express = { key, state };
    });
  });

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  /**
   * The purchase is complete (or paid and still being confirmed): drop
   * sesamy-js's cached entitlements and ask again until the new one is there
   * (it lands shortly after the checkout completes), then tell the content
   * container and the paywall to re-check. While this runs no new checkout
   * can be started, so a slow confirmation never leads to a second payment.
   */
  const unlockAfterPurchase = async (processing = false) => {
    expressPhase = 'unlocking';
    expressNotice = {
      kind: 'info',
      text: t(processing ? 'express_processing' : 'express_unlocking')
    };
    const passes = userProps?.pass
      ? userProps.pass.split(';')
      : api.content.get(host)?.pass?.split(';');
    const attempts = processing ? 60 : 10;
    let granted = false;
    for (let attempt = 0; attempt < attempts && !granted; attempt++) {
      if (attempt) await wait(1500);
      try {
        api.clearCache();
        granted = accessDenied
          ? !!(await api.content.hasAccess(host))
          : !!(await api.entitlements.hasAccess(articleUrl || '', passes));
      } catch (err) {
        api.log(`Access check after express purchase failed: ${err}`);
      }
    }
    window.dispatchEvent(new CustomEvent(SesamyInternalEvent.ENTITLEMENTS_CHANGED));
    if (granted) {
      expressNotice = null;
      accessRun++;
    } else {
      expressPhase = 'idle';
      expressNotice = { kind: 'info', text: t('express_reload') };
    }
  };

  const onExpressOutcome = (outcome: ExpressOutcome) => {
    switch (outcome.kind) {
      case 'completed':
        void unlockAfterPurchase();
        return;
      case 'processing':
        // Paid, not yet confirmed: keep checking for the entitlement.
        void unlockAfterPurchase(true);
        return;
      case 'declined':
        expressNotice = { kind: 'error', text: outcome.message || t('express_declined') };
        return;
      case 'fallback': {
        // The sheet couldn't give a field the checkout requires: the hosted
        // checkout asks for it, on the same checkout.
        const current = express?.state;
        if (current?.status === 'ready') {
          void goToCheckout(current.created, { auth: api.auth });
        }
        return;
      }
      case 'error':
        expressNotice = { kind: 'error', text: t('something_went_wrong') };
        return;
    }
  };

  const onExpressStart = () => {
    expressNotice = null;
    if (product) trackAddToCart(product);
  };

  const readyCheckout = $derived(express?.state.status === 'ready' ? express.state.checkout : null);
  const asksBirthdate = $derived(
    !!readyCheckout && inlineRequirements(readyCheckout, 'applePay').birthdate
  );
  // Google Pay's required phone is asked here; with Apple Pay the sheet gives it.
  const asksPhone = $derived(
    !!readyCheckout &&
      walletAvailability.googlePay !== false &&
      inlineRequirements(readyCheckout, 'googlePay').phone
  );

  const inlineBirthdate = $derived.by(() => {
    const year = parseInt(birthYear);
    const month = parseInt(birthMonth);
    const day = parseInt(birthDay);
    const valid =
      year >= 1900 &&
      year <= new Date().getFullYear() &&
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      // The last day of that month: no 31 February.
      day <= new Date(year, month, 0).getDate();
    return valid
      ? `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      : undefined;
  });

  /** Whether `wallet`'s button may open its sheet: its inline fields are filled in. */
  const inlineComplete = (checkoutToPay: ApiCheckout, wallet: Wallet) => {
    const needs = inlineRequirements(checkoutToPay, wallet);
    return (!needs.birthdate || !!inlineBirthdate) && (!needs.phone || inlinePhoneValid);
  };

  const getInline = (): InlineDetails => ({
    ...(inlineBirthdate ? { birthdate: inlineBirthdate } : {}),
    ...(inlinePhone && inlinePhoneValid ? { mobilePhone: inlinePhone } : {})
  });

  // Fill the phone from the reader's profile, so only what's missing is asked.
  $effect(() => {
    if (!asksPhone || phonePrefilled || !readyCheckout) return;
    phonePrefilled = true;
    if (getCallingCode(readyCheckout.country)) inlinePhoneCountry = readyCheckout.country;
    void api.profile
      ?.get?.()
      .then((profile: { mobilePhone?: string } | null) => {
        if (profile?.mobilePhone && !inlinePhone) inlinePhone = profile.mobilePhone;
      })
      .catch(() => {});
  });

  const createCheckout = async (e: SubmitEvent) => {
    e.preventDefault();
    if (!product) return;
    await doCreateCheckout(product);
  };

  const onBoxCheckout = async (subscription: PaywallSubscription) => {
    const selectedProduct: Product = {
      ...subscription,
      features:
        Array.isArray(subscription.features) && subscription.features.length > 0
          ? subscription.features
          : Array.isArray(features)
            ? features
            : []
    };
    product = selectedProduct;
    await doCreateCheckout(selectedProduct);
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
  const autoDarkMode = styling?.showBackground && !isLight(paywallBgColor);
  const paywallTextColor = autoDarkMode ? '#FFFFFF' : '#000000';
  const autoBtnColor = isLight(mainColor) ? '#000000' : '#FFFFFF';

  let darkMode = $state(autoDarkMode);

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
      --s-paywall-theme: var(--sesamy-paywall-theme, ${autoDarkMode ? 'dark' : 'light'});
      --s-paywall-btn-bg-color: var(--sesamy-paywall-btn-bg-color, var(--s-primary-color));
      --s-paywall-btn-text-color: var(--sesamy-paywall-btn-text-color, ${autoBtnColor});
      --s-paywall-tag-bg-color: var(--sesamy-paywall-tag-bg-color, var(--s-primary-color));
      --s-paywall-tag-text-color: var(--sesamy-paywall-tag-text-color, ${autoBtnColor});
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

{#key accessRun}
  {#await checkAccess() then hasAccess}
    {#if !hasAccess}
      <div class="@container" style="font-size: var(--s-base-font-size, 16px)">
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
            <!-- 'pending' renders neither row, so the wrong one never flashes while auth settles. -->
            {#if showLoginButton && !horizontal}
              {#if authState === 'logged-out'}
                <!-- Chains the paywall's own `login-button-text` slot into the nested
                   sesamy-login `button-text` slot, so the host page can override the
                   text. Falls back to the translated default when left unfilled. -->
                <Row class="w-full">
                  <sesamy-login
                    class="border-0 p-0 underline underline-offset-4 transition-opacity enabled:hover:bg-transparent enabled:hover:opacity-80"
                  >
                    <svelte:element this={'slot'} name="login-button-text" slot="button-text">
                      {t('already_subscribing')}
                      {t('login')}
                    </svelte:element>
                  </sesamy-login>
                </Row>
                <div
                  class="w-full h-px from-transparent bg-gradient-to-r to-transparent via-primary opacity-30"
                ></div>
              {:else if authState === 'logged-in'}
                <Row
                  class="w-full gap-1 text-[length:var(--sesamy-login-button-text-size,var(--s-login-button-default-text-size))] text-[color:var(--sesamy-login-button-text-color,var(--s-paywall-text-color))]"
                >
                  {#if email}
                    <span class="break-all">{t('logged_in_as')} {email}</span>
                    <span aria-hidden="true">·</span>
                  {/if}
                  <button
                    type="button"
                    class="border-0 bg-transparent p-0 underline underline-offset-4 transition-opacity hover:opacity-80"
                    onclick={logout}
                  >
                    <svelte:element this={'slot'} name="logout-button-text"
                      >{t('logout')}</svelte:element
                    >
                  </button>
                </Row>
                <div
                  class="w-full h-px from-transparent bg-gradient-to-r to-transparent via-primary opacity-30"
                ></div>
              {/if}
            {/if}

            <div class={twMerge('w-full pt-2 @md:pt-4', horizontal && 'column text-center mb-6')}>
              {#if useDefaultLogo}
                <img class="h-7 mb-6" src={logoUrl} alt={`${t('logo_of')} ${vendorId}`} />
              {/if}
              <!-- The host page can swap the headline per placement without a second
                 paywall; the copy from the paywall settings is the fallback. -->
              <div class="text-2xl leading-tight @md:text-3xl font-bold max-w-[600px]">
                <svelte:element this={'slot'} name="headline">{headline}</svelte:element>
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
                    {horizontal}
                    {subscriptions}
                    {t}
                    {currency}
                    {selectProduct}
                    {loading}
                    onCheckout={onBoxCheckout}
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

                  {#if expressActive && express?.state.status === 'ready'}
                    {@const ready = express.state}
                    {#if asksBirthdate || asksPhone}
                      <div class="w-full column gap-2" data-testid="express-inline-fields">
                        {#if asksBirthdate}
                          <BirthDateInput
                            {t}
                            bind:year={birthYear}
                            bind:month={birthMonth}
                            bind:day={birthDay}
                            hasError={showInlineErrors && !inlineBirthdate}
                            onYearChange={() => {}}
                            onMonthChange={() => {}}
                            onDayChange={() => {}}
                          />
                        {/if}
                        {#if asksPhone}
                          <PhoneNumberInput
                            bind:value={inlinePhone}
                            bind:valid={inlinePhoneValid}
                            bind:selectedCountry={inlinePhoneCountry}
                            locale={t.lang}
                            {vendorId}
                            {t}
                            hasError={showInlineErrors && !inlinePhoneValid}
                            onChange={() => {}}
                            name="tel"
                          />
                        {/if}
                      </div>
                    {/if}
                    {#key express.key}
                      <div
                        class="mt-2 w-full column gap-2"
                        class:pointer-events-none={expressPhase === 'unlocking'}
                      >
                        {#each WALLETS as wallet (wallet)}
                          <ExpressCheckout
                            {host}
                            {t}
                            {wallet}
                            checkout={ready.checkout}
                            checkoutApi={ready.checkoutApi}
                            {publishableKey}
                            email={readerEmail ?? ''}
                            blocked={!inlineComplete(ready.checkout, wallet)}
                            {getInline}
                            onBlockedTap={() => (showInlineErrors = true)}
                            onAvailability={(available) =>
                              (walletAvailability = { ...walletAvailability, [wallet]: available })}
                            onStart={onExpressStart}
                            onOutcome={onExpressOutcome}
                          />
                        {/each}
                      </div>
                    {/key}
                    {#if showInlineErrors && WALLETS.some((w) => walletAvailability[w] && !inlineComplete(ready.checkout, w))}
                      <div role="alert" class="w-full text-sm font-bold text-red-500">
                        {t('express_fill_in_first')}
                      </div>
                    {/if}
                    {#if expressNotice}
                      <div
                        role={expressNotice.kind === 'error' ? 'alert' : 'status'}
                        class={twMerge(
                          'w-full text-sm font-bold',
                          expressNotice.kind === 'error' && 'text-red-500'
                        )}
                      >
                        {expressNotice.text}
                      </div>
                    {/if}
                    <button
                      type="submit"
                      class="text-sm font-bold mx-auto hover:underline p-1"
                      disabled={loading || expressPhase === 'unlocking'}
                    >
                      {t('express_more_options')}
                    </button>
                  {:else if expressActive && express?.state.status === 'preparing'}
                    <div
                      class="mt-2 h-12 w-full rounded-md bg-gray-200 dark:bg-black/25 animate-pulse"
                      aria-busy="true"
                      data-testid="express-checkout-preparing"
                    ></div>
                  {:else}
                    <Button
                      {loading}
                      disabled={loading}
                      class="mt-2 w-full shadow-md bg-[var(--s-paywall-btn-bg-color)] text-[var(--s-paywall-btn-text-color)]"
                      type="submit"
                    >
                      {t('continue')}
                    </Button>
                  {/if}
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
{/key}

{@html style}
