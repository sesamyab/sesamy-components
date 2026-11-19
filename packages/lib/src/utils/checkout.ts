import type { Checkout } from '@sesamy/sesamy-js';

export type PaymentMethodType = {
  provider: string;
  method: string;
};

/**
 * Resolve where the visitor lands after a purchase, the same way the paywall
 * resolves its other layered settings: the first candidate that holds a usable
 * URL wins, falling back to the page the visitor came from.
 *
 * Callers pass the candidates most specific first — the chosen subscription
 * option's `redirectUrl`, the paywall-wide `settings.redirectUrl`, then the
 * `redirect-url` attribute on the element.
 *
 * Every level is optional and can hold hand-written or legacy data, so a
 * candidate only wins if it is a non-blank absolute URL. Empty, whitespace-only
 * and unparseable values fall through to the level below instead of overriding
 * it with something the checkout cannot redirect to. Parsing matches the
 * paywall API's own validation (`new URL()`), so anything it stored is accepted
 * here.
 */
export const resolveRedirectUrl = (...candidates: (string | undefined)[]): string => {
  for (const candidate of candidates) {
    const redirectUrl = candidate?.trim();
    if (!redirectUrl) continue;

    try {
      new URL(redirectUrl);
    } catch {
      console.warn(`Ignoring paywall redirect url that is not an absolute URL: ${redirectUrl}`);
      continue;
    }

    return redirectUrl;
  }

  return window.location.href;
};

/**
 * Resolve the label of the button that takes the visitor back to the publisher
 * on the checkout confirmation page and in the order confirmation email. The
 * candidates and their order match `resolveRedirectUrl`: the chosen option's
 * `redirectLabel`, the paywall-wide `settings.redirectLabel`, then the
 * `redirect-label` attribute on the element.
 *
 * The first non-blank value wins, trimmed. With none, the label is left unset
 * so the checkout keeps its own "Go to {vendor}" default.
 */
export const resolveRedirectLabel = (...candidates: (string | undefined)[]): string | undefined => {
  for (const candidate of candidates) {
    const redirectLabel = candidate?.trim();
    if (redirectLabel) return redirectLabel;
  }

  return undefined;
};

const UTM_ATTRIBUTES = [
  ['utmSource', 'utm-source'],
  ['utmMedium', 'utm-medium'],
  ['utmCampaign', 'utm-campaign'],
  ['utmTerm', 'utm-term'],
  ['utmContent', 'utm-content']
] as const;

export type UtmAttribution = Partial<Record<(typeof UTM_ATTRIBUTES)[number][0], string>>;

/**
 * The checkout attribution for the `utm-*` attributes on the paywall element.
 *
 * Only the attributes that are actually set. An unset one sent as undefined
 * would override the UTMs sesamy-js stored from the landing URL.
 */
export const utmAttribution = (
  props?: Partial<Record<(typeof UTM_ATTRIBUTES)[number][1], string>>
): UtmAttribution => {
  const utm: UtmAttribution = {};
  for (const [key, attribute] of UTM_ATTRIBUTES) {
    const value = props?.[attribute];
    if (value) utm[key] = value;
  }
  return utm;
};

/**
 * The hosts the reader's access token may be handed to. These are the
 * `CHECKOUT_URL` the Sesamy API builds `checkoutUrl` from, and the host
 * sesamy-js's own `generateLink({ target: 'checkout' })` links to:
 * `checkout3` on sesamy.com (prod) and sesamy.dev (dev).
 *
 * `checkoutUrl` comes from an API response, so it is checked before a token is
 * attached. Anything else, including a lookalike or a plain-http URL, goes
 * without one.
 */
const TOKEN_CHECKOUT_HOSTS = new Set(['checkout3.sesamy.com', 'checkout3.sesamy.dev']);

const isTokenCheckoutHost = (url: URL) =>
  url.protocol === 'https:' && TOKEN_CHECKOUT_HOSTS.has(url.hostname);

/**
 * How long to wait for the token before going to checkout without it. A
 * signed-in reader's token is normally cached, so this only bounds a slow
 * silent refresh: the reader then gets checkout's login instead of a stalled
 * button.
 */
export const CHECKOUT_TOKEN_TIMEOUT_MS = 5000;

/** The part of `api.auth` that hands a signed-in reader's login to checkout. */
export type CheckoutAuth = {
  isAuthenticated(): Promise<boolean>;
  getTokenSilently(throwOnUnauthorized: boolean, forceRefresh?: boolean): Promise<string | null>;
};

/**
 * The signed-in reader's access token, or null when there is none to hand
 * over. Mirrors sesamy-js's `generateLink`: `getTokenSilently(false, true)`,
 * which refreshes a token that is about to expire so checkout gets one that
 * lasts. In cookie (BFF) mode the token is in an HttpOnly cookie and this is
 * null, so checkout keeps its own login there.
 *
 * Never throws: a failed lookup sends the reader to checkout without a token,
 * where they can still log in.
 */
const checkoutAccessToken = async (auth: CheckoutAuth): Promise<string | null> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), CHECKOUT_TOKEN_TIMEOUT_MS);
  });

  const lookup = (async () => {
    // Ask first, so an anonymous reader doesn't trigger a silent-auth round
    // trip on their way to checkout.
    if (!(await auth.isAuthenticated())) return null;
    return (await auth.getTokenSilently(false, true)) || null;
  })().catch(() => null);

  try {
    return await Promise.race([lookup, timeout]);
  } finally {
    clearTimeout(timer);
  }
};

export type GoToCheckoutOptions = {
  /**
   * `api.auth`. When the reader is signed in with a token sesamy-js can read,
   * it goes to checkout in the URL fragment so they are not asked to log in
   * again.
   */
  auth?: CheckoutAuth;
  paymentMethod?: PaymentMethodType;
  business?: boolean;
  /**
   * Cancels the handoff. Checked after the token lookup, which can take up to
   * `CHECKOUT_TOKEN_TIMEOUT_MS`: a reader who backs out of the checkout in that
   * time stays on the page instead of being sent to the one they abandoned.
   */
  signal?: AbortSignal;
};

export const goToCheckout = async (
  checkout: Checkout,
  { auth, paymentMethod, business, signal }: GoToCheckoutOptions = {}
) => {
  const checkoutURL = new URL(checkout.checkoutUrl);

  checkoutURL.searchParams.set('norecreate', 'true');
  if (checkout.language) {
    checkoutURL.searchParams.set('lang', checkout.language);
  }
  if (checkout.redirectUrl) {
    checkoutURL.searchParams.set('redirect-url', checkout.redirectUrl);
  }
  if (paymentMethod) {
    checkoutURL.searchParams.set('payment-method', paymentMethod.method);
  }
  if (business) {
    checkoutURL.searchParams.set('business', 'true');
  }

  // The same handoff as sesamy-js's `generateLink`: in the fragment only, which
  // the browser sends neither to the server nor in the Referer. Never a query
  // param. Checkout reads it, adopts it and removes it from the URL.
  if (auth && isTokenCheckoutHost(checkoutURL)) {
    const token = await checkoutAccessToken(auth);
    if (token) {
      checkoutURL.hash = `#access_token=${token}`;
    }
  }

  if (signal?.aborted) return;
  window.location.href = checkoutURL.href;
};
