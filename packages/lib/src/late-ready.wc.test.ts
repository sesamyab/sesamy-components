import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { SesamyAPI } from '@sesamy/sesamy-js';
import { registerElements } from './register';
import { API_READY_TIMEOUT_MS, resetApiReadyWait } from './api';

const translator = vi.hoisted(() => ({ inits: 0 }));
vi.mock('./i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./i18n')>();
  return {
    ...actual,
    default: (...args: Parameters<typeof actual.default>) => {
      translator.inits++;
      return actual.default(...args);
    }
  };
});

registerElements();

/**
 * SES-2222. For an anonymous reader whose silent-login iframe never posts back,
 * sesamy-js reports READY only after about a minute. The components stop
 * waiting at `API_READY_TIMEOUT_MS`. Before this fix they also stayed on their
 * fallback for the rest of the page view, so the reader saw the headline and
 * the teaser with no paywall, no offer and no login button. A reader who would
 * have paid could not.
 *
 * A late READY has to bring the page up exactly as an on-time one would. The
 * content gate still asks for access before it reveals anything, so the
 * article stays locked throughout.
 */

const LATE_BY_MS = 40_000;

/** A paywall with one plan, in the BOXES template, which renders without its own entitlement check. */
const offerPaywall = {
  id: 'offer',
  vendorId: 'acme',
  name: 'Offer',
  currency: 'SEK',
  headline: 'Pick a plan',
  features: [],
  mainColor: '#000000',
  showLoginButton: false,
  subscriptions: [
    { id: 'sub_1', sku: 'sku_1', poId: 'po_1', title: 'Monthly plan', selected: true, price: 199 }
  ],
  footerPaymentMethods: [],
  settings: { template: 'BOXES', styling: {}, loginFields: {} }
};

type Reader = { entitled: boolean; authenticated: boolean };

/** A sesamy-js api that only reports itself ready once the test says so. */
function lateApi(reader: Reader) {
  let ready = false;
  const api = {
    isReady: () => ready,
    log: vi.fn(),
    content: {
      get: () => ({
        url: 'https://example.com/article',
        accessLevel: 'entitlement',
        id: 'article-1',
        legacyContentAccess: false,
        resolvedPaywall: offerPaywall
      }),
      hasAccess: vi.fn(async () => (reader.entitled ? { id: 'ent_1' } : null)),
      getLanguage: () => 'en',
      unlock: vi.fn(async () => '')
    },
    paywalls: { get: vi.fn(async () => offerPaywall) },
    auth: {
      isAuthenticated: vi.fn(async () => reader.authenticated),
      getUser: vi.fn(async () => null),
      login: vi.fn()
    },
    generateLink: vi.fn(async () => ''),
    analytics: { track: vi.fn() },
    events: { emit: () => ({ canceled: false }) },
    errors: { report: vi.fn() }
  };
  return {
    api: api as unknown as SesamyAPI,
    mock: api,
    becomeReady() {
      ready = true;
      window.dispatchEvent(new Event('sesamyJsReady'));
    }
  };
}

function mountContainer() {
  const host = document.createElement('sesamy-content-container');
  host.setAttribute('item-src', 'https://example.com/article');
  host.setAttribute('lock-mode', 'embed');
  const preview = document.createElement('div');
  preview.setAttribute('slot', 'preview');
  preview.textContent = 'Teaser';
  const content = document.createElement('div');
  content.setAttribute('slot', 'content');
  content.textContent = 'The full article';
  host.append(preview, content);
  document.body.append(host);
  return host;
}

function mountPaywall() {
  const host = document.createElement('sesamy-paywall');
  host.setAttribute('settings-url', 'st_acme');
  document.body.append(host);
  return host;
}

function mountLogin() {
  const host = document.createElement('sesamy-login');
  document.body.append(host);
  return host;
}

/** Which named slots the content container projects: what the reader sees. */
const projected = (host: HTMLElement) =>
  Array.from(host.shadowRoot?.querySelectorAll('slot') ?? [])
    .map((slot) => slot.getAttribute('name'))
    .filter(Boolean);

const rendered = (host: HTMLElement) => host.shadowRoot ?? host;
const paywallShown = (host: HTMLElement) => rendered(host).textContent?.includes('Monthly plan');
const loginButton = (host: HTMLElement) => rendered(host).querySelector('button');

/** Let promises and zero-delay timers settle without moving the clock on. */
const settle = async () => {
  for (let i = 0; i < 10; i++) await vi.advanceTimersByTimeAsync(0);
};

/** Count the `sesamyJsReady` listeners still attached to the window. */
function watchReadyListeners() {
  let attached = 0;
  const originalAdd = window.addEventListener.bind(window);
  const originalRemove = window.removeEventListener.bind(window);
  const add = vi.spyOn(window, 'addEventListener');
  const remove = vi.spyOn(window, 'removeEventListener');
  const listeners = new Set<unknown>();
  add.mockImplementation((...args: Parameters<typeof window.addEventListener>) => {
    if (args[0] === 'sesamyJsReady' && !listeners.has(args[1])) {
      listeners.add(args[1]);
      attached++;
    }
    return originalAdd(...args);
  });
  remove.mockImplementation((...args: Parameters<typeof window.removeEventListener>) => {
    if (args[0] === 'sesamyJsReady' && listeners.delete(args[1])) attached--;
    return originalRemove(...args);
  });
  return {
    attached: () => attached,
    restore() {
      add.mockRestore();
      remove.mockRestore();
    }
  };
}

describe('components recover when sesamy-js becomes ready after the timeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetApiReadyWait();
    translator.inits = 0;
    document.body.innerHTML = '';
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    document.body.innerHTML = '';
    delete (window as { sesamy?: SesamyAPI }).sesamy;
    resetApiReadyWait();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders the paywall when READY arrives after the timeout, keeping the article locked', async () => {
    const late = lateApi({ entitled: false, authenticated: false });
    window.sesamy = late.api;
    const container = mountContainer();
    const paywall = mountPaywall();
    await settle();

    // Still waiting: nothing about this reader is known.
    expect(paywallShown(paywall)).toBeFalsy();
    expect(projected(container)).not.toContain('content');

    await vi.advanceTimersByTimeAsync(API_READY_TIMEOUT_MS + 1);
    await settle();

    // Given up: the teaser, no paywall yet, and the article not projected.
    expect(projected(container)).toEqual(['preview']);
    expect(paywallShown(paywall)).toBeFalsy();

    await vi.advanceTimersByTimeAsync(LATE_BY_MS);
    late.becomeReady();
    await settle();

    // Ready after all: the paywall the reader can buy from.
    expect(paywallShown(paywall)).toBe(true);
    expect(late.mock.content.hasAccess).toHaveBeenCalled();
    // And the article is still locked: a definite denial takes it off the page.
    expect(projected(container)).toEqual(['preview']);
    expect(container.querySelector('[slot="content"]')).toBeNull();
  });

  it('reveals the article to an entitled reader only once the access check grants it', async () => {
    const late = lateApi({ entitled: true, authenticated: true });
    let grant: (value: { id: string } | null) => void = () => {};
    late.mock.content.hasAccess.mockImplementation(
      () => new Promise<{ id: string } | null>((resolve) => (grant = resolve))
    );
    window.sesamy = late.api;
    const container = mountContainer();
    await settle();

    await vi.advanceTimersByTimeAsync(API_READY_TIMEOUT_MS + LATE_BY_MS);
    await settle();
    // Never before READY, however long the wait.
    expect(projected(container)).not.toContain('content');
    expect(late.mock.content.hasAccess).not.toHaveBeenCalled();

    late.becomeReady();
    await settle();
    // READY alone grants nothing: the check is out but has not answered.
    expect(late.mock.content.hasAccess).toHaveBeenCalledTimes(1);
    expect(projected(container)).not.toContain('content');

    grant({ id: 'ent_1' });
    await settle();
    expect(projected(container)).toEqual(['content']);
  });

  it('recovers two components on one page from a single READY, without leaking listeners', async () => {
    // What an on-time page initialises: the paywall's buy button is a Base of
    // its own, so this is more than one per element on the page.
    const onTime = lateApi({ entitled: false, authenticated: false });
    onTime.becomeReady();
    window.sesamy = onTime.api;
    mountPaywall();
    mountLogin();
    await settle();
    const onTimeInits = translator.inits;
    expect(onTimeInits).toBeGreaterThanOrEqual(2);
    document.body.innerHTML = '';
    await settle();
    resetApiReadyWait();
    translator.inits = 0;

    const listeners = watchReadyListeners();
    try {
      const late = lateApi({ entitled: false, authenticated: false });
      window.sesamy = late.api;
      const paywall = mountPaywall();
      const login = mountLogin();
      await settle();

      await vi.advanceTimersByTimeAsync(API_READY_TIMEOUT_MS + 1);
      await settle();
      expect(paywallShown(paywall)).toBeFalsy();
      expect(loginButton(login)).toBeNull();
      expect(translator.inits).toBe(0);

      await vi.advanceTimersByTimeAsync(LATE_BY_MS);
      late.becomeReady();
      await settle();

      expect(paywallShown(paywall)).toBe(true);
      expect(loginButton(login)?.textContent).toContain('Login');
      // One translator per component, as on an on-time load.
      expect(translator.inits).toBe(onTimeInits);
      // The single late-ready report, and no listener left behind.
      const stages = late.mock.errors.report.mock.calls.map(
        ([, options]) => (options as { details: { stage: string } }).details.stage
      );
      expect(stages).toEqual(['api-ready-timeout', 'api-ready-late']);
      expect(listeners.attached()).toBe(0);

      // A second READY changes nothing.
      late.becomeReady();
      await settle();
      expect(translator.inits).toBe(onTimeInits);
    } finally {
      listeners.restore();
    }
  });

  it('recovers when READY lands between giving up and listening for it again', async () => {
    const late = lateApi({ entitled: false, authenticated: false });
    window.sesamy = late.api;
    const paywall = mountPaywall();
    await settle();

    // The timeout report runs after getApi()'s last `isReady()` look and before
    // the rejection reaches Base. READY firing there finds nobody waiting.
    late.mock.errors.report.mockImplementationOnce(() => late.becomeReady());
    await vi.advanceTimersByTimeAsync(API_READY_TIMEOUT_MS + 1);
    await settle();

    expect(paywallShown(paywall)).toBe(true);
  });

  it('keeps an on-time READY exactly as before: no fallback, one check, no reports', async () => {
    const late = lateApi({ entitled: false, authenticated: false });
    window.sesamy = late.api;
    const container = mountContainer();
    const paywall = mountPaywall();
    await settle();

    await vi.advanceTimersByTimeAsync(2_000);
    late.becomeReady();
    await settle();

    expect(paywallShown(paywall)).toBe(true);
    expect(projected(container)).toEqual(['preview']);
    expect(container.querySelector('[slot="content"]')).toBeNull();
    expect(late.mock.content.hasAccess).toHaveBeenCalledTimes(2); // container + paywall

    await vi.advanceTimersByTimeAsync(API_READY_TIMEOUT_MS);
    await settle();
    expect(late.mock.errors.report).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalledWith(
      '[sesamy-components] sesamy-js is unavailable:',
      expect.anything()
    );
  });

  it('answers <sesamy-visibility> for real once READY arrives late', async () => {
    const late = lateApi({ entitled: true, authenticated: true });
    window.sesamy = late.api;
    const host = document.createElement('sesamy-visibility');
    host.innerHTML = '<span slot="logged-in">Hi</span><span slot="not-logged-in">Log in</span>';
    document.body.append(host);
    await settle();

    const shown = () =>
      Array.from(host.shadowRoot?.querySelectorAll('slot') ?? []).map((s) => s.name);

    await vi.advanceTimersByTimeAsync(API_READY_TIMEOUT_MS + 1);
    await settle();
    expect(shown()).toEqual(['not-logged-in']);

    late.becomeReady();
    await settle();
    expect(shown()).toEqual(['logged-in']);
  });
});
