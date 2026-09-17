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

/**
 * A wait this long is reported even when sesamy-js does become ready in time,
 * so the logs show how close ordinary loads come to the deadline.
 */
export const API_READY_SLOW_MS = 10_000;

export class SesamyApiUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SesamyApiUnavailableError';
  }
}

type ReportDetails = Record<string, string | number | boolean | null>;

/**
 * `errors.report` arrived in sesamy-js after the version these types come
 * from, and a page can run an older bundle, so it is optional here.
 */
interface ErrorReporting {
  errors?: {
    report?: (error: unknown, options?: { details?: ReportDetails }) => void;
  };
}

/**
 * What we know about one page's wait for sesamy-js. Every component calls
 * `getApi()` on its own, so this is shared: one wait, reported at most once
 * per outcome, rather than once per component on the page.
 */
interface ReadyWait {
  startedAt: number;
  hiddenWhileWaiting: boolean;
  /** Hidden time from intervals that have ended. */
  hiddenMs: number;
  /** When the current hidden interval began, while the tab is hidden. */
  hiddenSince: number | null;
  authCache: ReportDetails;
  timedOutAt: number | null;
  reported: Set<'timeout' | 'late' | 'slow'>;
  /** Removes the listeners this wait added to the page. */
  detach: () => void;
}

let wait: ReadyWait | null = null;

/**
 * The state of the Auth0 token cache when the wait began. An expired token is
 * the cold morning load: sesamy-js has to refresh it in a hidden iframe before
 * it reports ready, and a stalled iframe only gives up after a minute.
 */
function describeAuthCache(): ReportDetails {
  try {
    let secondsLeft: number | null = null;
    for (const key of Object.keys(localStorage)) {
      if (!key.startsWith('@@auth0spajs@@') || key.endsWith('@@user@@')) continue;
      const entry = JSON.parse(localStorage.getItem(key) || 'null');
      if (!entry?.body?.access_token || typeof entry.expiresAt !== 'number') continue;
      const left = Math.round(entry.expiresAt - Date.now() / 1000);
      secondsLeft = secondsLeft === null ? left : Math.max(secondsLeft, left);
    }
    return { authTokenCached: secondsLeft !== null, authTokenSecondsLeft: secondsLeft };
  } catch {
    return {};
  }
}

function startWait(): ReadyWait {
  if (wait) return wait;

  // A hidden tab has its timers and iframes throttled, so time spent hidden
  // slows sesamy-js down for reasons that have nothing to do with the network.
  const onVisibilityChange = () => {
    const now = performance.now();
    if (document.visibilityState === 'hidden') {
      current.hiddenWhileWaiting = true;
      current.hiddenSince ??= now;
    } else if (current.hiddenSince !== null) {
      current.hiddenMs += now - current.hiddenSince;
      current.hiddenSince = null;
    }
  };
  const startedAt = performance.now();
  const startedHidden = document.visibilityState === 'hidden';
  const current: ReadyWait = {
    startedAt,
    hiddenWhileWaiting: startedHidden,
    hiddenMs: 0,
    hiddenSince: startedHidden ? startedAt : null,
    authCache: describeAuthCache(),
    timedOutAt: null,
    reported: new Set(),
    detach: () => document.removeEventListener('visibilitychange', onVisibilityChange)
  };
  document.addEventListener('visibilitychange', onVisibilityChange);
  wait = current;
  return current;
}

/**
 * Send a diagnostic through sesamy-js's own error reporting, so it lands in the
 * logs service next to sesamy-js's reports for the same page view. The console
 * is not enough: a reader's console is never seen.
 */
function report(
  current: ReadyWait,
  kind: 'timeout' | 'late' | 'slow',
  error: Error,
  details: ReportDetails = {}
) {
  if (current.reported.has(kind)) return;
  current.reported.add(kind);

  try {
    const api = window.sesamy as (SesamyAPI & ErrorReporting) | undefined;
    const now = performance.now();
    api?.errors?.report?.(error, {
      details: {
        stage: `api-ready-${kind}`,
        sinceNavigationMs: Math.round(now),
        waitedMs: Math.round(now - current.startedAt),
        visibility: document.visibilityState,
        hiddenWhileWaiting: current.hiddenWhileWaiting,
        hiddenMs: Math.round(
          current.hiddenMs + (current.hiddenSince === null ? 0 : now - current.hiddenSince)
        ),
        readyState: document.readyState,
        ...current.authCache,
        ...details
      }
    });
  } catch {
    // Reporting must never break the component it is reporting on.
  }
}

function namedError(name: string, message: string): Error {
  const error = new Error(message);
  error.name = name;
  return error;
}

/**
 * After giving up, keep listening. If sesamy-js becomes ready after all, the
 * components on this page are stuck on their fallback for good, and this is
 * the report that shows it.
 */
function watchForLateReady(current: ReadyWait) {
  const onReady = () => {
    window.removeEventListener('sesamyJsReady', onReady);
    report(
      current,
      'late',
      namedError(
        'SesamyApiLateReady',
        `sesamy-js became ready after components stopped waiting at ${API_READY_TIMEOUT_MS}ms`
      ),
      { lateByMs: Math.round(performance.now() - (current.timedOutAt ?? current.startedAt)) }
    );
  };
  window.addEventListener('sesamyJsReady', onReady);

  const detach = current.detach;
  current.detach = () => {
    detach();
    window.removeEventListener('sesamyJsReady', onReady);
  };
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

  const current = startWait();

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
      // Past the deadline, the late-ready report already says it.
      if (
        current.timedOutAt === null &&
        performance.now() - current.startedAt >= API_READY_SLOW_MS
      ) {
        report(
          current,
          'slow',
          namedError(
            'SesamyApiSlowReady',
            `sesamy-js took over ${API_READY_SLOW_MS}ms to become ready`
          )
        );
      }
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
      const error = new SesamyApiUnavailableError(
        window.sesamy
          ? `sesamy-js did not finish initialising within ${API_READY_TIMEOUT_MS}ms`
          : 'sesamy-js is not available on the page'
      );

      if (current.timedOutAt === null) {
        current.timedOutAt = performance.now();
        report(current, 'timeout', error, { sesamyPresent: !!window.sesamy });
        watchForLateReady(current);
      }
      reject(error);
    }, API_READY_TIMEOUT_MS);

    window.addEventListener('sesamyJsReady', onSesamyJsReady);
  });
}

/** Forget the page's wait. For tests, which reuse one module across cases. */
export function resetApiReadyWait() {
  wait?.detach();
  wait = null;
}
