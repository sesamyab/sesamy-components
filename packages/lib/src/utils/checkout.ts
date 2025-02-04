import type { Checkout } from '@sesamy/sesamy-js';
import type { IconName } from 'src/icons/types';

const ENV = import.meta.env.MODE;
export const CHECKOUT_URL =
  ENV === 'production' ? 'https://checkout3.sesamy.com' : 'https://checkout3.sesamy.dev';

export type PaymentMethodType = {
  provider: string;
  method: string;
  icon: IconName;
};

export const goToCheckout = async (
  checkout: Checkout,
  paymentMethod?: PaymentMethodType,
  business?: boolean
) => {
  const checkoutURL = new URL(CHECKOUT_URL);

  checkoutURL.pathname = checkout.id;
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
