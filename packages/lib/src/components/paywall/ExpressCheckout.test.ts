import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import type { SesamyAPI } from '@sesamy/sesamy-js';
import Renderer from './Renderer.svelte';
import { PaywallStatus, PaywallTemplate } from '../../types/Paywall';
import type { Paywall } from '../../types/Paywall';
import type { PaywallProps } from '../../types';

// Stripe.js, faked: wallets never render in jsdom (nor in any headless
// browser), so these tests drive the Express Checkout Elements' events by
// hand. The paywall mounts one element per wallet, as checkout-v4's pay bar.
type Handler = (event: any) => void;
type FakeElement = {
  elementsOptions: unknown;
  options: any;
  handlers: Record<string, Handler>;
  mountedIn: HTMLElement | null;
  destroyed: boolean;
};
const stripeFake = vi.hoisted(() => {
  const state = {
    // Not reset between tests: Stripe instances are cached per key and account.
    loadArgs: [] as unknown[][],
    byWallet: {} as Record<string, FakeElement>,
    confirmResult: { paymentIntent: { status: 'succeeded' } } as unknown
  };
  const stripe = {
    elements: (elementsOptions: unknown) => ({
      submit: async () => ({}),
      create: (_type: string, options: any) => {
        const wallet = options.paymentMethods.applePay === 'always' ? 'applePay' : 'googlePay';
        const fake: FakeElement = {
          elementsOptions,
          options,
          handlers: {},
          mountedIn: null,
          destroyed: false
        };
        state.byWallet[wallet] = fake;
        return {
          on: (name: string, handler: Handler) => (fake.handlers[name] = handler),
          mount: (el: HTMLElement) => (fake.mountedIn = el),
          destroy: () => (fake.destroyed = true)
        };
      }
    }),
    createPaymentMethod: async () => ({ paymentMethod: { id: 'pm_1' } }),
    confirmCardPayment: async () => state.confirmResult,
    confirmCardSetup: async () => state.confirmResult,
    retrievePaymentIntent: async () => ({}),
    retrieveSetupIntent: async () => ({})
  };
  return { state, stripe };
});

vi.mock('@stripe/stripe-js/pure', () => ({
  loadStripe: async (...args: unknown[]) => {
    stripeFake.state.loadArgs.push(args);
    return stripeFake.stripe;
  }
}));

const ARTICLE_URL = 'https://vendor.example/article';
const CHECKOUT_URL = 'https://checkout3.sesamy.dev/checkouts/checkout_1';
const PI_SECRET = 'pi_1_secret_x';

const apiCheckout = (overrides: Record<string, unknown> = {}) => ({
  id: 'checkout_1',
  status: 'PENDING',
  type: 'RECURRING',
  country: 'SE',
  price: { initialPrice: { total: 9900, currency: 'SEK' } },
  items: [{}],
  itemsOwned: [],
  settings: {},
  paymentOptions: {
    availablePaymentMethods: [{ provider: 'STRIPE', methods: ['CARD'], providerID: 'acct_acme' }]
  },
  ...overrides
});

type Call = { url: string; method: string; headers: Record<string, string>; body?: unknown };

const checkoutApi = (first: Record<string, unknown> = {}) => {
  const calls: Call[] = [];
  let status = 'PENDING';
  const fetchMock = vi.fn(async (url: string, init: RequestInit = {}) => {
    const method = init.method ?? 'GET';
    calls.push({
      url,
      method,
      headers: (init.headers ?? {}) as Record<string, string>,
      body: init.body ? JSON.parse(init.body as string) : undefined
    });
    let body: unknown = apiCheckout({ ...first, status });
    if (url.endsWith('/owner')) {
      body = apiCheckout({ ...first, user: { email: 'reader@example.com' } });
    } else if (url.endsWith('/paymentMethod')) {
      body = apiCheckout({
        ...first,
        paymentOptions: { paymentSettings: { clientSecret: PI_SECRET } }
      });
    } else if (url.endsWith('/status')) {
      status = 'COMPLETED';
    }
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  return { calls };
};

const fakeApi = ({ authed = true, requireToken = 'reader-token', profilePhone = '' } = {}) => {
  let access = false;
  const api = {
    log: () => {},
    isReady: () => true,
    clearCache: vi.fn(),
    content: {
      get: () => ({ url: ARTICLE_URL, price: 49, id: 'article-1' }),
      getLanguage: () => 'en',
      hasAccess: async () => access
    },
    entitlements: { hasAccess: vi.fn(async () => access) },
    profile: {
      get: vi.fn(async () => (profilePhone ? { mobilePhone: profilePhone } : {}))
    },
    auth: {
      isAuthenticated: async () => authed,
      getUser: async () => (authed ? { email: 'reader@example.com' } : null),
      getTokenSilently: vi.fn(async () => requireToken),
      logout: async () => {}
    },
    analytics: { track: () => {} },
    events: { emit: () => ({ canceled: false }) },
    checkouts: {
      create: vi.fn(async (payload: unknown) => ({
        id: 'checkout_1',
        checkoutUrl: CHECKOUT_URL,
        payload,
        items: [],
        availablePaymentMethods: [{ provider: 'STRIPE', methods: ['CARD'] }]
      })),
      update: async () => ({})
    }
  };
  window.sesamy = api as unknown as SesamyAPI;
  return { api, grant: () => (access = true) };
};

const paywall = (): Paywall => ({
  id: 'paywall_1',
  vendorId: 'acme',
  name: 'Demo',
  currency: 'SEK',
  status: PaywallStatus.ACTIVE,
  headline: 'Subscribe',
  features: [],
  mainColor: '#000000',
  showLoginButton: true,
  subscriptions: [
    { id: 'sub_1', sku: 'sku_1', poId: 'po_1', title: 'Premium', selected: true, price: 99 }
  ],
  footerPaymentMethods: [],
  settings: {
    useDefaultLogo: false,
    useDefaultCurrency: true,
    useDefaultColor: true,
    template: PaywallTemplate.ARTICLE,
    styling: { showBackground: false, dropShadow: false },
    loginFields: {}
  }
});

const renderExpress = (
  api: ReturnType<typeof fakeApi>['api'],
  props: PaywallProps = {
    'express-checkout': '',
    'stripe-publishable-key': 'pk_test_fake'
  }
) => {
  const host = document.createElement('sesamy-paywall');
  document.body.appendChild(host);
  render(Renderer, {
    props: {
      api: api as unknown as SesamyAPI,
      host,
      t: Object.assign((key: string) => key, { lang: 'en' }),
      paywall: paywall(),
      ...props
    }
  });
  return host;
};

const el = (wallet: 'applePay' | 'googlePay') => stripeFake.state.byWallet[wallet];

const mounted = () =>
  waitFor(() => {
    expect(el('applePay')?.mountedIn).toBeTruthy();
    expect(el('googlePay')?.mountedIn).toBeTruthy();
  });

/** Both wallets report what this browser shows. */
const ready = (applePay: boolean, googlePay: boolean) => {
  el('applePay').handlers.ready({ availablePaymentMethods: { applePay } });
  el('googlePay').handlers.ready({ availablePaymentMethods: { googlePay } });
};

beforeEach(() => {
  stripeFake.state.byWallet = {};
  stripeFake.state.confirmResult = { paymentIntent: { status: 'succeeded' } };
});

afterEach(() => {
  cleanup();
  document.body.replaceChildren();
  delete window.sesamy;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('express checkout on the paywall', () => {
  it('leaves a reader who is not signed in on the normal paywall and its login', async () => {
    checkoutApi();
    const { api } = fakeApi({ authed: false });
    renderExpress(api);

    expect(await screen.findByRole('button', { name: 'continue' })).toBeTruthy();
    // The paywall's own login path.
    await waitFor(() => expect(document.querySelector('sesamy-login')).not.toBeNull());
    expect(api.checkouts.create).not.toHaveBeenCalled();
    expect(stripeFake.state.byWallet).toEqual({});
  });

  it('is off without a publishable key', async () => {
    checkoutApi();
    const { api } = fakeApi();
    renderExpress(api, { 'express-checkout': '' });

    expect(await screen.findByRole('button', { name: 'continue' })).toBeTruthy();
    expect(api.checkouts.create).not.toHaveBeenCalled();
  });

  it('is off with express-checkout="false"', async () => {
    checkoutApi();
    const { api } = fakeApi();
    renderExpress(api, { 'express-checkout': 'false', 'stripe-publishable-key': 'pk_test_fake' });

    expect(await screen.findByRole('button', { name: 'continue' })).toBeTruthy();
    expect(api.checkouts.create).not.toHaveBeenCalled();
  });

  it('prepares the selected option and mounts Apple Pay and Google Pay on the vendor account', async () => {
    const { calls } = checkoutApi();
    const { api } = fakeApi();
    const host = renderExpress(api);
    await mounted();

    expect(api.checkouts.create).toHaveBeenCalledTimes(1);
    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual([
      'GET https://api.sesamy.dev/checkout/checkout_1',
      'POST https://api.sesamy.dev/checkout/checkout_1/owner'
    ]);
    // Not a login-required checkout: no token on the owner call.
    expect(calls[1].headers.Authorization).toBeUndefined();
    expect(calls[1].body).toEqual({ email: 'reader@example.com' });

    expect(stripeFake.state.loadArgs).toContainEqual([
      'pk_test_fake',
      { stripeAccount: 'acct_acme' }
    ]);
    expect(el('applePay').elementsOptions).toMatchObject({
      mode: 'payment',
      amount: 9900,
      currency: 'sek',
      setupFutureUsage: 'off_session'
    });
    expect(el('applePay').options.paymentMethods).toMatchObject({
      applePay: 'always',
      googlePay: 'never',
      link: 'never'
    });
    expect(el('googlePay').options.paymentMethods).toMatchObject({
      applePay: 'never',
      googlePay: 'always'
    });
    // Stripe's iframes live in the host's light DOM, slotted into the paywall.
    expect(el('applePay').mountedIn?.parentElement).toBe(host);
    expect(el('applePay').mountedIn?.slot).toBe('sesamy-express-checkout-applePay');
    expect(el('googlePay').mountedIn?.slot).toBe('sesamy-express-checkout-googlePay');
    expect(screen.queryByRole('button', { name: 'continue' })).toBeNull();
    expect(screen.getByRole('button', { name: 'express_more_options' })).toBeTruthy();
  });

  it('sends the token to the checkout API when the checkout requires login', async () => {
    const { calls } = checkoutApi({ settings: { requireAuth: true } });
    const { api } = fakeApi();
    renderExpress(api);
    await mounted();

    const owner = calls.find((c) => c.url.endsWith('/owner'))!;
    expect(owner.url.startsWith('https://api.sesamy.dev/')).toBe(true);
    expect(owner.headers.Authorization).toBe('Bearer reader-token');
  });

  it('shows the normal paywall in a browser without a wallet', async () => {
    checkoutApi();
    const { api } = fakeApi();
    renderExpress(api);
    await mounted();

    ready(false, false);

    expect(await screen.findByRole('button', { name: 'continue' })).toBeTruthy();
    expect(el('applePay').destroyed).toBe(true);
    expect(el('googlePay').destroyed).toBe(true);
  });

  it('keeps the paywall in express mode when only one wallet is shown', async () => {
    checkoutApi();
    const { api } = fakeApi();
    renderExpress(api);
    await mounted();

    ready(true, false);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'express_more_options' })).toBeTruthy()
    );
    expect(screen.queryByRole('button', { name: 'continue' })).toBeNull();
  });

  it('honours an integration that cancels sesamyPaywallCreateCheckout', async () => {
    checkoutApi();
    const { api } = fakeApi();
    const emit = vi.fn((name: string) => ({ canceled: name === 'sesamyPaywallCreateCheckout' }));
    api.events.emit = emit;
    renderExpress(api);

    // The express preparation asked, and was told no.
    await waitFor(() =>
      expect(emit).toHaveBeenCalledWith(
        'sesamyPaywallCreateCheckout',
        expect.objectContaining({ paywallId: 'paywall_1' }),
        true
      )
    );
    expect(await screen.findByRole('button', { name: 'continue' })).toBeTruthy();
    expect(api.checkouts.create).not.toHaveBeenCalled();
  });

  it('falls back to the normal paywall for a checkout the sheet cannot complete', async () => {
    checkoutApi({ settings: { giftMode: true } });
    const { api } = fakeApi();
    renderExpress(api);

    expect(await screen.findByRole('button', { name: 'continue' })).toBeTruthy();
    expect(stripeFake.state.byWallet).toEqual({});
  });

  it('pays in place and unlocks the article', async () => {
    const { calls } = checkoutApi();
    const { api, grant } = fakeApi();
    const changed = vi.fn();
    window.addEventListener('sesamyEntitlementsChanged', changed);
    renderExpress(api);
    await mounted();
    ready(true, true);

    const resolve = vi.fn();
    el('applePay').handlers.click({ resolve });
    expect(resolve).toHaveBeenCalled();

    grant();
    const paymentFailed = vi.fn();
    el('applePay').handlers.confirm({
      expressPaymentType: 'apple_pay',
      billingDetails: { name: 'Anna Svensson' },
      paymentFailed
    });

    // One poll interval (1.5 s) after the status is set to waiting.
    await waitFor(() => expect(changed).toHaveBeenCalled(), { timeout: 4000 });
    expect(paymentFailed).not.toHaveBeenCalled();
    expect(api.clearCache).toHaveBeenCalled();
    expect(
      calls.map((c) => `${c.method} ${c.url.replace('https://api.sesamy.dev/checkout/', '')}`)
    ).toEqual([
      'GET checkout_1',
      'POST checkout_1/owner',
      'POST checkout_1/paymentMethod',
      'GET checkout_1',
      'PATCH checkout_1/status',
      'GET checkout_1'
    ]);
    // The paywall is gone once the new entitlement is there.
    await waitFor(() => expect(screen.queryByText('Subscribe')).toBeNull());
    window.removeEventListener('sesamyEntitlementsChanged', changed);
  });

  it('keeps the wallet buttons and explains a decline', async () => {
    checkoutApi();
    const { api } = fakeApi();
    renderExpress(api);
    await mounted();
    ready(true, true);
    stripeFake.state.confirmResult = {
      error: { type: 'card_error', message: 'Your card was declined.' }
    };

    el('googlePay').handlers.confirm({
      expressPaymentType: 'google_pay',
      billingDetails: {},
      paymentFailed: vi.fn()
    });

    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      expect.stringContaining('Your card was declined.')
    );
    expect(screen.getByRole('button', { name: 'express_more_options' })).toBeTruthy();
  });

  describe('a checkout that requires a birthdate and a phone (ACME on dev)', () => {
    const acme = {
      settings: {
        fieldSettings: {
          name: { enabled: true, required: true },
          phone: { enabled: true, required: true },
          birthdate: { enabled: true, required: true }
        }
      }
    };

    it('asks the birthdate inline, prefills Google Pay’s phone from the profile, and saves both before paying', async () => {
      const { calls } = checkoutApi(acme);
      const { api, grant } = fakeApi({ profilePhone: '+46701234567' });
      renderExpress(api);
      await mounted();
      ready(true, true);

      // Apple Pay's sheet asks the phone; Google Pay's doesn't.
      expect(el('applePay').options.phoneNumberRequired).toBe(true);
      expect(el('googlePay').options.phoneNumberRequired).toBe(false);

      // Both buttons wait for the birthdate.
      await screen.findByTestId('express-inline-fields');
      expect(screen.getByTestId('express-checkout-applePay-blocked')).toBeTruthy();
      expect(screen.getByTestId('express-checkout-googlePay-blocked')).toBeTruthy();
      await waitFor(() =>
        expect((document.querySelector('input[name="tel"]') as HTMLInputElement)?.value).not.toBe(
          ''
        )
      );

      // A keyboard activation reaches Stripe's button under the overlay: the
      // sheet still doesn't open.
      const resolve = vi.fn();
      el('applePay').handlers.click({ resolve });
      expect(resolve).not.toHaveBeenCalled();

      await userEvent.click(screen.getByTestId('express-checkout-googlePay-blocked'));
      expect(await screen.findByRole('alert')).toHaveProperty(
        'textContent',
        expect.stringContaining('express_fill_in_first')
      );

      const [year, month, day] = ['1990', '1', '2'];
      const inputs = screen.getByTestId('express-inline-fields').querySelectorAll('input');
      // BirthDateInput: year, month, day.
      await userEvent.type(inputs[0], year);
      await userEvent.type(inputs[1], month);
      await userEvent.type(inputs[2], day);

      await waitFor(() =>
        expect(screen.queryByTestId('express-checkout-googlePay-blocked')).toBeNull()
      );

      grant();
      el('googlePay').handlers.confirm({
        expressPaymentType: 'google_pay',
        billingDetails: { name: 'Anna Svensson', phone: '' },
        paymentFailed: vi.fn()
      });

      // The payment's terminal outcome: the checkout completed and access was asked again.
      const changed = vi.fn();
      window.addEventListener('sesamyEntitlementsChanged', changed);
      await waitFor(() => expect(changed).toHaveBeenCalled(), { timeout: 4000 });
      window.removeEventListener('sesamyEntitlementsChanged', changed);
      const details = calls.find((c) => c.url.endsWith('/userdetails'))!;
      expect(details.body).toEqual({
        isBusiness: false,
        firstName: 'Anna',
        lastName: 'Svensson',
        mobilePhone: '+46701234567',
        birthdate: '1990-01-02'
      });
      const index = (suffix: string) => calls.findIndex((c) => c.url.endsWith(suffix));
      expect(index('/userdetails')).toBeLessThan(index('/paymentMethod'));
    });

    it('does not ask the phone inline when only Apple Pay is shown', async () => {
      checkoutApi(acme);
      const { api } = fakeApi();
      renderExpress(api);
      await mounted();
      ready(true, false);

      await screen.findByTestId('express-inline-fields');
      await waitFor(() => expect(document.querySelector('input[name="tel"]')).toBeNull());
    });
  });

  describe('reader sessions', () => {
    const deferred = <T>() => {
      let resolve!: (value: T) => void;
      const promise = new Promise<T>((r) => (resolve = r));
      return { promise, resolve };
    };

    it('never sets an owner for a reader who logged out while the checkout was created', async () => {
      const { calls } = checkoutApi();
      const { api } = fakeApi();
      const creation = deferred<unknown>();
      api.checkouts.create = vi.fn(() => creation.promise) as never;
      renderExpress(api);
      await waitFor(() => expect(api.checkouts.create).toHaveBeenCalled());

      window.dispatchEvent(new CustomEvent('sesamyJsLogout'));
      creation.resolve({
        id: 'checkout_1',
        checkoutUrl: CHECKOUT_URL,
        items: [],
        availablePaymentMethods: []
      });

      expect(await screen.findByRole('button', { name: 'continue' })).toBeTruthy();
      await new Promise((r) => setTimeout(r, 50));
      expect(calls.filter((c) => c.url.endsWith('/owner'))).toEqual([]);
      expect(api.auth.getTokenSilently).not.toHaveBeenCalled();
      expect(stripeFake.state.byWallet).toEqual({});
    });

    it('drops the wallet buttons and the typed birthdate on logout', async () => {
      checkoutApi({
        settings: { fieldSettings: { birthdate: { enabled: true, required: true } } }
      });
      const { api } = fakeApi();
      renderExpress(api);
      await mounted();
      ready(true, true);
      const inputs = (await screen.findByTestId('express-inline-fields')).querySelectorAll('input');
      await userEvent.type(inputs[0], '1990');

      window.dispatchEvent(new CustomEvent('sesamyJsLogout'));

      expect(await screen.findByRole('button', { name: 'continue' })).toBeTruthy();
      expect(screen.queryByTestId('express-inline-fields')).toBeNull();
      expect(el('applePay').destroyed).toBe(true);
      expect(el('googlePay').destroyed).toBe(true);
      expect(document.querySelector('[slot^="sesamy-express-checkout"]')).toBeNull();
    });

    it('prepares a new checkout, owned by the new reader, after another login', async () => {
      const { calls } = checkoutApi();
      const { api } = fakeApi();
      renderExpress(api);
      await mounted();
      const first = el('applePay');

      api.auth.getUser = async () => ({ email: 'other@example.com' });
      window.dispatchEvent(new CustomEvent('sesamyJsAuthenticated'));

      await waitFor(() => expect(api.checkouts.create).toHaveBeenCalledTimes(2));
      await waitFor(() => expect(el('applePay')).not.toBe(first));
      expect(first.destroyed).toBe(true);
      const owners = calls.filter((c) => c.url.endsWith('/owner')).map((c) => c.body);
      expect(owners).toEqual([{ email: 'reader@example.com' }, { email: 'other@example.com' }]);
    });

    it('a login event for the same reader keeps the prepared checkout', async () => {
      checkoutApi();
      const { api } = fakeApi();
      renderExpress(api);
      await mounted();
      const first = el('applePay');

      window.dispatchEvent(new CustomEvent('sesamyJsAuthenticated'));
      await new Promise((r) => setTimeout(r, 50));

      expect(api.checkouts.create).toHaveBeenCalledTimes(1);
      expect(el('applePay')).toBe(first);
      expect(first.destroyed).toBe(false);
    });
  });

  describe('one payment at a time', () => {
    it('refuses a second wallet while the first is paying, and charges once', async () => {
      const { calls } = checkoutApi();
      const { api, grant } = fakeApi();
      renderExpress(api);
      await mounted();
      ready(true, true);

      // Apple Pay's confirm is held open inside Stripe.
      let finishConfirm!: (value: unknown) => void;
      stripeFake.state.confirmResult = new Promise((r) => (finishConfirm = r));
      el('applePay').handlers.confirm({
        expressPaymentType: 'apple_pay',
        billingDetails: {},
        paymentFailed: vi.fn()
      });
      await waitFor(() => expect(calls.some((c) => c.url.endsWith('/paymentMethod'))).toBe(true));

      // Meanwhile Google Pay: no sheet opens, and a confirm is refused.
      const resolve = vi.fn();
      el('googlePay').handlers.click({ resolve });
      expect(resolve).not.toHaveBeenCalled();
      const secondFailed = vi.fn();
      el('googlePay').handlers.confirm({
        expressPaymentType: 'google_pay',
        billingDetails: {},
        paymentFailed: secondFailed
      });
      expect(secondFailed).toHaveBeenCalledWith({ reason: 'fail' });
      expect(screen.queryByRole('button', { name: 'express_more_options' })).toBeNull();

      grant();
      finishConfirm({ paymentIntent: { status: 'succeeded' } });
      const changed = vi.fn();
      window.addEventListener('sesamyEntitlementsChanged', changed);
      await waitFor(() => expect(changed).toHaveBeenCalled(), { timeout: 4000 });
      window.removeEventListener('sesamyEntitlementsChanged', changed);
      expect(calls.filter((c) => c.url.endsWith('/paymentMethod'))).toHaveLength(1);
    });

    it('opens payment again after a decline', async () => {
      checkoutApi();
      const { api } = fakeApi();
      renderExpress(api);
      await mounted();
      ready(true, true);
      stripeFake.state.confirmResult = {
        error: { type: 'card_error', message: 'Your card was declined.' }
      };
      el('applePay').handlers.confirm({
        expressPaymentType: 'apple_pay',
        billingDetails: {},
        paymentFailed: vi.fn()
      });
      await screen.findByRole('alert');

      const resolve = vi.fn();
      el('googlePay').handlers.click({ resolve });
      expect(resolve).toHaveBeenCalled();
    });
  });
});
