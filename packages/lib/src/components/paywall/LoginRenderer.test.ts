import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/svelte';
import type { SesamyAPI } from '@sesamy/sesamy-js';
import LoginRenderer from './LoginRenderer.svelte';
import { PaywallStatus, PaywallTemplate } from '../../types/Paywall';
import type { Paywall } from '../../types/Paywall';

const fakeApi = () =>
  ({
    log: () => {},
    isReady: () => true,
    content: { getLanguage: () => 'en' },
    auth: {
      isAuthenticated: async () => false
    }
  }) as unknown as SesamyAPI;

const paywall = (overrides: Partial<Paywall> = {}): Paywall => ({
  id: 'paywall_1',
  vendorId: 'demo',
  name: 'Demo login wall',
  currency: 'SEK',
  status: PaywallStatus.ACTIVE,
  headline: 'Stored headline',
  features: [],
  mainColor: '#000000',
  showLoginButton: false,
  subscriptions: [],
  settings: {
    useDefaultLogo: false,
    useDefaultCurrency: true,
    useDefaultColor: true,
    // The LOGIN template is not part of the enum the component switches on;
    // the wrapper picks LoginRenderer by the raw string, so any value works here.
    template: PaywallTemplate.ARTICLE,
    styling: { showBackground: false, dropShadow: false },
    loginFields: {}
  },
  ...overrides
});

afterEach(() => {
  cleanup();
  document.body.replaceChildren();
});

describe('headline slot (login template)', () => {
  it('renders the stored headline as the slot fallback', async () => {
    const host = document.createElement('sesamy-paywall');
    document.body.appendChild(host);

    render(LoginRenderer, {
      props: { api: fakeApi(), host, t: (key: string) => key, paywall: paywall() }
    });

    // The `<slot>` is rendered as a plain element under jsdom (no shadow tree),
    // so it and its fallback text stay queryable.
    const slot = await waitFor(() => {
      const el = document.querySelector('slot[name="headline"]');
      if (!el) throw new Error('headline slot has not rendered yet');
      return el;
    });

    expect(slot.textContent?.trim()).toBe('Stored headline');
  });
});
