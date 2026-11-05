import { describe, it, expect, afterEach, vi } from 'vitest';
import { getWalletPaymentMethods } from './wallets';

const GOOGLE_PAY = { provider: 'STRIPE', method: 'GOOGLE-PAY' };
const APPLE_PAY = { provider: 'STRIPE', method: 'APPLE-PAY' };
const STRIPE_CARD = [{ provider: 'STRIPE', method: 'CARD' }];

const UA = {
  desktopChrome:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  androidChrome:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
  iPhoneChrome:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.0.0 Mobile/15E148 Safari/604.1'
};

const stubBrowser = ({
  userAgent,
  mobile,
  applePaySession = false
}: {
  userAgent: string;
  mobile?: boolean;
  applePaySession?: boolean;
}) => {
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(userAgent);
  if (mobile !== undefined) {
    Object.defineProperty(navigator, 'userAgentData', { value: { mobile }, configurable: true });
  }
  if (applePaySession) {
    vi.stubGlobal('ApplePaySession', function ApplePaySession() {});
  }
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete (navigator as Navigator & { userAgentData?: unknown }).userAgentData;
});

describe('getWalletPaymentMethods', () => {
  it('offers both wallets in desktop Chrome, which has no ApplePaySession', () => {
    stubBrowser({ userAgent: UA.desktopChrome, mobile: false });
    expect(getWalletPaymentMethods(STRIPE_CARD)).toEqual([GOOGLE_PAY, APPLE_PAY]);
  });

  it('offers both wallets when the browser has a native ApplePaySession (iOS)', () => {
    stubBrowser({ userAgent: UA.iPhoneChrome, applePaySession: true });
    expect(getWalletPaymentMethods(STRIPE_CARD)).toEqual([GOOGLE_PAY, APPLE_PAY]);
  });

  it('offers only Google Pay on Android without ApplePaySession', () => {
    stubBrowser({ userAgent: UA.androidChrome });
    expect(getWalletPaymentMethods(STRIPE_CARD)).toEqual([GOOGLE_PAY]);
  });

  it('offers only Google Pay when userAgentData reports a mobile browser', () => {
    stubBrowser({ userAgent: UA.desktopChrome, mobile: true });
    expect(getWalletPaymentMethods(STRIPE_CARD)).toEqual([GOOGLE_PAY]);
  });

  it('offers neither when Stripe has no card', () => {
    stubBrowser({ userAgent: UA.desktopChrome });
    expect(getWalletPaymentMethods([{ provider: 'STRIPE', method: 'SWISH' }])).toEqual([]);
  });

  it('offers neither when card comes from another provider', () => {
    expect(getWalletPaymentMethods([{ provider: 'ADYEN', method: 'CARD' }])).toEqual([]);
  });

  it('offers neither when the checkout has no payment methods', () => {
    expect(getWalletPaymentMethods([])).toEqual([]);
  });
});
