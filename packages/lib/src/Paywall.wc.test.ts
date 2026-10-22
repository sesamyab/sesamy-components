import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import type { SesamyAPI } from '@sesamy/sesamy-js';
import './Paywall.wc.svelte';

/**
 * A publisher points the paywall at a settings endpoint on their own site with
 * a relative URL. sesamy-js decides URL-vs-id with `new URL(value)`, so a
 * relative value looked like a paywall id and the fetch came back 401.
 */

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function fakeApi(contentPaywallUrl?: string): SesamyAPI {
  return {
    isReady: () => true,
    log: vi.fn(),
    content: {
      get: () => (contentPaywallUrl ? { paywallUrl: contentPaywallUrl } : undefined),
      getLanguage: () => 'en'
    },
    paywalls: {
      get: vi.fn(async () => ({ settings: { template: '' } }))
    }
  } as unknown as SesamyAPI;
}

async function mount(
  settingsUrl: string,
  attributes: Record<string, string> = {},
  contentPaywallUrl?: string
): Promise<Mock> {
  const api = fakeApi(contentPaywallUrl);
  window.sesamy = api;

  const host = document.createElement('sesamy-paywall');
  if (settingsUrl) host.setAttribute('settings-url', settingsUrl);
  for (const [name, value] of Object.entries(attributes)) host.setAttribute(name, value);
  document.body.append(host);
  await flush();

  return api.paywalls.get as unknown as Mock;
}

describe('<sesamy-paywall> settings-url', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    delete (window as { sesamy?: SesamyAPI }).sesamy;
    document.body.innerHTML = '';
  });

  it('resolves a root-relative settings URL against the page', async () => {
    const get = await mount('/sesamy/wizard?isLoggedIn=false&articleId=123');

    expect(get).toHaveBeenCalledWith(
      'http://localhost:3000/sesamy/wizard?isLoggedIn=false&articleId=123'
    );
  });

  it('resolves a dot-relative settings URL against the page', async () => {
    const get = await mount('./paywall/settings.json');

    expect(get).toHaveBeenCalledWith('http://localhost:3000/paywall/settings.json');
  });

  it('passes an absolute settings URL through unchanged', async () => {
    const get = await mount('https://api.example.com/paywall/settings');

    expect(get).toHaveBeenCalledWith('https://api.example.com/paywall/settings');
  });

  it('passes a bare paywall id through unchanged', async () => {
    const get = await mount('pay_abc123');

    expect(get).toHaveBeenCalledWith('pay_abc123');
  });
});

describe('<sesamy-paywall> paywall', () => {
  afterEach(() => {
    delete (window as { sesamy?: SesamyAPI }).sesamy;
    document.body.innerHTML = '';
  });

  it('fetches a strategy id through sesamy-js', async () => {
    const get = await mount('', { paywall: 'st_strategy_1' });

    expect(get).toHaveBeenCalledWith('st_strategy_1');
  });

  it('takes precedence over settings-url and the content paywall', async () => {
    const get = await mount('pay_settings', { paywall: 'st_strategy_1' }, 'pay_content');

    expect(get).toHaveBeenCalledWith('st_strategy_1');
  });

  it('yields to the content paywall under lab_opts', async () => {
    window.history.replaceState(null, '', '/?lab_opts=1');
    try {
      const get = await mount('', { paywall: 'st_strategy_1' }, 'pay_content');

      expect(get).toHaveBeenCalledWith('pay_content');
    } finally {
      window.history.replaceState(null, '', '/');
    }
  });

  it('falls back to the content paywall without an attribute', async () => {
    const get = await mount('', {}, 'st_strategy_2');

    expect(get).toHaveBeenCalledWith('st_strategy_2');
  });
});

describe('default content access decisions', () => {
  afterEach(() => {
    delete (window as { sesamy?: SesamyAPI }).sesamy;
    document.body.innerHTML = '';
  });
  function setup(result: unknown, legacy = false) {
    const api = fakeApi();
    api.content.get = vi.fn(
      () =>
        ({
          legacyContentAccess: legacy,
          resolvedPaywall: { id: 'selected', settings: { template: '' } }
        }) as never
    );
    api.content.hasAccess = vi.fn().mockResolvedValue(result);
    window.sesamy = api;
    const host = document.createElement('sesamy-paywall');
    host.setAttribute('settings-url', 'st_acme');
    document.body.append(host);
    return { api, host };
  }
  it('does not fetch or show a paywall when unified access is granted', async () => {
    const { api } = setup(true);
    await flush();
    expect(api.content.hasAccess).toHaveBeenCalled();
    expect(api.paywalls.get).not.toHaveBeenCalled();
  });
  it('renders the paywall selected by the server without another strategy request', async () => {
    const { api } = setup(null);
    await flush();
    expect(api.content.hasAccess).toHaveBeenCalledTimes(1);
    expect(api.paywalls.get).not.toHaveBeenCalled();
    expect(api.log).toHaveBeenCalledWith('sesamy-paywall with template ');
  });
  it('renders the selected paywall for a paywall attribute, keeping its decision', async () => {
    const api = fakeApi();
    const selected = {
      id: 'selected',
      settings: { template: '' },
      decisionId: 'dec_1',
      strategyId: 'st_acme'
    };
    api.content.get = vi.fn(
      () => ({ legacyContentAccess: false, resolvedPaywall: selected }) as never
    );
    api.content.hasAccess = vi.fn().mockResolvedValue(null);
    window.sesamy = api;
    const host = document.createElement('sesamy-paywall');
    host.setAttribute('paywall', 'st_acme');
    document.body.append(host);
    await flush();

    expect(api.content.hasAccess).toHaveBeenCalledTimes(1);
    expect(api.paywalls.get).not.toHaveBeenCalled();
    expect(api.log).toHaveBeenCalledWith('sesamy-paywall with template ');
  });
  it('rechecks access after authentication changes', async () => {
    const { api } = setup(true);
    await flush();
    window.dispatchEvent(new CustomEvent('sesamyJsLogout'));
    await flush();
    expect(api.content.hasAccess).toHaveBeenCalledTimes(2);
  });
  it('keeps the prior rendering flow for integrations that opt out', async () => {
    const { api } = setup(null, true);
    await flush();
    expect(api.content.hasAccess).not.toHaveBeenCalled();
    expect(api.paywalls.get).toHaveBeenCalledWith('st_acme');
  });
});

describe('unified paywall visibility over time', () => {
  afterEach(() => {
    delete (window as { sesamy?: SesamyAPI }).sesamy;
    document.body.innerHTML = '';
  });
  const loginPaywall = {
    id: 'selected',
    headline: 'Log in to read',
    settings: { template: 'LOGIN' }
  };
  function setup({
    hasAccess,
    authenticated = false,
    legacy = false,
    id
  }: {
    hasAccess: () => Promise<unknown>;
    authenticated?: boolean;
    legacy?: boolean;
    id?: string;
  }) {
    const api = fakeApi();
    api.content.get = vi.fn(
      () =>
        ({
          id: 'article-1',
          legacyContentAccess: legacy,
          resolvedPaywall: loginPaywall
        }) as never
    );
    api.content.hasAccess = vi.fn(hasAccess);
    (api as unknown as { auth: unknown }).auth = {
      isAuthenticated: vi.fn().mockResolvedValue(authenticated)
    };
    window.sesamy = api;
    const host = document.createElement('sesamy-paywall');
    host.setAttribute('settings-url', 'st_acme');
    if (id) host.setAttribute('publisher-content-id', id);
    document.body.append(host);
    return { api, host };
  }
  const form = (host: HTMLElement) => (host.shadowRoot ?? host).querySelector('form');

  it('falls back to the configured paywall when the access check fails', async () => {
    const { api, host } = setup({ hasAccess: () => Promise.reject(new Error('offline')) });
    await flush();
    expect(api.paywalls.get).toHaveBeenCalledWith('st_acme');
    expect((host.shadowRoot ?? host).textContent).not.toContain('Error loading paywall');
  });

  it('does not make its own entitlement decision when the access check fails', async () => {
    const { api, host } = setup({ hasAccess: () => Promise.reject(new Error('offline')) });
    const entitlements = vi.fn().mockResolvedValue(true);
    (api as unknown as { entitlements: unknown }).entitlements = { hasAccess: entitlements };
    (api as unknown as { events: unknown }).events = { emit: () => ({ canceled: false }) };
    (api.paywalls.get as Mock).mockResolvedValue({
      id: 'configured',
      vendorId: 'demo',
      headline: 'Subscribe',
      mainColor: '#000000',
      currency: 'SEK',
      features: [],
      subscriptions: [],
      footerPaymentMethods: [],
      settings: { template: 'ARTICLE', styling: {}, loginFields: {} }
    });
    (api as unknown as { auth: unknown }).auth = { isAuthenticated: async () => true };
    const granted = vi.fn();
    host.addEventListener('sesamy:access-granted', granted);
    await flush();
    await flush();
    expect(api.log).toHaveBeenCalledWith('sesamy-paywall with template ARTICLE');
    expect(entitlements).not.toHaveBeenCalled();
    expect(granted).not.toHaveBeenCalled();
  });

  it('hides when the container reports a grant for the article id from metadata', async () => {
    const { api, host } = setup({ hasAccess: async () => false });
    await flush();
    await flush();
    expect(form(host)).not.toBeNull();
    window.dispatchEvent(
      new CustomEvent('sesamyContentGranted', { detail: { publisherContentId: 'article-1' } })
    );
    await flush();
    expect(form(host)).toBeNull();
    expect(api.content.hasAccess).toHaveBeenCalledTimes(1);
  });

  it('ignores grants for other content', async () => {
    const { host } = setup({ hasAccess: async () => false });
    await flush();
    await flush();
    window.dispatchEvent(
      new CustomEvent('sesamyContentGranted', { detail: { publisherContentId: 'other' } })
    );
    await flush();
    expect(form(host)).not.toBeNull();
  });

  it('keeps the mounted paywall when a re-check reaches the same answer', async () => {
    const { api, host } = setup({ hasAccess: async () => false });
    await flush();
    await flush();
    const before = form(host);
    expect(before).not.toBeNull();
    window.dispatchEvent(new Event('online'));
    await flush();
    await flush();
    expect(api.content.hasAccess).toHaveBeenCalledTimes(2);
    expect(form(host)).toBe(before);
  });

  it('does not re-run the legacy flow on session changes', async () => {
    const { api } = setup({ hasAccess: async () => false, legacy: true });
    await flush();
    window.dispatchEvent(new CustomEvent('sesamyJsAuthenticated'));
    window.dispatchEvent(new Event('online'));
    await flush();
    expect(api.paywalls.get).toHaveBeenCalledTimes(1);
  });

  it('does not offer a login form to a signed-in reader the server denied', async () => {
    const { host } = setup({ hasAccess: async () => false, authenticated: true });
    const shown = vi.fn();
    host.addEventListener('sesamy:paywall-shown', shown);
    await flush();
    await flush();
    expect(form(host)).toBeNull();
    expect(shown).not.toHaveBeenCalled();
  });

  it('announces a dismissal for a paywall shown after an earlier grant', async () => {
    let allowed = true;
    const { host } = setup({ hasAccess: async () => allowed });
    await flush();
    allowed = false;
    window.dispatchEvent(new CustomEvent('sesamyJsLogout'));
    await flush();
    await flush();
    expect(form(host)).not.toBeNull();
    const dismissed = vi.fn();
    host.addEventListener('sesamy:paywall-dismissed', dismissed);
    host.remove();
    await flush();
    expect(dismissed).toHaveBeenCalledTimes(1);
  });
});
