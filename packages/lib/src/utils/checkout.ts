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

export const goToCheckout = async (
  checkout: Checkout,
  paymentMethod?: PaymentMethodType,
  business?: boolean
) => {
  const checkoutURL = new URL(checkout.checkoutUrl);

  checkoutURL.searchParams.set('norecreate', 'true');
  if (checkout.language) {
    checkoutURL.searchParams.set('lang', checkout.language);
  }
  checkoutURL.searchParams.set('redirect-url', checkout.redirectUrl);
  if (paymentMethod) {
    checkoutURL.searchParams.set('payment-method', paymentMethod.method);
  }
  if (business) {
    checkoutURL.searchParams.set('business', 'true');
  }

  window.location.href = checkoutURL.href;
};
