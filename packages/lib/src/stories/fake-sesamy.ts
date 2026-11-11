import type { SesamyAPI } from '@sesamy/sesamy-js';

/**
 * Story-only stand-in for sesamy-js, so a story can pin down what the API
 * reports (content metadata, access, paywall settings) without the network.
 *
 * Storybook's preview loads the real sesamy-js for every story, and it can
 * install `window.sesamy` after a story has rendered. While a fake is in place,
 * `window.sesamy` keeps returning the fake and a later assignment is held aside,
 * so `restoreSesamy` can hand the real API back to the next story.
 */

type Metadata = Record<string, unknown>;

export interface FakeSesamyOptions {
  /** What `content.get()` returns for every element. */
  metadata: Metadata;
  /** What `content.hasAccess()` resolves to. */
  hasAccess: boolean;
  /** The paywall `paywalls.get()` resolves to, whatever id or URL is asked for. */
  paywall: unknown;
}

const REAL = Symbol.for('sesamy-components.storybook.real-sesamy');
type Holder = { [REAL]?: { value: unknown } };

export function createFakeSesamy({ metadata, hasAccess, paywall }: FakeSesamyOptions): SesamyAPI {
  return {
    isReady: () => true,
    log: (...args: unknown[]) => console.debug('[fake sesamy]', ...args),
    content: {
      get: () => metadata,
      getLanguage: () => 'en',
      hasAccess: async () => hasAccess
    },
    paywalls: {
      get: async () => structuredClone(paywall)
    },
    entitlements: { hasAccess: async () => false },
    auth: {
      isAuthenticated: async () => false,
      getUser: async () => null,
      logout: async () => {}
    },
    analytics: { track: () => {} },
    events: { emit: () => ({ canceled: false }) },
    checkouts: {
      create: async () => {
        throw new Error('Checkout is not available in this story');
      }
    }
  } as unknown as SesamyAPI;
}

export function installFakeSesamy(fake: SesamyAPI) {
  const holder = window as unknown as Holder;
  if (!holder[REAL]) {
    holder[REAL] = { value: (window as { sesamy?: unknown }).sesamy };
  }
  const real = holder[REAL];
  Object.defineProperty(window, 'sesamy', {
    configurable: true,
    get: () => fake,
    set: (value) => {
      real.value = value;
    }
  });
}

/** Puts the real sesamy-js back after a story that installed a fake. */
export function restoreSesamy() {
  const holder = window as unknown as Holder;
  const real = holder[REAL];
  if (!real) return;
  delete holder[REAL];
  Object.defineProperty(window, 'sesamy', {
    configurable: true,
    writable: true,
    value: real.value
  });
}
