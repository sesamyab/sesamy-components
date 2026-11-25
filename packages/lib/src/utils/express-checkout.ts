import type {
  PaymentIntent,
  SetupIntent,
  Stripe,
  StripeElements,
  StripeElementsOptionsMode,
  StripeError,
  StripeExpressCheckoutElementConfirmEvent,
  StripeExpressCheckoutElementOptions
} from '@stripe/stripe-js';
import { parsePhoneNumber } from './phone';

// Express checkout: the paywall pays a checkout with Apple Pay or Google Pay
// in place, without the hosted checkout. It runs the same checkout-api calls
// checkout-v4 runs for a wallet (components/checkout/use-pay.ts and
// lib/checkout/wallet-details.ts on its `details-wallet-data` branch):
//
//   POST /owner → (sheet) createPaymentMethod → POST /userdetails →
//   POST /paymentMethod → confirmCard{Payment,Setup} (Stripe runs 3-D Secure)
//   → PATCH /status → poll GET until COMPLETED.
//
// The checkout itself is still created through sesamy-js (api2), whose ids
// are checkout-api ids. api2's Checkout has no price, client secret or Stripe
// account, so everything after the create talks to checkout-api directly.

/**
 * checkout-api for the checkout host sesamy-js links to. Only Sesamy's own
 * hosts: the reader's token may go to these and nowhere else.
 */
// A Map, not an object literal: a hostname such as `constructor` must not
// find an inherited property.
const CHECKOUT_API_BY_HOST = new Map<string, string>([
  ['checkout3.sesamy.com', 'https://api.sesamy.com'],
  ['checkout3.sesamy.dev', 'https://api.sesamy.dev']
]);

/** The checkout-api base for an api2 `checkoutUrl`, or null for any other host. */
export const checkoutApiBase = (checkoutUrl: string | undefined): string | null => {
  if (!checkoutUrl) return null;
  try {
    const url = new URL(checkoutUrl);
    if (url.protocol !== 'https:') return null;
    return CHECKOUT_API_BY_HOST.get(url.hostname) ?? null;
  } catch {
    return null;
  }
};

// --- checkout-api types: the part of checkout-v4's lib/checkout-api/types.ts read here.

export type FieldSetting = { enabled?: boolean; required?: boolean };

export type ApiAddress = {
  firstName?: string;
  lastName?: string;
  co?: string;
  department?: string;
  street: string;
  city: string;
  zip: string;
  country: string;
};

export type ApiUserDetails = {
  isBusiness?: boolean;
  firstName?: string;
  lastName?: string;
  mobilePhone?: string;
  /** Sent as YYYY-MM-DD, returned as an ISO datetime. */
  birthdate?: string;
  address?: ApiAddress;
};

export type Wallet = 'applePay' | 'googlePay';

/**
 * What the paywall asks itself, next to the wallet buttons, because the sheet
 * can't give it (checkout-v4 #32's Details step): a birthdate, and with
 * Google Pay a required phone, which Google Pay only gives best effort.
 */
export type InlineDetails = { birthdate?: string; mobilePhone?: string };

export type ApiPrice = { total: number; currency: string };

export type ApiCheckout = {
  id: string;
  status: 'PENDING' | 'WAITING_PAYMENT_CONFIRMATION' | 'COMPLETED' | 'FAILED' | string;
  type: 'RECURRING' | 'SINGLE' | string;
  country: string;
  isAutoRenew?: boolean;
  price: { initialPrice: ApiPrice };
  items: unknown[];
  itemsOwned?: unknown[];
  user?: { id?: string; email?: string };
  userDetails?: ApiUserDetails;
  settings?: {
    requireAuth?: boolean;
    requireAddress?: boolean;
    giftMode?: boolean;
    fieldSettings?: {
      name?: FieldSetting;
      phone?: FieldSetting;
      birthdate?: FieldSetting;
      vat?: FieldSetting;
    };
  };
  paymentOptions?: {
    availablePaymentMethods?: { provider: string; methods: string[]; providerID?: string }[];
    paymentSettings?: {
      clientSecret?: string;
      setupIntent?: { clientSecret?: string };
      swishUrl?: string;
      vippsPayment?: unknown;
    };
  };
};

export type WalletCode = 'APPLEPAY' | 'GOOGLEPAY';

/** A non-2xx answer from checkout-api. */
export class CheckoutApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly serverErrorCode?: string
  ) {
    super(message);
    this.name = 'CheckoutApiError';
  }
}

/** The signed-in reader changed while their checkout was being prepared. */
export class ReaderChangedError extends Error {
  constructor() {
    super('The signed-in reader changed');
    this.name = 'ReaderChangedError';
  }
}

export type CheckoutApi = {
  get(id: string): Promise<ApiCheckout>;
  setOwner(
    id: string,
    body: { email: string; userCountry?: string },
    accessToken?: string | null
  ): Promise<ApiCheckout>;
  setUserDetails(id: string, body: ApiUserDetails & { isBusiness: boolean }): Promise<ApiCheckout>;
  setPaymentMethod(
    id: string,
    body: { provider: 'STRIPE'; method: 'CARD'; wallet: WalletCode }
  ): Promise<ApiCheckout>;
  setWaiting(id: string): Promise<ApiCheckout>;
};

/**
 * Per request, body included (checkout-v4's REQUEST_TIMEOUT_MS): an API that
 * accepts the connection and never answers must not hold a payment open.
 * A write that timed out may still have happened, so callers read the
 * checkout before deciding anything; nothing is retried here.
 */
export const REQUEST_TIMEOUT_MS = 15_000;

/** checkout-api's endpoints, as checkout-v4's lib/checkout-api/client.ts calls them. */
export const createCheckoutApi = (
  base: string,
  fetchImpl: typeof fetch = fetch,
  timeoutMs = REQUEST_TIMEOUT_MS
): CheckoutApi => {
  const call = async <T>(
    path: string,
    init: { method?: string; body?: unknown; headers?: Record<string, string> } = {}
  ): Promise<T> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(`${base}/checkout/${path}`, {
        method: init.method ?? 'GET',
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          ...init.headers,
          ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {})
        },
        body: init.body !== undefined ? JSON.stringify(init.body) : undefined
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          message?: string;
          serverErrorCode?: string;
        } | null;
        throw new CheckoutApiError(
          response.status,
          body?.message || `checkout-api ${response.status}`,
          body?.serverErrorCode
        );
      }
      return (await response.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  };
  const id = encodeURIComponent;
  return {
    get: (checkoutId) => call(id(checkoutId)),
    setOwner: (checkoutId, body, accessToken) =>
      call(`${id(checkoutId)}/owner`, {
        method: 'POST',
        body,
        ...(accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {})
      }),
    setUserDetails: (checkoutId, body) =>
      call(`${id(checkoutId)}/userdetails`, { method: 'POST', body }),
    setPaymentMethod: (checkoutId, body) =>
      call(`${id(checkoutId)}/paymentMethod`, { method: 'POST', body }),
    setWaiting: (checkoutId) =>
      call(`${id(checkoutId)}/status`, {
        method: 'PATCH',
        body: { status: 'WAITING_PAYMENT_CONFIRMATION' }
      })
  };
};

// --- What the checkout needs, and what the sheet can give.

const fieldOf = (f: FieldSetting | undefined) => ({
  enabled: !!f?.enabled,
  required: !!f?.enabled && !!f?.required
});

/** The backend copies a `login:required` product's rule onto `settings.requireAuth`. */
export const isAuthRequired = (checkout: ApiCheckout) => checkout.settings?.requireAuth === true;

export const willReusePaymentMethod = (checkout: ApiCheckout) =>
  checkout.type === 'RECURRING' || checkout.isAutoRenew === true;

/**
 * Where Stripe.js loads: the vendor's connected account (Connect direct
 * charges), or the platform when STRIPE has no providerID. Null when the
 * checkout offers no Stripe card, which every wallet payment rides on.
 */
export const stripeTargetOf = (checkout: ApiCheckout): { account: string | null } | null => {
  const stripe = checkout.paymentOptions?.availablePaymentMethods?.find(
    (p) => p.provider === 'STRIPE'
  );
  if (!stripe?.methods.includes('CARD')) return null;
  return { account: stripe.providerID || null };
};

export type ExpressRefusal =
  | 'no-stripe-card'
  | 'not-pending'
  | 'already-owned'
  | 'business'
  | 'gift'
  | 'free';

/**
 * Why this checkout can't be paid from the wallet sheet, or null when it can.
 * What neither the sheet nor the paywall's inline fields give (a gift's
 * recipient, a company's details) sends the reader to the hosted checkout
 * instead (the POC's fallback).
 */
export const expressRefusal = (checkout: ApiCheckout): ExpressRefusal | null => {
  if (!checkout.items?.length && checkout.itemsOwned?.length) return 'already-owned';
  if (checkout.status !== 'PENDING') return 'not-pending';
  if (!stripeTargetOf(checkout)) return 'no-stripe-card';
  if (checkout.userDetails?.isBusiness) return 'business';
  if (checkout.settings?.giftMode) return 'gift';
  // A free-forever checkout has no payment to make: checkout handles it.
  if (checkout.price.initialPrice.total === 0 && !willReusePaymentMethod(checkout)) return 'free';
  return null;
};

/** checkout-v4 lib/checkout/address.ts: the step's per-field limit. */
export const ADDRESS_MAX_LENGTH = 100;

const ADDRESS_FIELDS = ['firstName', 'lastName', 'street', 'co', 'zip', 'city'] as const;

/** Whether an address would pass checkout-v4's step: all but c/o set, within the limit. */
const addressValid = (a: Partial<ApiAddress> | undefined) =>
  ADDRESS_FIELDS.every((field) => {
    const value = (a?.[field] ?? '').trim();
    return value ? value.length <= ADDRESS_MAX_LENGTH : field === 'co';
  });

/**
 * checkout-v4 addressDone: the saved address counts when it is complete,
 * within the limit and for the checkout's country (v3 lesson 13). True when
 * none is asked for.
 */
export const addressDone = (checkout: ApiCheckout) =>
  checkout.settings?.requireAddress !== true ||
  (addressValid(checkout.userDetails?.address) &&
    checkout.userDetails?.address?.country === checkout.country);

/** checkout-v4 sameAddress: saving `next` would change nothing. */
const sameAddress = (next: ApiAddress, saved: ApiAddress | undefined) =>
  !!saved &&
  (['firstName', 'lastName', 'co', 'street', 'zip', 'city', 'country'] as const).every(
    (key) => (next[key] ?? '').trim() === (saved[key] ?? '').trim()
  );

/**
 * What the sheet is asked for: checkout-v4's METHOD_PROVIDES for the wallets
 * (name, phone, address), limited to what this checkout uses and doesn't
 * already hold. Email never: the owner is the signed-in reader.
 */
export const sheetRequirements = (checkout: ApiCheckout, wallet: Wallet = 'applePay') => {
  const f = checkout.settings?.fieldSettings;
  const d = checkout.userDetails;
  const address = !addressDone(checkout);
  const name = (fieldOf(f?.name).enabled || address) && !(d?.firstName && d?.lastName);
  // checkout-v4 #32: Google Pay's phone is best effort, so a required one is
  // asked inline instead; an optional one is still taken when given.
  const phone =
    fieldOf(f?.phone).enabled &&
    !d?.mobilePhone &&
    !(wallet === 'googlePay' && fieldOf(f?.phone).required);
  return { name, phone, address };
};

/** The fields the paywall asks next to the buttons, for one wallet. */
export const inlineRequirements = (checkout: ApiCheckout, wallet: Wallet) => {
  const f = checkout.settings?.fieldSettings;
  const d = checkout.userDetails;
  return {
    birthdate: fieldOf(f?.birthdate).required && !d?.birthdate,
    phone: wallet === 'googlePay' && fieldOf(f?.phone).required && !d?.mobilePhone
  };
};

/** One wallet's Express Checkout Element: one button, as checkout-v4's pay bar. */
export const expressElementOptions = (
  checkout: ApiCheckout,
  wallet: Wallet,
  digitalDeliveryLabel: string
): StripeExpressCheckoutElementOptions => {
  const needs = sheetRequirements(checkout, wallet);
  return {
    paymentMethods: {
      applePay: wallet === 'applePay' ? 'always' : 'never',
      googlePay: wallet === 'googlePay' ? 'always' : 'never',
      link: 'never',
      paypal: 'never',
      amazonPay: 'never',
      klarna: 'never'
    },
    // checkout-v4: Apple's "subscribe" label overflows in sv, so plain.
    buttonType: {
      applePay: 'plain',
      googlePay: checkout.type === 'RECURRING' ? 'subscribe' : 'pay'
    },
    buttonTheme: { applePay: 'black', googlePay: 'black' },
    buttonHeight: 48,
    emailRequired: false,
    phoneNumberRequired: needs.phone,
    // The buyer's name comes with the billing details.
    billingAddressRequired: needs.name,
    shippingAddressRequired: needs.address,
    ...(needs.address
      ? {
          // The saved address is for the checkout's country only (v3 lesson 13).
          allowedShippingCountries: [checkout.country],
          // Stripe requires a rate whenever it collects a shipping address.
          shippingRates: [{ id: 'digital', amount: 0, displayName: digitalDeliveryLabel }]
        }
      : {})
  };
};

/**
 * Deferred-intent options, matching the intent checkout-api creates at POST
 * /paymentMethod (checkout-v4 lib/payment/stripe.ts): nothing due today → a
 * SetupIntent; otherwise a PaymentIntent, saved off-session for renewals.
 */
export const elementsOptions = (checkout: ApiCheckout): StripeElementsOptionsMode => {
  const { total, currency } = checkout.price.initialPrice;
  const common = {
    currency: currency.toLowerCase(),
    allowedPaymentMethodTypes: ['card'],
    paymentMethodCreation: 'manual' as const
  };
  if (total === 0) return { ...common, mode: 'setup' };
  return {
    ...common,
    mode: 'payment',
    amount: total,
    ...(willReusePaymentMethod(checkout) ? { setupFutureUsage: 'off_session' as const } : {})
  };
};

// Stripe.js throws synchronously on a malformed secret (checkout-v3 #764).
const SECRET_RE = /^(pi|seti)_[^_]+_secret_.+$/;

export type ClientSecret = { secret: string; kind: 'payment' | 'setup' };

/** The PaymentIntent or SetupIntent secret POST /paymentMethod returned. */
export const checkoutClientSecret = (checkout: ApiCheckout): ClientSecret | null => {
  const settings = checkout.paymentOptions?.paymentSettings;
  if (!settings || settings.swishUrl || settings.vippsPayment) return null;
  const value = settings.setupIntent?.clientSecret ?? settings.clientSecret;
  const match = value ? SECRET_RE.exec(value) : null;
  if (!value || !match) return null;
  return { secret: value, kind: match[1] === 'pi' ? 'payment' : 'setup' };
};

/** succeeded / processing → paid, poll; canceled / requires_payment_method → declined. */
export const intentOutcome = (status: string | null | undefined): 'handoff' | 'failed' | 'poll' => {
  if (status === 'succeeded' || status === 'processing') return 'handoff';
  if (status === 'canceled' || status === 'requires_payment_method') return 'failed';
  return 'poll';
};

// --- The sheet's contact (checkout-v4 lib/checkout/express-contact.ts, trimmed).

export type ExpressContact = {
  firstName?: string;
  lastName?: string;
  /** E.164. */
  phone?: string;
  address?: ApiAddress;
};

type ConfirmPayload = Pick<
  StripeExpressCheckoutElementConfirmEvent,
  'billingDetails' | 'shippingAddress'
>;

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

/** checkout-v3 #383: the last token is the last name ("Anna Maria" / "Svensson"). */
const splitName = (value: unknown): { firstName?: string; lastName?: string } => {
  const tokens = text(value).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return {};
  if (tokens.length === 1) return { firstName: tokens[0] };
  return { firstName: tokens.slice(0, -1).join(' '), lastName: tokens[tokens.length - 1] };
};

/**
 * Wallets may send a national number: it is read in the checkout's country,
 * but only when the sheet ships there or names no country (checkout-v4): a
 * Norwegian "412 34 567" on an SE checkout would otherwise become a valid,
 * wrong +46 number. The check is the paywall's length check; the backend
 * validates fully.
 */
const normalizePhone = (value: unknown, defaultCountry: string, shippingCountry: string) => {
  const raw = text(value);
  if (!raw) return undefined;
  if (shippingCountry && shippingCountry !== defaultCountry && !/^(\+|00)/.test(raw)) {
    return undefined;
  }
  const parsed = parsePhoneNumber(raw, defaultCountry);
  return parsed.valid && parsed.value ? parsed.value : undefined;
};

/**
 * The sheet's contact, normalised once. PII: never logged. Only a complete
 * shipping address counts (checkout-v3 #383).
 */
export const normalizeExpressContact = (
  event: ConfirmPayload,
  defaultCountry: string
): ExpressContact => {
  const contact: ExpressContact = splitName(
    text(event.billingDetails?.name) || text(event.shippingAddress?.name)
  );
  const phone = normalizePhone(
    event.billingDetails?.phone,
    defaultCountry,
    text(event.shippingAddress?.address?.country).toUpperCase()
  );
  if (phone) contact.phone = phone;
  const a = event.shippingAddress?.address;
  const street = text(a?.line1);
  const zip = text(a?.postal_code);
  const city = text(a?.city);
  const country = text(a?.country).toUpperCase();
  if (street && zip && city && country) {
    const co = text(a?.line2);
    contact.address = {
      street,
      zip,
      city,
      country,
      ...(co ? { co } : {}),
      ...splitName(event.shippingAddress?.name)
    };
  }
  return contact;
};

export type WalletGap = 'name' | 'phone' | 'address' | 'birthdate';

/**
 * What to save from the sheet and the inline fields with one POST
 * /userdetails before POST /paymentMethod (checkout-v4 walletSave): a saved
 * name, phone or birthdate is never overwritten, and a required field left
 * empty is a gap that sends the reader to the hosted checkout.
 */
export const walletSave = (
  checkout: ApiCheckout,
  contact: ExpressContact,
  wallet: Wallet = 'applePay',
  inline: InlineDetails = {}
): { body: (ApiUserDetails & { isBusiness: boolean }) | null; missing: WalletGap[] } => {
  const f = checkout.settings?.fieldSettings;
  const d = checkout.userDetails;
  const needsAddress = checkout.settings?.requireAddress === true;
  const body: ApiUserDetails & { isBusiness: boolean } = { isBusiness: d?.isBusiness ?? false };
  const missing: WalletGap[] = [];
  // A saved address that counts (addressDone) carries its recipient's name:
  // then the address needs no name from the sheet (sheetRequirements doesn't
  // ask one).
  const saved = addressDone(checkout);
  const addressNeedsName = needsAddress && !saved;

  if (fieldOf(f?.name).enabled || addressNeedsName) {
    const firstName = d?.firstName || contact.firstName;
    const lastName = d?.lastName || contact.lastName;
    if (firstName && lastName) {
      if (!d?.firstName) body.firstName = firstName;
      if (!d?.lastName) body.lastName = lastName;
    } else if (fieldOf(f?.name).required || addressNeedsName) {
      missing.push('name');
    }
  }

  if (fieldOf(f?.phone).enabled && !d?.mobilePhone) {
    // Google Pay's phone only for an optional field (sheetRequirements).
    const phone = inlineRequirements(checkout, wallet).phone ? inline.mobilePhone : contact.phone;
    if (phone) body.mobilePhone = phone;
    else if (fieldOf(f?.phone).required) missing.push('phone');
  }

  if (fieldOf(f?.birthdate).enabled && !d?.birthdate) {
    if (inline.birthdate) body.birthdate = inline.birthdate;
    else if (fieldOf(f?.birthdate).required) missing.push('birthdate');
  }

  if (needsAddress) {
    const a = contact.address;
    const firstName = a?.firstName ?? body.firstName ?? d?.firstName;
    const lastName = a?.lastName ?? body.lastName ?? d?.lastName;
    // The sheet only ships to the checkout's country (allowedShippingCountries),
    // and its address must pass the step's own limits (checkout-v4 walletSave).
    const sheet: ApiAddress | null =
      a && a.country === checkout.country && firstName && lastName
        ? {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            street: a.street,
            zip: a.zip,
            city: a.city,
            country: checkout.country,
            ...(a.co ? { co: a.co } : {}),
            // The backend replaces the address whole: keep what the sheet doesn't own.
            ...(d?.address?.department ? { department: d.address.department } : {})
          }
        : null;
    if (sheet && addressValid(sheet)) {
      // The sheet's address replaces a saved one; the same one isn't resent.
      if (!(saved && sameAddress(sheet, d?.address))) body.address = sheet;
    } else if (!saved) {
      missing.push('address');
    }
  }

  const sends =
    body.firstName !== undefined ||
    body.lastName !== undefined ||
    body.mobilePhone !== undefined ||
    body.birthdate !== undefined ||
    body.address !== undefined;
  return { body: sends && missing.length === 0 ? body : null, missing };
};

/**
 * The checkout-api view of a checkout sesamy-js just created, owned by the
 * signed-in reader. The owner is set with POST /owner like checkout-v4's
 * Details step. The reader's token goes along only when the checkout
 * requires login (checkout-v4 sends it there and nowhere else), and only
 * ever to checkout-api.
 */
export const prepareCheckout = async (
  checkoutApi: CheckoutApi,
  checkoutId: string,
  email: string,
  getToken: () => Promise<string | null>,
  /**
   * Whether the reader this checkout is prepared for is still the signed-in
   * one. Checked before the token is asked for and before the owner is
   * written, so a logout or another login mid-way never sets this reader as
   * owner, nor hands the next session's token to their checkout.
   */
  stillCurrent: () => boolean = () => true
): Promise<ApiCheckout> => {
  const checkout = await checkoutApi.get(checkoutId);
  if (!stillCurrent()) throw new ReaderChangedError();
  if (checkout.user?.email?.toLowerCase() === email.toLowerCase()) return checkout;
  const token = isAuthRequired(checkout) ? await getToken() : null;
  if (!stillCurrent()) throw new ReaderChangedError();
  return checkoutApi.setOwner(checkoutId, { email }, token);
};

// --- The payment.

export type ExpressOutcome =
  | { kind: 'completed'; checkout: ApiCheckout }
  /** Paid, but checkout-api hasn't confirmed it within the wait. */
  | { kind: 'processing' }
  /** Retryable: the sheet stays usable. `message` is Stripe's localised text. */
  | { kind: 'declined'; message?: string }
  /** The sheet couldn't give what the checkout requires. */
  | { kind: 'fallback'; missing: WalletGap[] }
  | { kind: 'error'; reason: 'generic' | 'payment-method' | 'missing-secret' };

export type PayDeps = {
  stripe: Pick<
    Stripe,
    | 'createPaymentMethod'
    | 'confirmCardPayment'
    | 'confirmCardSetup'
    | 'retrievePaymentIntent'
    | 'retrieveSetupIntent'
  >;
  elements: Pick<StripeElements, 'submit'>;
  checkoutApi: CheckoutApi;
  checkout: ApiCheckout;
  /** The signed-in reader's email, the billing email on the PaymentMethod. */
  email: string;
  event: Pick<
    StripeExpressCheckoutElementConfirmEvent,
    'billingDetails' | 'shippingAddress' | 'expressPaymentType' | 'paymentFailed'
  >;
  returnUrl: string;
  /** What the reader filled in next to the buttons. */
  inline?: InlineDetails;
  /** How long to poll for COMPLETED once Stripe holds the payment. */
  pollTimeoutMs?: number;
  pollIntervalMs?: number;
  wait?: (ms: number) => Promise<void>;
};

const SHOWS_STRIPE_MESSAGE = new Set(['card_error', 'validation_error']);

const defaultWait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** After Stripe holds the payment: mark the checkout waiting (best effort), then poll. */
export const awaitCompletion = async (
  checkoutApi: CheckoutApi,
  checkoutId: string,
  { timeoutMs = 60_000, intervalMs = 1500, wait = defaultWait } = {}
): Promise<ExpressOutcome> => {
  // Every request is bounded by the same deadline: a request that never
  // settles must not hold the reader past it. A late answer is dropped.
  const deadline = Date.now() + timeoutMs;
  const TIMED_OUT = Symbol('timed out');
  const within = <T>(request: () => Promise<T>): Promise<T | typeof TIMED_OUT> => {
    const remaining = deadline - Date.now();
    if (remaining <= 0) return Promise.resolve(TIMED_OUT);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<typeof TIMED_OUT>((resolve) => {
      timer = setTimeout(() => resolve(TIMED_OUT), remaining);
    });
    return Promise.race([request(), timeout]).finally(() => clearTimeout(timer));
  };

  try {
    const current = await within(() => checkoutApi.get(checkoutId));
    if (current !== TIMED_OUT) {
      if (current.status === 'COMPLETED') return { kind: 'completed', checkout: current };
      if (current.status === 'PENDING') await within(() => checkoutApi.setWaiting(checkoutId));
    }
  } catch {
    // The webhook may have won the race; the poll decides.
  }
  while (Date.now() < deadline) {
    await wait(intervalMs);
    try {
      const current = await within(() => checkoutApi.get(checkoutId));
      if (current === TIMED_OUT) break;
      if (current.status === 'COMPLETED') return { kind: 'completed', checkout: current };
      if (current.status === 'FAILED') return { kind: 'declined' };
    } catch {
      // A read failing is no answer: keep polling.
    }
  }
  // Unknown at the deadline: paid as far as Stripe is concerned, never a decline.
  return { kind: 'processing' };
};

/**
 * One wallet payment, from the Express Checkout Element's confirm event to
 * the checkout's completion. Mirrors checkout-v4's pay(): every failure
 * before Stripe holds the payment closes the sheet with paymentFailed().
 */
export const payWithWallet = async ({
  stripe,
  elements,
  checkoutApi,
  checkout,
  email,
  event,
  returnUrl,
  inline,
  pollTimeoutMs,
  pollIntervalMs,
  wait
}: PayDeps): Promise<ExpressOutcome> => {
  const wallet: Wallet = event.expressPaymentType === 'apple_pay' ? 'applePay' : 'googlePay';
  let handedToStripe = false;
  const fail = <T extends ExpressOutcome>(outcome: T): T => {
    if (!handedToStripe) event.paymentFailed({ reason: 'fail' });
    return outcome;
  };
  const poll = () =>
    awaitCompletion(checkoutApi, checkout.id, {
      timeoutMs: pollTimeoutMs,
      intervalMs: pollIntervalMs,
      wait
    });

  const { error: submitError } = await elements.submit();
  if (submitError) return fail({ kind: 'declined', message: submitError.message });

  // The sheet's contact, checked before anything is written: a gap sends the
  // reader to the hosted checkout with nothing half-saved.
  const contact = normalizeExpressContact(event, checkout.country);
  const save = walletSave(checkout, contact, wallet, inline);
  if (save.missing.length) return fail({ kind: 'fallback', missing: save.missing });

  // Collect the PaymentMethod first and confirm the intent with its id
  // (checkout-v3 #878: confirming with `elements` fails for a 0-kr SetupIntent).
  const name =
    [
      save.body?.firstName ?? checkout.userDetails?.firstName,
      save.body?.lastName ?? checkout.userDetails?.lastName
    ]
      .filter(Boolean)
      .join(' ') || null;
  const { error: methodError, paymentMethod } = await stripe.createPaymentMethod({
    elements: elements as StripeElements,
    params: {
      billing_details: {
        email,
        name,
        phone: save.body?.mobilePhone ?? checkout.userDetails?.mobilePhone ?? null,
        address: { country: checkout.country }
      }
    }
  });
  if (methodError || !paymentMethod) {
    return fail({ kind: 'declined', message: methodError?.message });
  }

  // Saved before the method: with a method set, /userdetails prepares a new
  // intent, so the one confirmed below must come from /paymentMethod.
  if (save.body) {
    try {
      await checkoutApi.setUserDetails(checkout.id, save.body);
    } catch {
      return fail({ kind: 'error', reason: 'generic' });
    }
  }

  let updated: ApiCheckout;
  try {
    updated = await checkoutApi.setPaymentMethod(checkout.id, {
      provider: 'STRIPE',
      method: 'CARD',
      wallet: wallet === 'applePay' ? 'APPLEPAY' : 'GOOGLEPAY'
    });
  } catch {
    // The write may have gone through, or another tab moved on (v3 #790).
    const current = await checkoutApi.get(checkout.id).catch(() => null);
    if (current?.status === 'COMPLETED') return { kind: 'completed', checkout: current };
    if (current?.status === 'WAITING_PAYMENT_CONFIRMATION') return poll();
    return fail({ kind: 'error', reason: 'payment-method' });
  }

  const secret = checkoutClientSecret(updated);
  if (!secret) return fail({ kind: 'error', reason: 'missing-secret' });

  handedToStripe = true;
  // 3-D Secure runs in Stripe's modal; a redirect fallback returns here.
  const confirmData = { payment_method: paymentMethod.id, return_url: returnUrl };
  const result =
    secret.kind === 'setup'
      ? await stripe.confirmCardSetup(secret.secret, confirmData)
      : await stripe.confirmCardPayment(secret.secret, confirmData);

  const error: StripeError | undefined = result.error;
  const intent: PaymentIntent | SetupIntent | undefined =
    'setupIntent' in result
      ? result.setupIntent
      : 'paymentIntent' in result
        ? result.paymentIntent
        : undefined;

  if (error?.type === 'api_connection_error') {
    // Indeterminate: ask Stripe before the reader can pay again.
    let status: string | undefined;
    try {
      status =
        secret.kind === 'setup'
          ? (await stripe.retrieveSetupIntent(secret.secret)).setupIntent?.status
          : (await stripe.retrievePaymentIntent(secret.secret)).paymentIntent?.status;
    } catch {
      status = undefined;
    }
    if (intentOutcome(status) === 'handoff' || !status || status === 'requires_action') {
      return poll();
    }
    return { kind: 'error', reason: 'generic' };
  }

  if (error) {
    // A succeeded intent can come back as an "unexpected state" error.
    const errorIntent = (error.payment_intent ?? error.setup_intent) as
      | PaymentIntent
      | SetupIntent
      | undefined;
    if (intentOutcome(errorIntent?.status) === 'handoff') return poll();
    return {
      kind: 'declined',
      message: SHOWS_STRIPE_MESSAGE.has(error.type) ? error.message : undefined
    };
  }
  if (intent && intentOutcome(intent.status) === 'failed') return { kind: 'declined' };

  return poll();
};
