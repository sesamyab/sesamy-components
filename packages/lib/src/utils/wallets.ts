import type { PaymentMethodType } from './checkout';

/**
 * Apple Pay outside Safari needs Apple's own SDK, whose `canMakePayments`
 * refuses mobile browsers (`navigator.userAgentData.mobile`), and Stripe's
 * Express Checkout Element doesn't support Apple Pay in Chrome on Android. So
 * a mobile browser without a native `ApplePaySession` can't pay with it. iOS
 * browsers all have the native session.
 */
const isMobileWithoutApplePay = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  if ('ApplePaySession' in window) return false;
  const userAgentData = (navigator as Navigator & { userAgentData?: { mobile?: boolean } })
    .userAgentData;
  return !!userAgentData?.mobile || /Android/i.test(navigator.userAgent);
};

/**
 * Apple Pay and Google Pay go through Stripe card payments, so the paywall
 * offers them whenever the checkout has Stripe card, in any browser, except
 * Apple Pay on mobile browsers that can't run it (see above). Checkout then
 * asks Stripe's Express Checkout Element whether the wallet can run here, and
 * drops the reader on its payment step if it can't.
 */
export const getWalletPaymentMethods = (
  paymentMethods: PaymentMethodType[]
): PaymentMethodType[] => {
  if (!paymentMethods.some(({ provider, method }) => provider === 'STRIPE' && method === 'CARD')) {
    return [];
  }
  const wallets: PaymentMethodType[] = [{ provider: 'STRIPE', method: 'GOOGLE-PAY' }];
  if (!isMobileWithoutApplePay()) {
    wallets.push({ provider: 'STRIPE', method: 'APPLE-PAY' });
  }
  return wallets;
};
