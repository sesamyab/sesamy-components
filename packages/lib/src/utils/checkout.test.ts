import { describe, it, expect, afterEach, vi } from 'vitest';
import type { Checkout } from '@sesamy/sesamy-js';
import { goToCheckout, resolveRedirectUrl } from './checkout';

const PAGE_URL = 'https://vendor.example/article';

// jsdom refuses to navigate, so swap `window.location` for a plain object: it
// both pins the page URL the last fall-through level reads and captures the
// href `goToCheckout` navigates to. Captured once at module load, so restoring
// puts the native location back however many times a test re-stubs.
const nativeLocation = Object.getOwnPropertyDescriptor(window, 'location');

const stubLocation = (href = PAGE_URL) => {
  Object.defineProperty(window, 'location', {
    value: { href },
    writable: true,
    configurable: true
  });
  return window.location as unknown as { href: string };
};

const restoreLocation = () => {
  if (nativeLocation) {
    Object.defineProperty(window, 'location', nativeLocation);
  }
};

const checkout = (redirectUrl: string): Checkout =>
  ({
    id: 'checkout_1',
    checkoutUrl: 'https://checkout.sesamy.dev/checkout_1',
    redirectUrl
  }) as Checkout;

/** The `redirect-url` param the visitor actually gets sent to checkout with. */
const redirectParamFor = (...candidates: (string | undefined)[]) => {
  const location = stubLocation();
  goToCheckout(checkout(resolveRedirectUrl(...candidates)));
  return new URL(location.href).searchParams.get('redirect-url');
};

afterEach(() => {
  restoreLocation();
  vi.restoreAllMocks();
});

describe('resolveRedirectUrl', () => {
  const OPTION = 'https://vendor.example/thanks/option';
  const PAYWALL = 'https://vendor.example/thanks/paywall';
  const ELEMENT = 'https://vendor.example/thanks/element';

  it('prefers the subscription option over every level below it', () => {
    expect(redirectParamFor(OPTION, PAYWALL, ELEMENT)).toBe(OPTION);
  });

  it('falls through to the paywall-wide default when the option has none', () => {
    expect(redirectParamFor(undefined, PAYWALL, ELEMENT)).toBe(PAYWALL);
  });

  it('falls through to the element attribute when the paywall has no default', () => {
    expect(redirectParamFor(undefined, undefined, ELEMENT)).toBe(ELEMENT);
  });

  it('falls back to the current page when nothing is configured', () => {
    expect(redirectParamFor(undefined, undefined, undefined)).toBe(PAGE_URL);
  });

  it('behaves exactly as before for a paywall without the new fields', () => {
    // The only two levels that exist today, with and without the attribute.
    expect(redirectParamFor(undefined, undefined, ELEMENT)).toBe(ELEMENT);
    expect(redirectParamFor(undefined, undefined, undefined)).toBe(PAGE_URL);
  });

  describe('empty and whitespace-only values fall through rather than winning', () => {
    it.each([
      { level: 'option', candidates: ['', PAYWALL, ELEMENT], expected: PAYWALL },
      { level: 'option (whitespace)', candidates: ['   ', PAYWALL, ELEMENT], expected: PAYWALL },
      { level: 'paywall', candidates: [undefined, '', ELEMENT], expected: ELEMENT },
      {
        level: 'paywall (whitespace)',
        candidates: [undefined, '\n\t ', ELEMENT],
        expected: ELEMENT
      },
      { level: 'element', candidates: [undefined, undefined, ''], expected: PAGE_URL },
      {
        level: 'element (whitespace)',
        candidates: [undefined, undefined, '  '],
        expected: PAGE_URL
      },
      { level: 'every level', candidates: ['', '  ', ''], expected: PAGE_URL }
    ])('$level', ({ candidates, expected }) => {
      expect(redirectParamFor(...candidates)).toBe(expected);
    });
  });

  describe('values that are not absolute URLs warn and fall through', () => {
    it.each([
      { kind: 'a relative path', value: '/thanks' },
      { kind: 'a protocol-relative url', value: '//vendor.example/thanks' },
      { kind: 'a bare host', value: 'vendor.example/thanks' },
      { kind: 'junk', value: 'not a url at all' }
    ])('$kind', ({ value }) => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      expect(redirectParamFor(value, undefined, ELEMENT)).toBe(ELEMENT);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining(value));
    });
  });

  it('keeps falling through until it finds a usable url', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(redirectParamFor('/option', '   ', '/element')).toBe(PAGE_URL);
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('trims a padded value instead of sending the padding to checkout', () => {
    expect(redirectParamFor(`  ${OPTION}  `)).toBe(OPTION);
  });

  it('accepts any absolute url the paywall API would have stored', () => {
    // The API validates with `new URL()`, so the component must not be stricter.
    expect(redirectParamFor('http://vendor.example/thanks')).toBe('http://vendor.example/thanks');
    expect(redirectParamFor('myapp://purchase/done')).toBe('myapp://purchase/done');
  });
});

describe('goToCheckout', () => {
  it('carries the resolved redirect through to the checkout url', () => {
    const location = stubLocation();

    goToCheckout(checkout('https://vendor.example/thanks'));

    const url = new URL(location.href);
    expect(url.origin + url.pathname).toBe('https://checkout.sesamy.dev/checkout_1');
    expect(url.searchParams.get('redirect-url')).toBe('https://vendor.example/thanks');
    expect(url.searchParams.get('norecreate')).toBe('true');
  });
});
