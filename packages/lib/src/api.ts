import type { SesamyAPI } from '@sesamy/sesamy-js';

interface SesamyWindow {
  sesamy?: SesamyAPI;
}

// Extend the global Window type with your SesamyWindow interface
declare global {
  interface Window extends SesamyWindow {}
}

/**
 * How long to wait for sesamy-js to finish initialising before giving up.
 *
 * The first load of the day does real network work to establish the session —
 * a userinfo round trip in BFF mode, a silent token refresh in the Auth0 flow —
 * so the deadline has to clear a slow cold load comfortably. Expiring early is
 * not a harmless fallback: every component that gates on auth would then be
 * deciding for a reader whose session has not been established yet.
 */
export const API_READY_TIMEOUT_MS = 20_000;

export class SesamyApiUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SesamyApiUnavailableError';
  }
}

/**
 * Resolve the sesamy-js api, but only once it can answer for real.
 *
 * `window.sesamy` is installed by `registerAPI()` at the top of `init()`, well
 * before auth is set up; `isReady()` is what distinguishes the two. Handing out
 * the object merely because it exists tells a signed-in reader they are
 * anonymous — and a content gate acting on that answer locks the article for a
 * subscriber. Components wait, and show their pending state, instead.
 */
export async function getApi(): Promise<SesamyAPI> {
  if (window.sesamy?.isReady()) {
    return window.sesamy;
  }

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timeout);
      window.removeEventListener('sesamyJsReady', onSesamyJsReady);
    };

    // Resolve only against an api that reports itself ready. Returns whether
    // it did, so the deadline can tell "ready after all" from "give up".
    const settleIfReady = (): boolean => {
      if (!window.sesamy?.isReady()) return false;
      cleanup();
      resolve(window.sesamy);
      return true;
    };

    function onSesamyJsReady() {
      // The event says init finished and `isReady()` confirms it. On the
      // unlikely disagreement, keep waiting rather than hand out a mid-init api.
      settleIfReady();
    }

    const timeout = setTimeout(() => {
      // The component may have mounted after READY was dispatched, in which
      // case the listener never fired but the api is genuinely usable.
      if (settleIfReady()) return;

      cleanup();
      reject(
        new SesamyApiUnavailableError(
          window.sesamy
            ? `sesamy-js did not finish initialising within ${API_READY_TIMEOUT_MS}ms`
            : 'sesamy-js is not available on the page'
        )
      );
    }, API_READY_TIMEOUT_MS);

    window.addEventListener('sesamyJsReady', onSesamyJsReady);
  });
}
