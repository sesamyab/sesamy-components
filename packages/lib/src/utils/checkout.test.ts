import { describe, it, expect, afterEach, vi } from 'vitest';
import type { Checkout } from '@sesamy/sesamy-js';
import {
  CHECKOUT_TOKEN_TIMEOUT_MS,
  goToCheckout,
  resolveRedirectLabel,
  resolveRedirectUrl
} from './checkout';

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

  describe('hands a signed-in reader’s login to checkout', () => {
    // A fake, not a real JWT: tests never print or hold real tokens.
    const TOKEN = 'header.payload.signature';
    const SESAMY_CHECKOUT = 'https://checkout3.sesamy.com/checkouts/checkout_1';

    const auth = ({
      authenticated = true,
      token = TOKEN as string | null | Error
    }: { authenticated?: boolean; token?: string | null | Error } = {}) => ({
      isAuthenticated: vi.fn(async () => authenticated),
      getTokenSilently: vi.fn(async () => {
        if (token instanceof Error) throw token;
        return token;
      })
    });

    const goTo = async (checkoutUrl: string, fakeAuth?: ReturnType<typeof auth>) => {
      const location = stubLocation();
      await goToCheckout(
        { ...checkout('https://vendor.example/thanks'), checkoutUrl } as Checkout,
        { auth: fakeAuth, paymentMethod: { provider: 'STRIPE', method: 'CARD' }, business: true }
      );
      return new URL(location.href);
    };

    it.each([
      { env: 'prod', checkoutUrl: SESAMY_CHECKOUT },
      { env: 'dev', checkoutUrl: 'https://checkout3.sesamy.dev/checkouts/checkout_1' }
    ])('puts the token in the fragment for the $env checkout', async ({ checkoutUrl }) => {
      const fakeAuth = auth();

      const url = await goTo(checkoutUrl, fakeAuth);

      expect(url.hash).toBe(`#access_token=${TOKEN}`);
      // Fragment only: the token must never reach a server as a query param.
      expect(url.search).not.toContain(TOKEN);
      expect(url.searchParams.has('access_token')).toBe(false);
      // The rest of the handoff is untouched.
      expect(url.origin + url.pathname).toBe(checkoutUrl);
      expect(url.searchParams.get('payment-method')).toBe('CARD');
      expect(url.searchParams.get('business')).toBe('true');
      // The same call sesamy-js's generateLink makes: no throw, refresh if near expiry.
      expect(fakeAuth.getTokenSilently).toHaveBeenCalledWith(false, true);
    });

    it('leaves the url unchanged for a reader who is not signed in', async () => {
      const fakeAuth = auth({ authenticated: false });

      const url = await goTo(SESAMY_CHECKOUT, fakeAuth);

      expect(url.hash).toBe('');
      expect(fakeAuth.getTokenSilently).not.toHaveBeenCalled();
    });

    it('leaves the url unchanged in cookie mode, where sesamy-js has no token to give', async () => {
      // The cookie plugin's getTokenSilently always resolves null.
      const url = await goTo(SESAMY_CHECKOUT, auth({ token: null }));

      expect(url.hash).toBe('');
      expect(url.href).not.toContain('access_token');
    });

    it('goes to checkout without a token when the lookup fails', async () => {
      const url = await goTo(SESAMY_CHECKOUT, auth({ token: new Error('login_required') }));

      expect(url.origin + url.pathname).toBe(SESAMY_CHECKOUT);
      expect(url.hash).toBe('');
    });

    it('goes to checkout without a token when the lookup hangs', async () => {
      vi.useFakeTimers();
      try {
        const location = stubLocation();
        const hanging = {
          isAuthenticated: async () => true,
          getTokenSilently: () => new Promise<string | null>(() => {})
        };

        const navigation = goToCheckout(
          {
            ...checkout('https://vendor.example/thanks'),
            checkoutUrl: SESAMY_CHECKOUT
          } as Checkout,
          { auth: hanging }
        );
        await vi.advanceTimersByTimeAsync(CHECKOUT_TOKEN_TIMEOUT_MS);
        await navigation;

        const url = new URL(location.href);
        expect(url.origin + url.pathname).toBe(SESAMY_CHECKOUT);
        expect(url.hash).toBe('');
      } finally {
        vi.useRealTimers();
      }
    });

    it.each([
      { kind: 'a non-Sesamy host', checkoutUrl: 'https://evil.example/checkouts/checkout_1' },
      { kind: 'the legacy checkout host', checkoutUrl: 'https://checkout.sesamy.com/checkout_1' },
      {
        kind: 'a lookalike suffix',
        checkoutUrl: 'https://checkout3.sesamy.com.evil.example/checkouts/checkout_1'
      },
      { kind: 'a subdomain', checkoutUrl: 'https://x.checkout3.sesamy.com/checkouts/checkout_1' },
      { kind: 'plain http', checkoutUrl: 'http://checkout3.sesamy.com/checkouts/checkout_1' }
    ])('never sends the token to $kind', async ({ checkoutUrl }) => {
      const fakeAuth = auth();

      const url = await goTo(checkoutUrl, fakeAuth);

      expect(url.href).not.toContain(TOKEN);
      expect(url.hash).toBe('');
      // Not even fetched: the host is checked before the token is asked for.
      expect(fakeAuth.getTokenSilently).not.toHaveBeenCalled();
    });
  });
});

describe('resolveRedirectLabel', () => {
  const OPTION = 'Start reading ACME Plus';
  const PAYWALL = 'Go to ACME';
  const ELEMENT = 'Back to the article';

  it('prefers the subscription option over every level below it', () => {
    expect(resolveRedirectLabel(OPTION, PAYWALL, ELEMENT)).toBe(OPTION);
  });

  it('falls through to the paywall-wide label when the option has none', () => {
    expect(resolveRedirectLabel(undefined, PAYWALL, ELEMENT)).toBe(PAYWALL);
  });

  it('falls through to the element attribute when the paywall has no label', () => {
    expect(resolveRedirectLabel(undefined, undefined, ELEMENT)).toBe(ELEMENT);
  });

  it('leaves the label unset when nothing is configured, keeping the checkout default', () => {
    expect(resolveRedirectLabel(undefined, undefined, undefined)).toBeUndefined();
  });

  it.each([
    { level: 'option', candidates: ['', PAYWALL], expected: PAYWALL },
    { level: 'option (whitespace)', candidates: ['   ', PAYWALL], expected: PAYWALL },
    { level: 'every level', candidates: ['', ' ', '\t'], expected: undefined }
  ])('lets a blank $level fall through', ({ candidates, expected }) => {
    expect(resolveRedirectLabel(...candidates)).toBe(expected);
  });

  it('trims the label it picks', () => {
    expect(resolveRedirectLabel('  Go to ACME  ')).toBe('Go to ACME');
  });
});
