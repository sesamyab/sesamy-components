import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { SesamyAPI } from '@sesamy/sesamy-js';
import { getApi, API_READY_TIMEOUT_MS } from './api';

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
  const state = { settled: false, status: '' as 'resolved' | 'rejected' | '', value: undefined as unknown };
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
