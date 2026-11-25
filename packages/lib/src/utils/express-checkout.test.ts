import { describe, expect, it, vi } from 'vitest';
import {
  awaitCompletion,
  checkoutApiBase,
  checkoutClientSecret,
  createCheckoutApi,
  elementsOptions,
  expressElementOptions,
  expressRefusal,
  inlineRequirements,
  intentOutcome,
  normalizeExpressContact,
  payWithWallet,
  prepareCheckout,
  ReaderChangedError,
  sheetRequirements,
  walletSave,
  type ApiCheckout,
  type CheckoutApi,
  type PayDeps
} from './express-checkout';

const PI_SECRET = 'pi_123_secret_abc';
const SETI_SECRET = 'seti_123_secret_abc';

const apiCheckout = (overrides: Partial<ApiCheckout> = {}): ApiCheckout => ({
  id: 'checkout_1',
  status: 'PENDING',
  type: 'SINGLE',
  country: 'SE',
  price: { initialPrice: { total: 4900, currency: 'SEK' } },
  items: [{}],
  itemsOwned: [],
  settings: {},
  paymentOptions: {
    availablePaymentMethods: [{ provider: 'STRIPE', methods: ['CARD'], providerID: 'acct_vendor' }]
  },
  ...overrides
});

const withSecret = (checkout: ApiCheckout, clientSecret = PI_SECRET): ApiCheckout => ({
  ...checkout,
  paymentOptions: {
    ...checkout.paymentOptions,
    paymentSettings: clientSecret.startsWith('seti')
      ? { setupIntent: { clientSecret } }
      : { clientSecret }
  }
});

describe('checkoutApiBase', () => {
  it('maps the Sesamy checkout hosts to their checkout API', () => {
    expect(checkoutApiBase('https://checkout3.sesamy.dev/checkouts/c1')).toBe(
      'https://api.sesamy.dev'
    );
    expect(checkoutApiBase('https://checkout3.sesamy.com/checkouts/c1')).toBe(
      'https://api.sesamy.com'
    );
  });

  it('refuses any other host, plain http and garbage', () => {
    expect(checkoutApiBase('https://checkout3.sesamy.dev.evil.example/c1')).toBeNull();
    expect(checkoutApiBase('http://checkout3.sesamy.dev/checkouts/c1')).toBeNull();
    expect(checkoutApiBase('not a url')).toBeNull();
    expect(checkoutApiBase(undefined)).toBeNull();
  });

  it('refuses hostnames that only an inherited property would match', () => {
    for (const host of ['constructor', 'toString', '__proto__', 'hasOwnProperty']) {
      expect(checkoutApiBase(`https://${host}/checkouts/c1`)).toBeNull();
    }
  });
});

describe('createCheckoutApi', () => {
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' }
    });

  it('calls checkout-api the way checkout-v4 does', async () => {
    const fetchImpl = vi.fn(async () => json(apiCheckout()));
    const client = createCheckoutApi('https://api.sesamy.dev', fetchImpl as typeof fetch);

    await client.get('c 1');
    await client.setPaymentMethod('c1', { provider: 'STRIPE', method: 'CARD', wallet: 'APPLEPAY' });
    await client.setWaiting('c1');

    const calls = fetchImpl.mock.calls as unknown as [string, RequestInit][];
    expect(calls[0][0]).toBe('https://api.sesamy.dev/checkout/c%201');
    expect(calls[1][0]).toBe('https://api.sesamy.dev/checkout/c1/paymentMethod');
    expect(JSON.parse(calls[1][1].body as string)).toEqual({
      provider: 'STRIPE',
      method: 'CARD',
      wallet: 'APPLEPAY'
    });
    expect(calls[2][1].method).toBe('PATCH');
    expect(JSON.parse(calls[2][1].body as string)).toEqual({
      status: 'WAITING_PAYMENT_CONFIRMATION'
    });
  });

  it('sends the token on the owner call only when given one', async () => {
    const fetchImpl = vi.fn(async () => json(apiCheckout()));
    const client = createCheckoutApi('https://api.sesamy.dev', fetchImpl as typeof fetch);

    await client.setOwner('c1', { email: 'reader@example.com' }, 'tok');
    await client.setOwner('c1', { email: 'reader@example.com' }, null);

    const calls = fetchImpl.mock.calls as unknown as [string, RequestInit][];
    expect((calls[0][1].headers as Record<string, string>).Authorization).toBe('Bearer tok');
    expect((calls[1][1].headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it('throws the API error with its status and code', async () => {
    const fetchImpl = vi.fn(async () =>
      json({ message: 'nope', serverErrorCode: 'OWNER_NOT_AUTHENTICATED' }, 401)
    );
    const client = createCheckoutApi('https://api.sesamy.dev', fetchImpl as typeof fetch);
    await expect(client.get('c1')).rejects.toMatchObject({
      status: 401,
      serverErrorCode: 'OWNER_NOT_AUTHENTICATED'
    });
  });
});

const fakeCheckoutApi = (overrides: Partial<CheckoutApi> = {}): CheckoutApi => ({
  get: vi.fn(async () => apiCheckout()),
  setOwner: vi.fn(async () => apiCheckout({ user: { email: 'reader@example.com' } })),
  setUserDetails: vi.fn(async () => apiCheckout()),
  setPaymentMethod: vi.fn(async () => withSecret(apiCheckout())),
  setWaiting: vi.fn(async () => apiCheckout({ status: 'WAITING_PAYMENT_CONFIRMATION' })),
  ...overrides
});

describe('prepareCheckout', () => {
  it('sets the signed-in reader as owner, without a token when login is not required', async () => {
    const client = fakeCheckoutApi();
    const getToken = vi.fn(async () => 'tok');
    await prepareCheckout(client, 'c1', 'reader@example.com', getToken);
    expect(client.setOwner).toHaveBeenCalledWith('c1', { email: 'reader@example.com' }, null);
    expect(getToken).not.toHaveBeenCalled();
  });

  it('sends the token when the checkout requires login', async () => {
    const client = fakeCheckoutApi({
      get: vi.fn(async () => apiCheckout({ settings: { requireAuth: true } }))
    });
    await prepareCheckout(client, 'c1', 'reader@example.com', async () => 'tok');
    expect(client.setOwner).toHaveBeenCalledWith('c1', { email: 'reader@example.com' }, 'tok');
  });

  it('leaves a checkout the reader already owns as it is', async () => {
    const client = fakeCheckoutApi({
      get: vi.fn(async () => apiCheckout({ user: { email: 'Reader@Example.com' } }))
    });
    await prepareCheckout(client, 'c1', 'reader@example.com', async () => 'tok');
    expect(client.setOwner).not.toHaveBeenCalled();
  });

  it('never sets the owner, nor asks a token, for a reader whose session ended', async () => {
    const client = fakeCheckoutApi({
      get: vi.fn(async () => apiCheckout({ settings: { requireAuth: true } }))
    });
    const getToken = vi.fn(async () => 'next-session-token');
    await expect(
      prepareCheckout(client, 'c1', 'reader@example.com', getToken, () => false)
    ).rejects.toBeInstanceOf(ReaderChangedError);
    expect(getToken).not.toHaveBeenCalled();
    expect(client.setOwner).not.toHaveBeenCalled();
  });

  it('stops before the owner when the session ends while the token is fetched', async () => {
    let current = true;
    const client = fakeCheckoutApi({
      get: vi.fn(async () => apiCheckout({ settings: { requireAuth: true } }))
    });
    const getToken = vi.fn(async () => {
      current = false;
      return 'tok';
    });
    await expect(
      prepareCheckout(client, 'c1', 'reader@example.com', getToken, () => current)
    ).rejects.toBeInstanceOf(ReaderChangedError);
    expect(client.setOwner).not.toHaveBeenCalled();
  });
});

describe('the checkout-api request timeout', () => {
  it('aborts a request that never answers', async () => {
    const fetchImpl = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) =>
          init.signal?.addEventListener('abort', () => reject(new Error('aborted')))
        )
    );
    const client = createCheckoutApi('https://api.sesamy.dev', fetchImpl as never, 20);
    await expect(client.get('c1')).rejects.toThrow('aborted');
  });
});

describe('expressRefusal', () => {
  it('accepts a pending Stripe-card checkout', () => {
    expect(expressRefusal(apiCheckout())).toBeNull();
  });

  it.each([
    ['no-stripe-card', { paymentOptions: { availablePaymentMethods: [] } }],
    ['not-pending', { status: 'COMPLETED' }],
    ['already-owned', { items: [], itemsOwned: [{}] }],
    ['business', { userDetails: { isBusiness: true } }],
    ['gift', { settings: { giftMode: true } }],
    ['free', { price: { initialPrice: { total: 0, currency: 'SEK' } } }]
  ] as const)('refuses %s', (reason, overrides) => {
    expect(expressRefusal(apiCheckout(overrides as Partial<ApiCheckout>))).toBe(reason);
  });

  it('accepts a required birthdate: the paywall asks it inline', () => {
    expect(
      expressRefusal(
        apiCheckout({
          settings: { fieldSettings: { birthdate: { enabled: true, required: true } } }
        })
      )
    ).toBeNull();
  });

  it('accepts a 0-kr first period of a subscription (a SetupIntent)', () => {
    expect(
      expressRefusal(
        apiCheckout({ type: 'RECURRING', price: { initialPrice: { total: 0, currency: 'SEK' } } })
      )
    ).toBeNull();
  });
});

describe('what the sheet is asked for', () => {
  it('asks for nothing a plain checkout lacks', () => {
    expect(sheetRequirements(apiCheckout())).toEqual({
      name: false,
      phone: false,
      address: false
    });
    const options = expressElementOptions(apiCheckout(), 'applePay', 'Digital');
    expect(options.paymentMethods).toMatchObject({
      applePay: 'always',
      googlePay: 'never',
      link: 'never',
      paypal: 'never',
      klarna: 'never',
      amazonPay: 'never'
    });
    expect(options.shippingAddressRequired).toBe(false);
    expect(options.shippingRates).toBeUndefined();
  });

  it('asks for the name, phone and address the vendor uses and the checkout lacks', () => {
    const checkout = apiCheckout({
      settings: {
        requireAddress: true,
        fieldSettings: { name: { enabled: true }, phone: { enabled: true, required: true } }
      }
    });
    const options = expressElementOptions(checkout, 'applePay', 'Digital');
    expect(options).toMatchObject({
      billingAddressRequired: true,
      phoneNumberRequired: true,
      shippingAddressRequired: true,
      allowedShippingCountries: ['SE'],
      shippingRates: [{ id: 'digital', amount: 0, displayName: 'Digital' }]
    });
  });

  it('shows one wallet per element', () => {
    expect(expressElementOptions(apiCheckout(), 'googlePay', 'x').paymentMethods).toMatchObject({
      applePay: 'never',
      googlePay: 'always'
    });
  });

  it('asks Google Pay for a required phone inline, Apple Pay in the sheet (checkout-v4 #32)', () => {
    const checkout = apiCheckout({
      settings: {
        fieldSettings: {
          phone: { enabled: true, required: true },
          birthdate: { enabled: true, required: true }
        }
      }
    });
    expect(expressElementOptions(checkout, 'applePay', 'x').phoneNumberRequired).toBe(true);
    expect(expressElementOptions(checkout, 'googlePay', 'x').phoneNumberRequired).toBe(false);
    expect(inlineRequirements(checkout, 'applePay')).toEqual({ birthdate: true, phone: false });
    expect(inlineRequirements(checkout, 'googlePay')).toEqual({ birthdate: true, phone: true });
  });

  it('takes an optional phone from the Google Pay sheet when given', () => {
    const checkout = apiCheckout({
      settings: { fieldSettings: { phone: { enabled: true } } }
    });
    expect(expressElementOptions(checkout, 'googlePay', 'x').phoneNumberRequired).toBe(true);
    expect(inlineRequirements(checkout, 'googlePay').phone).toBe(false);
  });

  it('asks nothing inline that the checkout already holds', () => {
    const checkout = apiCheckout({
      settings: {
        fieldSettings: {
          phone: { enabled: true, required: true },
          birthdate: { enabled: true, required: true }
        }
      },
      userDetails: { mobilePhone: '+46701234567', birthdate: '1990-01-02T00:00:00.000Z' }
    });
    expect(inlineRequirements(checkout, 'googlePay')).toEqual({ birthdate: false, phone: false });
  });

  it('does not ask again for what the checkout already holds', () => {
    const checkout = apiCheckout({
      settings: { fieldSettings: { name: { enabled: true }, phone: { enabled: true } } },
      userDetails: { firstName: 'Anna', lastName: 'Svensson', mobilePhone: '+46701234567' }
    });
    expect(sheetRequirements(checkout)).toEqual({ name: false, phone: false, address: false });
  });

  it('labels the Google Pay button "subscribe" for a subscription', () => {
    expect(
      expressElementOptions(apiCheckout({ type: 'RECURRING' }), 'googlePay', 'x').buttonType
    ).toEqual({
      applePay: 'plain',
      googlePay: 'subscribe'
    });
  });
});

describe('elementsOptions', () => {
  it('a single purchase is a one-off PaymentIntent', () => {
    expect(elementsOptions(apiCheckout())).toEqual({
      mode: 'payment',
      amount: 4900,
      currency: 'sek',
      allowedPaymentMethodTypes: ['card'],
      paymentMethodCreation: 'manual'
    });
  });

  it('a subscription saves the card for renewals', () => {
    expect(elementsOptions(apiCheckout({ type: 'RECURRING' }))).toMatchObject({
      mode: 'payment',
      setupFutureUsage: 'off_session'
    });
    expect(elementsOptions(apiCheckout({ isAutoRenew: true }))).toMatchObject({
      setupFutureUsage: 'off_session'
    });
  });

  it('nothing due today is a SetupIntent', () => {
    expect(
      elementsOptions(
        apiCheckout({ type: 'RECURRING', price: { initialPrice: { total: 0, currency: 'EUR' } } })
      )
    ).toEqual({
      mode: 'setup',
      currency: 'eur',
      allowedPaymentMethodTypes: ['card'],
      paymentMethodCreation: 'manual'
    });
  });
});

describe('checkoutClientSecret and intentOutcome', () => {
  it('reads a PaymentIntent or a SetupIntent secret', () => {
    expect(checkoutClientSecret(withSecret(apiCheckout()))).toEqual({
      secret: PI_SECRET,
      kind: 'payment'
    });
    expect(checkoutClientSecret(withSecret(apiCheckout(), SETI_SECRET))).toEqual({
      secret: SETI_SECRET,
      kind: 'setup'
    });
  });

  it('refuses a malformed secret and other providers', () => {
    expect(checkoutClientSecret(withSecret(apiCheckout(), 'garbage'))).toBeNull();
    expect(
      checkoutClientSecret(
        apiCheckout({ paymentOptions: { paymentSettings: { swishUrl: 'swish://x' } } })
      )
    ).toBeNull();
  });

  it('maps intent statuses', () => {
    expect(intentOutcome('succeeded')).toBe('handoff');
    expect(intentOutcome('processing')).toBe('handoff');
    expect(intentOutcome('requires_payment_method')).toBe('failed');
    expect(intentOutcome('canceled')).toBe('failed');
    expect(intentOutcome('requires_action')).toBe('poll');
    expect(intentOutcome(undefined)).toBe('poll');
  });
});

describe('the sheet contact', () => {
  it('splits the name, keeps an international phone and a complete address', () => {
    expect(
      normalizeExpressContact(
        {
          billingDetails: {
            name: ' Anna Maria Svensson ',
            email: 'x@example.com',
            phone: '+46 70 123 45 67',
            address: {
              line1: null,
              line2: null,
              city: null,
              state: null,
              postal_code: null,
              country: 'SE'
            }
          },
          shippingAddress: {
            name: 'Anna Svensson',
            address: {
              line1: 'Gatan 1',
              line2: '',
              city: 'Stockholm',
              state: null,
              postal_code: '111 22',
              country: 'se'
            }
          }
        } as never,
        'SE'
      )
    ).toEqual({
      firstName: 'Anna Maria',
      lastName: 'Svensson',
      phone: '+46701234567',
      address: {
        street: 'Gatan 1',
        city: 'Stockholm',
        zip: '111 22',
        country: 'SE',
        firstName: 'Anna',
        lastName: 'Svensson'
      }
    });
  });

  it('reads a national phone in the checkout country, and drops an incomplete address', () => {
    expect(
      normalizeExpressContact(
        {
          billingDetails: { name: 'Anna', phone: '070-123 45 67' } as never,
          shippingAddress: { name: 'Anna', address: { line1: 'Gatan 1', country: 'SE' } } as never
        },
        'SE'
      )
    ).toEqual({ firstName: 'Anna', phone: '+46701234567' });
  });

  it('drops a national phone when the sheet ships to another country', () => {
    expect(
      normalizeExpressContact(
        {
          billingDetails: { phone: '412 34 567' } as never,
          shippingAddress: { address: { country: 'NO' } } as never
        },
        'SE'
      )
    ).toEqual({});
  });
});

describe('walletSave', () => {
  const vendorFields = apiCheckout({
    settings: {
      fieldSettings: { name: { enabled: true, required: true }, phone: { enabled: true } }
    }
  });

  it('saves what the sheet gave and the checkout lacks', () => {
    expect(
      walletSave(vendorFields, { firstName: 'Anna', lastName: 'Svensson', phone: '+46701234567' })
    ).toEqual({
      body: {
        isBusiness: false,
        firstName: 'Anna',
        lastName: 'Svensson',
        mobilePhone: '+46701234567'
      },
      missing: []
    });
  });

  it('never overwrites a saved name', () => {
    const saved = { ...vendorFields, userDetails: { firstName: 'Eva', lastName: 'Ek' } };
    expect(walletSave(saved, { firstName: 'Anna', lastName: 'Svensson' })).toEqual({
      body: null,
      missing: []
    });
  });

  it('reports a required field the sheet left empty, and saves nothing', () => {
    expect(walletSave(vendorFields, { firstName: 'Anna' })).toEqual({
      body: null,
      missing: ['name']
    });
    const phone = apiCheckout({
      settings: { fieldSettings: { phone: { enabled: true, required: true } } }
    });
    expect(walletSave(phone, {})).toEqual({ body: null, missing: ['phone'] });
  });

  const acmeLike = apiCheckout({
    settings: {
      fieldSettings: {
        name: { enabled: true, required: true },
        phone: { enabled: true, required: true },
        birthdate: { enabled: true, required: true }
      }
    }
  });
  const sheet = { firstName: 'Anna', lastName: 'Svensson', phone: '+46701111111' };

  it('takes the birthdate from the inline field, Apple Pay’s phone from the sheet', () => {
    expect(walletSave(acmeLike, sheet, 'applePay', { birthdate: '1990-01-02' })).toEqual({
      body: {
        isBusiness: false,
        firstName: 'Anna',
        lastName: 'Svensson',
        mobilePhone: '+46701111111',
        birthdate: '1990-01-02'
      },
      missing: []
    });
  });

  it('takes Google Pay’s required phone from the inline field, never the sheet', () => {
    expect(
      walletSave(acmeLike, sheet, 'googlePay', {
        birthdate: '1990-01-02',
        mobilePhone: '+46702222222'
      }).body?.mobilePhone
    ).toBe('+46702222222');
    expect(walletSave(acmeLike, sheet, 'googlePay', { birthdate: '1990-01-02' }).missing).toEqual([
      'phone'
    ]);
  });

  it('reports a missing required birthdate', () => {
    expect(walletSave(acmeLike, sheet, 'applePay', {}).missing).toEqual(['birthdate']);
  });

  it('takes a complete saved address as the recipient, asking no name', () => {
    const saved = apiCheckout({
      settings: { requireAddress: true },
      userDetails: {
        address: {
          firstName: 'Eva',
          lastName: 'Ek',
          street: 'Gatan 2',
          zip: '11122',
          city: 'Stockholm',
          country: 'SE'
        }
      }
    });
    expect(sheetRequirements(saved).name).toBe(false);
    expect(walletSave(saved, {})).toEqual({ body: null, missing: [] });
  });

  it('still requires the name when the vendor enabled it, next to a saved address', () => {
    const saved = apiCheckout({
      settings: {
        requireAddress: true,
        fieldSettings: { name: { enabled: true, required: true } }
      },
      userDetails: {
        address: {
          firstName: 'Eva',
          lastName: 'Ek',
          street: 'Gatan 2',
          zip: '11122',
          city: 'Stockholm',
          country: 'SE'
        }
      }
    });
    expect(walletSave(saved, {}).missing).toEqual(['name']);
  });

  it('takes a delivery address in the checkout country only', () => {
    const address = apiCheckout({ settings: { requireAddress: true } });
    const contact = {
      firstName: 'Anna',
      lastName: 'Svensson',
      address: { street: 'Gatan 1', zip: '11122', city: 'Stockholm', country: 'SE' }
    };
    expect(walletSave(address, contact).body?.address).toEqual({
      street: 'Gatan 1',
      zip: '11122',
      city: 'Stockholm',
      country: 'SE',
      firstName: 'Anna',
      lastName: 'Svensson'
    });
    expect(
      walletSave(address, { ...contact, address: { ...contact.address, country: 'NO' } }).missing
    ).toEqual(['address']);
  });
});

describe('payWithWallet', () => {
  const event = () => ({
    expressPaymentType: 'apple_pay' as const,
    billingDetails: { name: 'Anna Svensson' } as never,
    shippingAddress: undefined,
    paymentFailed: vi.fn()
  });

  const stripe = (overrides: Partial<PayDeps['stripe']> = {}) =>
    ({
      createPaymentMethod: vi.fn(async () => ({ paymentMethod: { id: 'pm_1' } })),
      confirmCardPayment: vi.fn(async () => ({ paymentIntent: { status: 'succeeded' } })),
      confirmCardSetup: vi.fn(async () => ({ setupIntent: { status: 'succeeded' } })),
      retrievePaymentIntent: vi.fn(async () => ({ paymentIntent: { status: 'succeeded' } })),
      retrieveSetupIntent: vi.fn(async () => ({ setupIntent: { status: 'succeeded' } })),
      ...overrides
    }) as unknown as PayDeps['stripe'];

  const completingApi = (overrides: Partial<CheckoutApi> = {}) => {
    const reads = [apiCheckout(), apiCheckout({ status: 'COMPLETED' })];
    return fakeCheckoutApi({
      get: vi.fn(async () => reads.shift() ?? apiCheckout({ status: 'COMPLETED' })),
      ...overrides
    });
  };

  const run = (overrides: Partial<PayDeps> = {}) => {
    const deps: PayDeps = {
      stripe: stripe(),
      elements: { submit: vi.fn(async () => ({})) } as unknown as PayDeps['elements'],
      checkoutApi: completingApi(),
      checkout: apiCheckout(),
      email: 'reader@example.com',
      event: event(),
      returnUrl: 'https://vendor.example/article',
      wait: async () => {},
      pollTimeoutMs: 1000,
      pollIntervalMs: 0,
      ...overrides
    };
    return { deps, result: payWithWallet(deps) };
  };

  it('pays a single purchase end to end', async () => {
    const { deps, result } = run();
    await expect(result).resolves.toMatchObject({ kind: 'completed' });
    expect(deps.checkoutApi.setPaymentMethod).toHaveBeenCalledWith('checkout_1', {
      provider: 'STRIPE',
      method: 'CARD',
      wallet: 'APPLEPAY'
    });
    expect(deps.stripe.confirmCardPayment).toHaveBeenCalledWith(PI_SECRET, {
      payment_method: 'pm_1',
      return_url: 'https://vendor.example/article'
    });
    expect(deps.checkoutApi.setWaiting).toHaveBeenCalledWith('checkout_1');
    expect(deps.event.paymentFailed).not.toHaveBeenCalled();
    expect(deps.stripe.createPaymentMethod).toHaveBeenCalledWith(
      expect.objectContaining({
        params: {
          billing_details: {
            email: 'reader@example.com',
            name: null,
            phone: null,
            address: { country: 'SE' }
          }
        }
      })
    );
  });

  it('confirms a SetupIntent for a 0-kr first period, and tags Google Pay', async () => {
    const trial = apiCheckout({
      type: 'RECURRING',
      price: { initialPrice: { total: 0, currency: 'SEK' } }
    });
    const checkoutApi = completingApi({
      setPaymentMethod: vi.fn(async () => withSecret(trial, SETI_SECRET))
    });
    const ev = { ...event(), expressPaymentType: 'google_pay' as const };
    const { deps, result } = run({ checkoutApi, checkout: trial, event: ev });
    await expect(result).resolves.toMatchObject({ kind: 'completed' });
    expect(deps.stripe.confirmCardSetup).toHaveBeenCalled();
    expect(checkoutApi.setPaymentMethod).toHaveBeenCalledWith(
      'checkout_1',
      expect.objectContaining({ wallet: 'GOOGLEPAY' })
    );
  });

  it('saves the sheet contact before the payment method', async () => {
    const order: string[] = [];
    const checkoutApi = completingApi({
      setUserDetails: vi.fn(async () => (order.push('userdetails'), apiCheckout())),
      setPaymentMethod: vi.fn(async () => (order.push('paymentMethod'), withSecret(apiCheckout())))
    });
    const checkout = apiCheckout({
      settings: { fieldSettings: { name: { enabled: true, required: true } } }
    });
    const { result } = run({ checkoutApi, checkout });
    await result;
    expect(order).toEqual(['userdetails', 'paymentMethod']);
    expect(checkoutApi.setUserDetails).toHaveBeenCalledWith('checkout_1', {
      isBusiness: false,
      firstName: 'Anna',
      lastName: 'Svensson'
    });
  });

  it('saves the inline birthdate and Google Pay phone in the same /userdetails', async () => {
    const checkoutApi = completingApi();
    const checkout = apiCheckout({
      settings: {
        fieldSettings: {
          phone: { enabled: true, required: true },
          birthdate: { enabled: true, required: true }
        }
      }
    });
    const { result } = run({
      checkoutApi,
      checkout,
      event: { ...event(), expressPaymentType: 'google_pay' as const },
      inline: { birthdate: '1990-01-02', mobilePhone: '+46701234567' }
    });
    await expect(result).resolves.toMatchObject({ kind: 'completed' });
    expect(checkoutApi.setUserDetails).toHaveBeenCalledTimes(1);
    expect(checkoutApi.setUserDetails).toHaveBeenCalledWith('checkout_1', {
      isBusiness: false,
      mobilePhone: '+46701234567',
      birthdate: '1990-01-02'
    });
  });

  it('falls back, writing nothing, when the sheet lacks a required field', async () => {
    const checkout = apiCheckout({
      settings: { fieldSettings: { phone: { enabled: true, required: true } } }
    });
    const { deps, result } = run({ checkout });
    await expect(result).resolves.toEqual({ kind: 'fallback', missing: ['phone'] });
    expect(deps.event.paymentFailed).toHaveBeenCalledWith({ reason: 'fail' });
    expect(deps.stripe.createPaymentMethod).not.toHaveBeenCalled();
    expect(deps.checkoutApi.setPaymentMethod).not.toHaveBeenCalled();
  });

  it('shows Stripe’s message for a card decline, after the sheet closed', async () => {
    const { deps, result } = run({
      stripe: stripe({
        confirmCardPayment: vi.fn(async () => ({
          error: { type: 'card_error', message: 'Your card was declined.' }
        })) as never
      })
    });
    await expect(result).resolves.toEqual({
      kind: 'declined',
      message: 'Your card was declined.'
    });
    // Stripe holds the payment by then: paymentFailed is no longer legal.
    expect(deps.event.paymentFailed).not.toHaveBeenCalled();
    expect(deps.checkoutApi.setWaiting).not.toHaveBeenCalled();
  });

  it('treats a requires_payment_method intent as a decline', async () => {
    const { result } = run({
      stripe: stripe({
        confirmCardPayment: vi.fn(async () => ({
          paymentIntent: { status: 'requires_payment_method' }
        })) as never
      })
    });
    await expect(result).resolves.toEqual({ kind: 'declined' });
  });

  it('polls when the confirm loses its connection but Stripe has the payment', async () => {
    const { deps, result } = run({
      stripe: stripe({
        confirmCardPayment: vi.fn(async () => ({
          error: { type: 'api_connection_error' }
        })) as never
      })
    });
    await expect(result).resolves.toMatchObject({ kind: 'completed' });
    expect(deps.stripe.retrievePaymentIntent).toHaveBeenCalledWith(PI_SECRET);
  });

  it('closes the sheet when the payment method is refused', async () => {
    const checkoutApi = fakeCheckoutApi({
      setPaymentMethod: vi.fn(async () => {
        throw new Error('500');
      })
    });
    const { deps, result } = run({ checkoutApi });
    await expect(result).resolves.toEqual({ kind: 'error', reason: 'payment-method' });
    expect(deps.event.paymentFailed).toHaveBeenCalled();
    expect(deps.stripe.confirmCardPayment).not.toHaveBeenCalled();
  });

  it('closes the sheet when the backend returns no client secret', async () => {
    const checkoutApi = fakeCheckoutApi({ setPaymentMethod: vi.fn(async () => apiCheckout()) });
    const { deps, result } = run({ checkoutApi });
    await expect(result).resolves.toEqual({ kind: 'error', reason: 'missing-secret' });
    expect(deps.event.paymentFailed).toHaveBeenCalled();
  });
});

describe('awaitCompletion', () => {
  it('reports processing when the checkout does not complete in time', async () => {
    const client = fakeCheckoutApi({ get: vi.fn(async () => apiCheckout()) });
    const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 5));
    await expect(
      awaitCompletion(client, 'c1', { timeoutMs: 40, intervalMs: 0, wait: tick })
    ).resolves.toEqual({ kind: 'processing' });
    expect(client.setWaiting).toHaveBeenCalled();
  });

  it('does not wait past the deadline for a request that never answers', async () => {
    const client = fakeCheckoutApi({ get: vi.fn(() => new Promise<never>(() => {})) });
    const started = Date.now();
    await expect(
      awaitCompletion(client, 'c1', { timeoutMs: 50, intervalMs: 0, wait: async () => {} })
    ).resolves.toEqual({ kind: 'processing' });
    expect(Date.now() - started).toBeLessThan(1000);
  });

  it('does not mark a checkout that already left PENDING', async () => {
    const reads = [
      apiCheckout({ status: 'WAITING_PAYMENT_CONFIRMATION' }),
      apiCheckout({ status: 'COMPLETED' })
    ];
    const client = fakeCheckoutApi({ get: vi.fn(async () => reads.shift()!) });
    await expect(
      awaitCompletion(client, 'c1', { timeoutMs: 1000, intervalMs: 0, wait: async () => {} })
    ).resolves.toMatchObject({ kind: 'completed' });
    expect(client.setWaiting).not.toHaveBeenCalled();
  });
});
