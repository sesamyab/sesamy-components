import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/svelte';
import type { SesamyAPI } from '@sesamy/sesamy-js';
import LoginRenderer from './LoginRenderer.svelte';
import { PaywallStatus, PaywallTemplate } from '../../types/Paywall';
import type { Paywall } from '../../types/Paywall';

const fakeApi = (isAuthenticated: boolean | (() => Promise<boolean>) = false) =>
  ({
    log: () => {},
    isReady: () => true,
    content: { getLanguage: () => 'en' },
    auth: {
      isAuthenticated:
        typeof isAuthenticated === 'function' ? isAuthenticated : async () => isAuthenticated
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

describe('auth changes (login template)', () => {
  const form = () => document.querySelector('form');

  const renderLogin = (
    isAuthenticated: boolean | (() => Promise<boolean>),
    handlers: { onShown?: () => void; onAccessGranted?: () => void } = {}
  ) => {
    const host = document.createElement('sesamy-paywall');
    document.body.appendChild(host);
    const shownEvents: Event[] = [];
    host.addEventListener('sesamy:paywall-shown', (event) => shownEvents.push(event));
    const result = render(LoginRenderer, {
      props: {
        api: fakeApi(isAuthenticated),
        host,
        t: (key: string) => key,
        paywall: paywall(),
        ...handlers
      }
    });
    return { ...result, shownEvents };
  };

  it('hides the form when the reader logs in elsewhere', async () => {
    const onAccessGranted = vi.fn();
    renderLogin(false, { onAccessGranted });
    await waitFor(() => expect(form()).not.toBeNull());

    window.dispatchEvent(new CustomEvent('sesamyJsAuthenticated'));

    await waitFor(() => expect(form()).toBeNull());
    expect(onAccessGranted).toHaveBeenCalledTimes(1);
  });

  it('shows the form and announces it when the reader logs out elsewhere', async () => {
    const onShown = vi.fn();
    const { shownEvents } = renderLogin(true, { onShown });
    // Let the initial check settle with the reader logged in.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(form()).toBeNull();
    expect(onShown).not.toHaveBeenCalled();

    window.dispatchEvent(new CustomEvent('sesamyJsLogout'));

    await waitFor(() => expect(form()).not.toBeNull());
    expect(onShown).toHaveBeenCalledTimes(1);
    expect(shownEvents).toHaveLength(1);
  });

  it('does not announce the wall again on a logout while it is already showing', async () => {
    const onShown = vi.fn();
    const { shownEvents } = renderLogin(false, { onShown });
    await waitFor(() => expect(form()).not.toBeNull());

    window.dispatchEvent(new CustomEvent('sesamyJsLogout'));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onShown).toHaveBeenCalledTimes(1);
    expect(shownEvents).toHaveLength(1);
  });

  it('lets a logout win over a slower initial check that still saw the reader logged in', async () => {
    let resolveCheck: (value: boolean) => void = () => {};
    renderLogin(() => new Promise<boolean>((resolve) => (resolveCheck = resolve)));

    window.dispatchEvent(new CustomEvent('sesamyJsLogout'));
    await waitFor(() => expect(form()).not.toBeNull());
    resolveCheck(true);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(form()).not.toBeNull();
  });

  it('does not announce the wall when the initial check settles after it was removed', async () => {
    let resolveCheck: (value: boolean) => void = () => {};
    const onShown = vi.fn();
    const { unmount, shownEvents } = renderLogin(
      () => new Promise<boolean>((resolve) => (resolveCheck = resolve)),
      { onShown }
    );

    unmount();
    resolveCheck(false);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onShown).not.toHaveBeenCalled();
    expect(shownEvents).toHaveLength(0);
  });

  it('removes its auth listeners once removed', async () => {
    const added = vi.spyOn(window, 'addEventListener');
    const removed = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderLogin(false);
    unmount();

    for (const type of ['sesamyJsAuthenticated', 'sesamyJsLogout']) {
      const listener = added.mock.calls.find(([name]) => name === type)?.[1];
      expect(listener).toBeDefined();
      expect(removed).toHaveBeenCalledWith(type, listener);
    }
    added.mockRestore();
    removed.mockRestore();
  });
});
