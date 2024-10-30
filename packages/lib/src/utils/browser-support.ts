export const isSupportingGooglePay = () =>
  /Chrome/.test(navigator?.userAgent) && !/Edge|OPR/.test(navigator?.userAgent);

export const isSupportingApplePay = () => window?.ApplePaySession;
