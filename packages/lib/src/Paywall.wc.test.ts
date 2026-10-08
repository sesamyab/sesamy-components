import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import type { SesamyAPI } from '@sesamy/sesamy-js';
import './Paywall.wc.svelte';

/**
 * A publisher points the paywall at a settings endpoint on their own site with
 * a relative URL. sesamy-js decides URL-vs-id with `new URL(value)`, so a
 * relative value looked like a paywall id and the fetch came back 401.
 */

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function fakeApi(): SesamyAPI {
  return {
    isReady: () => true,
    log: vi.fn(),
    content: {
      get: () => undefined,
      getLanguage: () => 'en'
    },
    paywalls: {
      get: vi.fn(async () => ({ settings: { template: '' } }))
    }
  } as unknown as SesamyAPI;
}

async function mount(settingsUrl: string): Promise<Mock> {
  const api = fakeApi();
  window.sesamy = api;

  const host = document.createElement('sesamy-paywall');
  host.setAttribute('settings-url', settingsUrl);
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
