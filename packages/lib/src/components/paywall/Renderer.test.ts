import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import type { SesamyAPI } from '@sesamy/sesamy-js';
import Renderer from './Renderer.svelte';
import { PaywallStatus, PaywallTemplate } from '../../types/Paywall';
import type { Paywall, PaywallSettings, PaywallSubscription } from '../../types/Paywall';
import type { PaywallProps } from '../../types';

const PAGE_URL = 'https://vendor.example/article';
const ARTICLE_URL = 'https://vendor.example/article';

// jsdom refuses to navigate, so swap `window.location` for a plain object: it
// pins the page URL the last fall-through level reads, and captures wherever
// the component sends the visitor.
let restoreLocation: (() => void) | undefined;

const stubLocation = () => {
  const original = Object.getOwnPropertyDescriptor(window, 'location');
  Object.defineProperty(window, 'location', {
    value: { href: PAGE_URL, assign: (href: string) => (window.location.href = href) },
    writable: true,
    configurable: true
  });
  restoreLocation = () => {
    if (original) {
      Object.defineProperty(window, 'location', original);
    }
    restoreLocation = undefined;
  };
  return window.location as unknown as { href: string };
};

type CreatedCheckout = { redirectUrl: string };

const fakeApi = () => {
  const created: CreatedCheckout[] = [];
  const api = {
    log: () => {},
    isReady: () => true,
    content: {
      get: () => ({ url: ARTICLE_URL, price: 49, id: 'article-1' }),
      getLanguage: () => 'en'
    },
    entitlements: {
      hasAccess: async () => false
    },
    auth: {
      isAuthenticated: async () => false,
      getUser: async () => null
    },
    analytics: {
      track: () => {}
    },
    events: {
      emit: () => ({ canceled: false })
    },
    checkouts: {
      // Mirrors the real API, which echoes the redirect back on the checkout.
      create: async (payload: CreatedCheckout) => {
        created.push(payload);
        return {
          id: 'checkout_1',
          checkoutUrl: 'https://checkout.sesamy.dev/checkout_1',
          redirectUrl: payload.redirectUrl,
          items: [],
          availablePaymentMethods: []
        };
      }
    }
  } as unknown as SesamyAPI;

  // `Base` (which every Button renders inside) waits for the global sesamy-js
  // API before it renders its slot, so the buttons only exist once it is there.
  window.sesamy = api;

  return { api, created };
};

const subscription = (overrides: Partial<PaywallSubscription> = {}): PaywallSubscription => ({
  id: 'sub_1',
  sku: 'sku_1',
  poId: 'po_1',
  title: 'Premium',
  selected: true,
  price: 199,
  ...overrides
});

type PaywallOverrides = Partial<Omit<Paywall, 'settings'>> & {
  settings?: Partial<PaywallSettings>;
};

const paywall = (overrides: PaywallOverrides = {}): Paywall => ({
  id: 'paywall_1',
  vendorId: 'demo',
  name: 'Demo paywall',
  currency: 'SEK',
  status: PaywallStatus.ACTIVE,
  headline: 'Subscribe',
  features: [],
  mainColor: '#000000',
  showLoginButton: false,
  subscriptions: [subscription()],
  footerPaymentMethods: [],
  ...overrides,
  settings: {
    useDefaultLogo: false,
    useDefaultCurrency: true,
    useDefaultColor: true,
    template: PaywallTemplate.BOXES,
    styling: { showBackground: false, dropShadow: false },
    loginFields: {},
    ...overrides.settings
  }
});

const renderPaywall = (
  paywallDoc: Paywall,
  { horizontal = true, ...userProps }: { horizontal?: boolean } & PaywallProps = {}
) => {
  const host = document.createElement('sesamy-paywall');
  document.body.appendChild(host);
  const { api, created } = fakeApi();

  render(Renderer, {
    props: {
      api,
      host,
      t: (key: string) => key,
      paywall: paywallDoc,
      horizontal,
      ...userProps
    }
  });

  return { created };
};

/** The `redirect-url` the visitor is actually sent to checkout with. */
const redirectParam = (location: { href: string }) =>
  new URL(location.href).searchParams.get('redirect-url');

afterEach(() => {
  cleanup();
  document.body.replaceChildren();
  restoreLocation?.();
  delete window.sesamy;
  vi.restoreAllMocks();
});

describe('paywall redirect resolution (boxes template)', () => {
  const buyFirstBox = async () => {
    const button = await screen.findByRole('button', { name: 'continue' });
    await userEvent.click(button);
  };

  it('uses the subscription option redirect ahead of every level below it', async () => {
    const location = stubLocation();
    renderPaywall(
      paywall({
        subscriptions: [subscription({ redirectUrl: 'https://vendor.example/thanks/option' })],
        settings: { redirectUrl: 'https://vendor.example/thanks/paywall' }
      }),
      { 'redirect-url': 'https://vendor.example/thanks/element' }
    );

    await buyFirstBox();

    await waitFor(() =>
      expect(redirectParam(location)).toBe('https://vendor.example/thanks/option')
    );
  });

  it('falls through to the paywall-wide redirect when the option has none', async () => {
    const location = stubLocation();
    renderPaywall(paywall({ settings: { redirectUrl: 'https://vendor.example/thanks/paywall' } }), {
      'redirect-url': 'https://vendor.example/thanks/element'
    });

    await buyFirstBox();

    await waitFor(() =>
      expect(redirectParam(location)).toBe('https://vendor.example/thanks/paywall')
    );
  });

  it('falls through to the element attribute when the paywall has no redirect', async () => {
    const location = stubLocation();
    renderPaywall(paywall(), { 'redirect-url': 'https://vendor.example/thanks/element' });

    await buyFirstBox();

    await waitFor(() =>
      expect(redirectParam(location)).toBe('https://vendor.example/thanks/element')
    );
  });

  it('falls back to the current page for a paywall without the new fields', async () => {
    const location = stubLocation();
    renderPaywall(paywall());

    await buyFirstBox();

    await waitFor(() => expect(redirectParam(location)).toBe(PAGE_URL));
  });

  it('skips empty stored values instead of letting them win', async () => {
    const location = stubLocation();
    renderPaywall(
      paywall({
        subscriptions: [subscription({ redirectUrl: '   ' })],
        settings: { redirectUrl: '' }
      }),
      { 'redirect-url': 'https://vendor.example/thanks/element' }
    );

    await buyFirstBox();

    await waitFor(() =>
      expect(redirectParam(location)).toBe('https://vendor.example/thanks/element')
    );
  });

  it('warns and falls through when a stored value is not an absolute url', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const location = stubLocation();
    renderPaywall(
      paywall({
        subscriptions: [subscription({ redirectUrl: '/thanks' })],
        settings: { redirectUrl: 'https://vendor.example/thanks/paywall' }
      })
    );

    await buyFirstBox();

    await waitFor(() =>
      expect(redirectParam(location)).toBe('https://vendor.example/thanks/paywall')
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('/thanks'));
  });

  it('renders a URL option as a plain link out, with no checkout behind it', async () => {
    stubLocation();
    const { created } = renderPaywall(
      paywall({
        subscriptions: [
          subscription({
            url: 'https://vendor.example/external-offer',
            redirectUrl: 'https://vendor.example/thanks/option'
          })
        ],
        settings: { redirectUrl: 'https://vendor.example/thanks/paywall' }
      })
    );

    const link = await screen.findByRole('link', { name: 'continue' });
    expect(link.getAttribute('href')).toBe('https://vendor.example/external-offer');
    expect(created).toHaveLength(0);
  });
});

describe('paywall redirect resolution (article template)', () => {
  // The article template keeps the visitor on the page to fill in the pay-now
  // form, so the resolved redirect is asserted where it arrives: the checkout
  // the form later hands to `goToCheckout`.
  const buySelected = async () => {
    const button = await screen.findByRole('button', { name: 'continue' });
    await userEvent.click(button);
  };

  it('resolves paywall-wide for a single purchase, which has no per-option field', async () => {
    stubLocation();
    const { created } = renderPaywall(
      paywall({
        subscriptions: [],
        singlePurchase: { enabled: true, title: 'Single purchase' },
        settings: {
          template: PaywallTemplate.ARTICLE,
          redirectUrl: 'https://vendor.example/thanks/paywall'
        }
      }),
      { horizontal: false, 'redirect-url': 'https://vendor.example/thanks/element', price: '49' }
    );

    await buySelected();

    await waitFor(() => expect(created).toHaveLength(1));
    expect(created[0].redirectUrl).toBe('https://vendor.example/thanks/paywall');
  });

  it('falls through to element then page for a single purchase', async () => {
    stubLocation();
    const { created } = renderPaywall(
      paywall({
        subscriptions: [],
        singlePurchase: { enabled: true, title: 'Single purchase' },
        settings: { template: PaywallTemplate.ARTICLE }
      }),
      { horizontal: false, price: '49' }
    );

    await buySelected();

    await waitFor(() => expect(created).toHaveLength(1));
    expect(created[0].redirectUrl).toBe(PAGE_URL);
  });

  it('sends a URL option straight out, never reaching checkout', async () => {
    const location = stubLocation();
    const { created } = renderPaywall(
      paywall({
        subscriptions: [
          subscription({
            url: 'https://vendor.example/external-offer',
            redirectUrl: 'https://vendor.example/thanks/option'
          })
        ],
        settings: {
          template: PaywallTemplate.ARTICLE,
          redirectUrl: 'https://vendor.example/thanks/paywall'
        }
      }),
      { horizontal: false }
    );

    await buySelected();

    await waitFor(() => expect(location.href).toBe('https://vendor.example/external-offer'));
    expect(created).toHaveLength(0);
  });

  it('uses the redirect of the option the visitor selected', async () => {
    stubLocation();
    const { created } = renderPaywall(
      paywall({
        subscriptions: [
          subscription({
            id: 'sub_1',
            title: 'Monthly',
            selected: true,
            redirectUrl: 'https://vendor.example/thanks/monthly'
          }),
          subscription({
            id: 'sub_2',
            sku: 'sku_2',
            poId: 'po_2',
            title: 'Yearly',
            selected: false,
            redirectUrl: 'https://vendor.example/thanks/yearly'
          })
        ],
        settings: { template: PaywallTemplate.ARTICLE }
      }),
      { horizontal: false }
    );

    await userEvent.click(await screen.findByRole('radio', { name: /Yearly/ }));
    await buySelected();

    await waitFor(() => expect(created).toHaveLength(1));
    expect(created[0].redirectUrl).toBe('https://vendor.example/thanks/yearly');
  });
});
