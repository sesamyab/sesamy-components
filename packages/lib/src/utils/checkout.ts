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
