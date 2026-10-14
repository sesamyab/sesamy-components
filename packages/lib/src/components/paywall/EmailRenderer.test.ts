import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import type { SesamyAPI } from '@sesamy/sesamy-js';
import EmailRenderer from './EmailRenderer.svelte';
import { PaywallStatus, PaywallTemplate } from '../../types/Paywall';
import type { Paywall, PaywallSettings, PaywallSubscription } from '../../types/Paywall';
import type { PaywallProps } from '../../types';

const PAGE_URL = 'https://vendor.example/article';
const ARTICLE_URL = 'https://vendor.example/article';

// jsdom refuses to navigate, so swap `window.location` for a plain object that
// captures wherever the component sends the visitor.
const nativeLocation = Object.getOwnPropertyDescriptor(window, 'location');

const stubLocation = () => {
  Object.defineProperty(window, 'location', {
    value: { href: PAGE_URL, assign: (href: string) => (window.location.href = href) },
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

type CreatedCheckout = { email?: string; redirectUrl: string; items: unknown[] };

type FakeApiOptions = {
  hasAccess?: boolean;
  isAuthenticated?: boolean;
  user?: { email?: string } | null;
  cancelCreate?: boolean;
};

const fakeApi = ({
  hasAccess = false,
  isAuthenticated = false,
  user = null,
  cancelCreate = false
}: FakeApiOptions = {}) => {
  const created: CreatedCheckout[] = [];
  const emitted: string[] = [];
  const api = {
    log: () => {},
    isReady: () => true,
    content: {
      get: () => ({ url: ARTICLE_URL, id: 'article-1' }),
      getLanguage: () => 'en'
    },
    entitlements: {
      hasAccess: async () => hasAccess
    },
    auth: {
      isAuthenticated: async () => isAuthenticated,
      getUser: async () => user
    },
    analytics: {
      track: () => {}
    },
    events: {
      emit: (name: string) => {
        emitted.push(name);
        return { canceled: cancelCreate && name === 'sesamyPaywallCreateCheckout' };
      }
    },
    checkouts: {
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

  return { api, created, emitted };
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
  name: 'Demo email paywall',
  currency: 'SEK',
  status: PaywallStatus.ACTIVE,
  headline: 'Subscribe today',
  features: ['Paywall-wide feature'],
  mainColor: '#000000',
  showLoginButton: false,
  subscriptions: [subscription()],
  footerPaymentMethods: [],
  ...overrides,
  settings: {
    useDefaultLogo: false,
    useDefaultCurrency: true,
    useDefaultColor: true,
    template: PaywallTemplate.EMAIL,
    styling: { showBackground: false, dropShadow: false },
    loginFields: {},
    ...overrides.settings
  }
});

const renderPaywall = (
  paywallDoc: Paywall,
  { api: apiOptions, ...userProps }: { api?: FakeApiOptions } & PaywallProps = {}
) => {
  const host = document.createElement('sesamy-paywall');
  document.body.appendChild(host);
  const fake = fakeApi(apiOptions);

  render(EmailRenderer, {
    props: {
      api: fake.api,
      host,
      t: (key: string) => key,
      paywall: paywallDoc,
      ...userProps
    }
  });

  return fake;
};

const submit = async (address: string) => {
  const input = await screen.findByPlaceholderText('email');
  if (address) await userEvent.type(input, address);
  await userEvent.click(await screen.findByRole('button', { name: 'continue' }));
};

afterEach(() => {
  cleanup();
  document.body.replaceChildren();
  restoreLocation();
  delete window.sesamy;
  vi.restoreAllMocks();
});

describe('email template', () => {
  it('creates a checkout for the selected option with the entered email', async () => {
    const location = stubLocation();
    const { created } = renderPaywall(
      paywall({
        subscriptions: [
          subscription({ id: 'sub_a', sku: 'sku_a', poId: 'po_a', selected: false }),
          subscription({ id: 'sub_b', sku: 'sku_b', poId: 'po_b', discountCode: 'INTRO' })
        ]
      })
    );

    await submit('reader@example.com');

    await waitFor(() => expect(created).toHaveLength(1));
    expect(created[0]).toMatchObject({
      email: 'reader@example.com',
      items: [{ sku: 'sku_b', purchaseOptionId: 'po_b' }],
      requestedDiscountCodes: ['INTRO'],
      attribution: { itemSrc: ARTICLE_URL, source: 'PAYWALL', sourceId: 'paywall_1' }
    });
    await waitFor(() =>
      expect(location.href.startsWith('https://checkout.sesamy.dev/checkout_1')).toBe(true)
    );
  });

  it('falls back to the first option when none is selected', async () => {
    stubLocation();
    const { created } = renderPaywall(
      paywall({
        subscriptions: [
          subscription({ sku: 'sku_first', poId: 'po_first', selected: false }),
          subscription({ sku: 'sku_second', poId: 'po_second', selected: false })
        ]
      })
    );

    await submit('reader@example.com');

    await waitFor(() => expect(created).toHaveLength(1));
    expect(created[0].items).toEqual([{ sku: 'sku_first', purchaseOptionId: 'po_first' }]);
  });

  it('does not create a checkout for an invalid email', async () => {
    stubLocation();
    const { created } = renderPaywall(paywall());

    await submit('not-an-email');

    expect(await screen.findByText('invalid_email')).toBeTruthy();
    expect(created).toHaveLength(0);
  });

  it('does not create a checkout when a listener cancels it', async () => {
    stubLocation();
    const { created, emitted } = renderPaywall(paywall(), { api: { cancelCreate: true } });

    await submit('reader@example.com');

    await waitFor(() => expect(emitted).toContain('sesamyPaywallCreateCheckout'));
    expect(created).toHaveLength(0);
  });

  it('fills in the address of a logged-in reader without access', async () => {
    renderPaywall(paywall(), {
      api: { isAuthenticated: true, user: { email: 'member@example.com' } }
    });

    const input = (await screen.findByPlaceholderText('email')) as HTMLInputElement;
    await waitFor(() => expect(input.value).toBe('member@example.com'));
  });

  it('renders nothing when the reader has access', async () => {
    const { emitted } = renderPaywall(paywall(), { api: { hasAccess: true } });

    await waitFor(() => expect(emitted).toContain('sesamyPaywallAccessChecked'));
    expect(document.querySelector('form')).toBeNull();
  });

  it('renders nothing without a subscription option to sell', async () => {
    renderPaywall(paywall({ subscriptions: [] }));

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.querySelector('form')).toBeNull();
  });

  it('uses the option copy: description below the headline, button text, features', async () => {
    renderPaywall(
      paywall({
        subscriptions: [
          subscription({
            description: '<p>Six months for 79</p>',
            buttonText: 'Start reading',
            features: ['Option feature']
          })
        ]
      })
    );

    expect(await screen.findByText('Six months for 79')).toBeTruthy();
    expect(await screen.findByRole('button', { name: 'Start reading' })).toBeTruthy();
    expect(screen.getByText('Option feature')).toBeTruthy();
    expect(screen.queryByText('Paywall-wide feature')).toBeNull();
  });

  it('falls back to the paywall-wide features', async () => {
    renderPaywall(paywall());

    expect(await screen.findByText('Paywall-wide feature')).toBeTruthy();
  });
});
