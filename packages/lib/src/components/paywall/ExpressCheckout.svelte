<script module lang="ts">
  import { loadStripe } from '@stripe/stripe-js/pure';
  import type { Stripe } from '@stripe/stripe-js';

  // One Stripe instance per publishable key and connected account (Connect
  // direct charges), shared by the wallet buttons. A failed load is dropped,
  // so the next mount retries.
  const stripeCache = new Map<string, Promise<Stripe | null>>();
  const getStripe = (publishableKey: string, account: string | null) => {
    const key = `${publishableKey}|${account ?? 'platform'}`;
    let promise = stripeCache.get(key);
    if (!promise) {
      promise = loadStripe(publishableKey, account ? { stripeAccount: account } : undefined);
      promise.catch(() => stripeCache.delete(key));
      stripeCache.set(key, promise);
    }
    return promise;
  };
</script>

<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import type {
    StripeElementLocale,
    StripeElements,
    StripeExpressCheckoutElement,
    StripeExpressCheckoutElementConfirmEvent
  } from '@stripe/stripe-js';
  import type { TranslationFunction } from '../../i18n';
  import {
    elementsOptions,
    expressElementOptions,
    payWithWallet,
    stripeTargetOf,
    type ApiCheckout,
    type CheckoutApi,
    type ExpressOutcome,
    type InlineDetails,
    type Wallet
  } from '../../utils/express-checkout';

  type Props = {
    host: HTMLElement;
    t: TranslationFunction;
    wallet: Wallet;
    checkout: ApiCheckout;
    checkoutApi: CheckoutApi;
    publishableKey: string;
    email: string;
    /** The inline fields this wallet needs are not filled in yet. */
    blocked?: boolean;
    /** What the reader filled in next to the buttons, read at Pay. */
    getInline?: () => InlineDetails;
    /** A tap while blocked: the paywall points at the missing fields. */
    onBlockedTap?: () => void;
    /** Whether this browser shows this wallet (false also when Stripe didn't load). */
    onAvailability: (available: boolean) => void;
    /** The reader tapped the wallet button. */
    onStart?: () => void;
    onOutcome: (outcome: ExpressOutcome) => void;
  };

  let {
    host,
    t,
    wallet,
    checkout,
    checkoutApi,
    publishableKey,
    email,
    blocked = false,
    getInline,
    onBlockedTap,
    onAvailability,
    onStart,
    onOutcome
  }: Props = $props();

  // Stripe's iframes go in the host's light DOM, projected through a slot:
  // Stripe Elements aren't supported inside a shadow root.
  const slotName = `sesamy-express-checkout-${wallet}`;
  /** An element that neither loads nor fails must not hold the paywall (checkout-v4). */
  const READY_TIMEOUT_MS = 10_000;

  let container: HTMLDivElement | null = null;
  let element: StripeExpressCheckoutElement | null = null;
  let available = $state(false);
  let destroyed = false;
  let reported = false;
  let busy = false;
  let readyTimer: ReturnType<typeof setTimeout> | undefined;

  const report = (value: boolean) => {
    clearTimeout(readyTimer);
    if (reported) return;
    reported = true;
    available = value;
    // Not shown is final for this element: one that loads late, after the
    // timeout, must not appear (unblocked) once the paywall moved on.
    if (!value) teardown();
    onAvailability(value);
  };

  const teardown = () => {
    element?.destroy();
    element = null;
    container?.remove();
    container = null;
  };

  const onConfirm = async (
    stripe: Stripe,
    elements: StripeElements,
    event: StripeExpressCheckoutElementConfirmEvent
  ) => {
    if (busy) return event.paymentFailed({ reason: 'fail' });
    busy = true;
    try {
      const returnUrl = new URL(window.location.href);
      for (const name of [
        'payment_intent',
        'payment_intent_client_secret',
        'setup_intent',
        'setup_intent_client_secret',
        'redirect_status'
      ]) {
        returnUrl.searchParams.delete(name);
      }
      const outcome = await payWithWallet({
        stripe,
        elements,
        checkoutApi,
        checkout,
        email,
        event,
        inline: getInline?.(),
        returnUrl: returnUrl.toString()
      });
      if (!destroyed) onOutcome(outcome);
    } catch (error) {
      console.error('Express checkout failed', error);
      try {
        event.paymentFailed({ reason: 'fail' });
      } catch {
        // The sheet may already be closed.
      }
      if (!destroyed) onOutcome({ kind: 'error', reason: 'generic' });
    } finally {
      busy = false;
    }
  };

  onMount(() => {
    const target = stripeTargetOf(checkout);
    if (!target || !publishableKey) return report(false);

    container = document.createElement('div');
    container.slot = slotName;
    container.style.width = '100%';
    host.appendChild(container);

    readyTimer = setTimeout(() => report(false), READY_TIMEOUT_MS);

    getStripe(publishableKey, target.account).then(
      (stripe) => {
        if (destroyed || reported || !container) return;
        if (!stripe) return report(false);
        const elements = stripe.elements({
          ...elementsOptions(checkout),
          locale: (t.lang || 'auto') as StripeElementLocale
        });
        element = elements.create(
          'expressCheckout',
          expressElementOptions(checkout, wallet, t('express_digital_delivery'))
        );
        element.on('ready', ({ availablePaymentMethods }) =>
          report(!!availablePaymentMethods?.[wallet])
        );
        element.on('loaderror', () => report(false));
        // Plain device tokens, also for subscriptions: checkout-v3's Apple Pay
        // recurring request got renewals declined (v3#893), so none here.
        element.on('click', (event) => {
          onStart?.();
          event.resolve();
        });
        // The address in these events is partial and anonymised: never read it.
        element.on('shippingaddresschange', (event) => event.resolve());
        element.on('shippingratechange', (event) => event.resolve());
        element.on('confirm', (event) => void onConfirm(stripe, elements, event));
        // Dismissing the sheet changes nothing.
        element.on('cancel', () => {});
        element.mount(container);
      },
      (error) => {
        console.error('Stripe.js failed to load', error);
        if (!destroyed) report(false);
      }
    );
  });

  onDestroy(() => {
    destroyed = true;
    clearTimeout(readyTimer);
    teardown();
  });
</script>

<div
  class={available ? 'relative w-full min-h-12' : 'w-full'}
  data-testid={`express-checkout-${wallet}`}
>
  <svelte:element this={'slot'} name={slotName} />
  {#if available && blocked}
    <!-- The sheet can only open on the tap itself, so a button whose inline
         fields are missing is covered until they are filled in. -->
    <button
      type="button"
      class="absolute inset-0 w-full h-full rounded-md bg-white/60 dark:bg-black/60 cursor-not-allowed"
      aria-label={t('express_fill_in_first')}
      data-testid={`express-checkout-${wallet}-blocked`}
      onclick={() => onBlockedTap?.()}
    ></button>
  {/if}
</div>
