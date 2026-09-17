import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { SesamyAPI } from '@sesamy/sesamy-js';
import { getApi, resetApiReadyWait, API_READY_SLOW_MS, API_READY_TIMEOUT_MS } from './api';

/**
 * `window.sesamy` is installed by `registerAPI()` at the very start of
 * `init()`, long before auth has finished. `isReady()` is what says whether the
 * object can be trusted, and until it does, `auth.isAuthenticated()` answers
 * for a reader whose session has not been established yet.
 *
 * Handing that object to a component is how a subscriber gets told they are
 * signed out on a cold morning load — and a content gate acting on that answer
 * locks the article. Waiting (component shows its pending state) is always
 * better than answering with the wrong api.
 */

function fakeApi(ready: boolean): SesamyAPI {
  return { isReady: () => ready } as unknown as SesamyAPI;
}

/** Records how a promise settles without ever leaving a rejection unhandled. */
function track<T>(promise: Promise<T>) {
  const state = {
    settled: false,
    status: '' as 'resolved' | 'rejected' | '',
    value: undefined as unknown
  };
  promise.then(
    (value) => {
      state.settled = true;
      state.status = 'resolved';
      state.value = value;
    },
    (error) => {
      state.settled = true;
      state.status = 'rejected';
      state.value = error;
    }
  );
  return state;
}

describe('getApi', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetApiReadyWait();
    delete (window as { sesamy?: SesamyAPI }).sesamy;
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (window as { sesamy?: SesamyAPI }).sesamy;
  });

  it('resolves immediately when the api is already ready', async () => {
    const api = fakeApi(true);
    window.sesamy = api;

    await expect(getApi()).resolves.toBe(api);
  });

  it('resolves when sesamyJsReady fires', async () => {
    const api = fakeApi(false);
    window.sesamy = api;

    const state = track(getApi());
    expect(state.settled).toBe(false);

    window.sesamy = fakeApi(true);
    window.dispatchEvent(new Event('sesamyJsReady'));
    await vi.advanceTimersByTimeAsync(0);

    expect(state.status).toBe('resolved');
  });

  it('does not hand out an api that has not finished initialising', async () => {
    // init is still running (slow cold load, or it threw and READY never fires).
    window.sesamy = fakeApi(false);

    const state = track(getApi());
    await vi.advanceTimersByTimeAsync(API_READY_TIMEOUT_MS + 1000);

    expect(state.status).toBe('rejected');
  });

  it('waits out a slow cold-load init rather than giving up in a few seconds', async () => {
    // A first load of the morning does a real network round trip to establish
    // the session. The deadline has to clear that comfortably, or a subscriber
    // whose init lands at eight seconds is served as anonymous.
    expect(API_READY_TIMEOUT_MS).toBeGreaterThanOrEqual(15_000);
  });

  it('still resolves at the deadline if the api became ready without the event', async () => {
    // Defensive: the component may have mounted after READY was dispatched, so
    // the listener never fires. A genuinely ready api is fine to hand out.
    const notReady = fakeApi(false);
    window.sesamy = notReady;

    const state = track(getApi());
    window.sesamy = fakeApi(true);
    await vi.advanceTimersByTimeAsync(API_READY_TIMEOUT_MS + 1);

    expect(state.status).toBe('resolved');
  });

  it('rejects when sesamy-js never loaded at all', async () => {
    const state = track(getApi());
    await vi.advanceTimersByTimeAsync(API_READY_TIMEOUT_MS + 1);

    expect(state.status).toBe('rejected');
  });
});

/**
 * A component that gives up on sesamy-js stays on its fallback for the rest of
 * the page view, and the reason only ever reached the reader's console. These
 * reports put it in the logs service, next to sesamy-js's own errors, so a
 * stuck page is visible — and the late-ready report shows it would have worked.
 */
describe('getApi reporting', () => {
  type Report = { error: Error; details: Record<string, unknown> };

  function reportingApi(ready: boolean, reports: Report[]): SesamyAPI {
    return {
      isReady: () => ready,
      errors: {
        report: (error: Error, options?: { details?: Record<string, unknown> }) =>
          reports.push({ error, details: options?.details ?? {} })
      }
    } as unknown as SesamyAPI;
  }

  /** Swap in a ready api that keeps reporting into the same list. */
  function becomeReady(reports: Report[]) {
    window.sesamy = reportingApi(true, reports);
    window.dispatchEvent(new Event('sesamyJsReady'));
  }

  beforeEach(() => {
    vi.useFakeTimers();
    resetApiReadyWait();
    localStorage.clear();
    delete (window as { sesamy?: SesamyAPI }).sesamy;
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
    delete (window as { sesamy?: SesamyAPI }).sesamy;
  });

  it('reports the timeout once, however many components gave up', async () => {
    const reports: Report[] = [];
    window.sesamy = reportingApi(false, reports);

    const states = [track(getApi()), track(getApi()), track(getApi())];
    await vi.advanceTimersByTimeAsync(API_READY_TIMEOUT_MS + 1);

    expect(states.every((s) => s.status === 'rejected')).toBe(true);
    expect(reports).toHaveLength(1);
    expect(reports[0].error.name).toBe('SesamyApiUnavailableError');
    expect(reports[0].details).toMatchObject({
      stage: 'api-ready-timeout',
      sesamyPresent: true,
      hiddenWhileWaiting: false
    });
  });

  it('reports when sesamy-js becomes ready after the components stopped waiting', async () => {
    const reports: Report[] = [];
    window.sesamy = reportingApi(false, reports);

    track(getApi());
    await vi.advanceTimersByTimeAsync(API_READY_TIMEOUT_MS + 5_000);
    becomeReady(reports);
    becomeReady(reports);

    expect(reports.map((r) => r.details.stage)).toEqual(['api-ready-timeout', 'api-ready-late']);
    expect(reports[1].error.name).toBe('SesamyApiLateReady');
    expect(reports[1].details.lateByMs).toBeGreaterThanOrEqual(4_999);
  });

  it('describes an expired Auth0 token, the cold morning load', async () => {
    localStorage.setItem(
      '@@auth0spajs@@::tjuefire::default::openid profile email',
      JSON.stringify({
        body: { access_token: 'x' },
        expiresAt: Math.round(Date.now() / 1000) - 3600
      })
    );
    const reports: Report[] = [];
    window.sesamy = reportingApi(false, reports);

    track(getApi());
    await vi.advanceTimersByTimeAsync(API_READY_TIMEOUT_MS + 1);

    expect(reports[0].details.authTokenCached).toBe(true);
    expect(reports[0].details.authTokenSecondsLeft).toBeLessThan(0);
  });

  it('says when there was no cached token at all', async () => {
    const reports: Report[] = [];
    window.sesamy = reportingApi(false, reports);

    track(getApi());
    await vi.advanceTimersByTimeAsync(API_READY_TIMEOUT_MS + 1);

    expect(reports[0].details).toMatchObject({
      authTokenCached: false,
      authTokenSecondsLeft: null
    });
  });

  it('reports a slow init that still made the deadline', async () => {
    const reports: Report[] = [];
    window.sesamy = reportingApi(false, reports);

    const state = track(getApi());
    await vi.advanceTimersByTimeAsync(API_READY_SLOW_MS + 1_000);
    becomeReady(reports);
    await vi.advanceTimersByTimeAsync(0);

    expect(state.status).toBe('resolved');
    expect(reports).toHaveLength(1);
    expect(reports[0].error.name).toBe('SesamyApiSlowReady');
    expect(reports[0].details.stage).toBe('api-ready-slow');
  });

  it('reports nothing for an ordinary init', async () => {
    const reports: Report[] = [];
    window.sesamy = reportingApi(false, reports);

    const state = track(getApi());
    await vi.advanceTimersByTimeAsync(2_000);
    becomeReady(reports);
    await vi.advanceTimersByTimeAsync(API_READY_TIMEOUT_MS);

    expect(state.status).toBe('resolved');
    expect(reports).toHaveLength(0);
  });

  it('still rejects when sesamy-js predates errors.report', async () => {
    window.sesamy = fakeApi(false);

    const state = track(getApi());
    await vi.advanceTimersByTimeAsync(API_READY_TIMEOUT_MS + 1);

    expect(state.status).toBe('rejected');
  });
});
