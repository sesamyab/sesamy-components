import type { Checkout } from '@sesamy/sdk';

export type PaymentMethodType = {
  provider: string;
  method: string;
};

export const goToCheckout = async (
  checkout: Checkout,
  paymentMethod?: PaymentMethodType,
  business?: boolean
) => {
  const checkoutURL = new URL(checkout.checkoutUrl);

  checkoutURL.searchParams.set('norecreate', 'true');
  checkoutURL.searchParams.set('lang', checkout.language);
  checkoutURL.searchParams.set('redirect-url', checkout.redirectUrl);
  if (paymentMethod) {
    checkoutURL.searchParams.set('payment-method', paymentMethod.method);
  }
  if (business) {
    checkoutURL.searchParams.set('business', 'true');
  }

  window.location.href = checkoutURL.href;
};
