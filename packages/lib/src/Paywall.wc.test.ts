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
