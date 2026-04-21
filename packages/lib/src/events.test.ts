import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  authTransition,
  createSesamyEvent,
  dispatchSesamyEvent,
  SesamyEventName,
  type SesamyElementEventMap
} from './events';

function listen<K extends keyof SesamyElementEventMap>(
  target: EventTarget,
  type: K
): { events: SesamyElementEventMap[K][] } {
  const events: SesamyElementEventMap[K][] = [];
  target.addEventListener(type, (e) => events.push(e as SesamyElementEventMap[K]));
  return { events };
}

describe('createSesamyEvent', () => {
  it('creates a CustomEvent with bubbles and composed', () => {
    const event = createSesamyEvent('sesamy:login-success', {
      userinfo: { sub: 'user_1', email: 'a@b.com' }
    });
    expect(event).toBeInstanceOf(CustomEvent);
    expect(event.type).toBe('sesamy:login-success');
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
    expect(event.detail.userinfo.sub).toBe('user_1');
  });
});

describe('dispatchSesamyEvent', () => {
  let el: HTMLElement;

  beforeEach(() => {
    el = document.createElement('div');
    document.body.appendChild(el);
  });

  afterEach(() => {
    el.remove();
    el = null as unknown as HTMLElement;
  });

  it('sesamy:login-success — fires with userinfo', () => {
    const { events } = listen(el, 'sesamy:login-success');
    dispatchSesamyEvent(el, 'sesamy:login-success', {
      userinfo: { sub: 'abc', email: 'e@x.com', name: 'Eve' }
    });
    expect(events).toHaveLength(1);
    expect(events[0].detail.userinfo).toEqual({
      sub: 'abc',
      email: 'e@x.com',
      name: 'Eve'
    });
    expect(events[0].bubbles).toBe(true);
    expect(events[0].composed).toBe(true);
  });

  it('sesamy:login-error — fires with error', () => {
    const { events } = listen(el, 'sesamy:login-error');
    dispatchSesamyEvent(el, 'sesamy:login-error', {
      error: { code: 'popup_closed', message: 'User closed popup' }
    });
    expect(events).toHaveLength(1);
    expect(events[0].detail.error.code).toBe('popup_closed');
    expect(events[0].detail.error.message).toBe('User closed popup');
  });

  it('sesamy:logout — fires with empty detail', () => {
    const { events } = listen(el, 'sesamy:logout');
    dispatchSesamyEvent(el, 'sesamy:logout', {});
    expect(events).toHaveLength(1);
  });

  it('sesamy:paywall-shown — fires with reason', () => {
    const { events } = listen(el, 'sesamy:paywall-shown');
    dispatchSesamyEvent(el, 'sesamy:paywall-shown', { reason: 'unauthenticated' });
    expect(events).toHaveLength(1);
    expect(events[0].detail.reason).toBe('unauthenticated');
  });

  it('sesamy:paywall-dismissed — fires', () => {
    const { events } = listen(el, 'sesamy:paywall-dismissed');
    dispatchSesamyEvent(el, 'sesamy:paywall-dismissed', {});
    expect(events).toHaveLength(1);
  });

  it('sesamy:access-granted — fires with scopes', () => {
    const { events } = listen(el, 'sesamy:access-granted');
    dispatchSesamyEvent(el, 'sesamy:access-granted', { scopes: ['premium', 'all-access'] });
    expect(events).toHaveLength(1);
    expect(events[0].detail.scopes).toEqual(['premium', 'all-access']);
  });

  it('sesamy:content-unlocked — fires with contentName', () => {
    const { events } = listen(el, 'sesamy:content-unlocked');
    dispatchSesamyEvent(el, 'sesamy:content-unlocked', { contentName: 'article-42' });
    expect(events).toHaveLength(1);
    expect(events[0].detail.contentName).toBe('article-42');
  });

  it('bubbles to ancestors', () => {
    const parent = document.createElement('section');
    parent.appendChild(el);
    document.body.appendChild(parent);

    const { events } = listen(parent, 'sesamy:logout');
    dispatchSesamyEvent(el, 'sesamy:logout', {});
    expect(events).toHaveLength(1);
  });

  it('crosses shadow DOM when composed=true', () => {
    const shadowHost = document.createElement('div');
    document.body.appendChild(shadowHost);
    const shadow = shadowHost.attachShadow({ mode: 'open' });
    const inner = document.createElement('span');
    shadow.appendChild(inner);

    const received: Event[] = [];
    document.body.addEventListener('sesamy:content-unlocked', (e) => received.push(e));

    dispatchSesamyEvent(inner, 'sesamy:content-unlocked', { contentName: 'x' });
    expect(received).toHaveLength(1);
  });
});

describe('authTransition', () => {
  it('login: unauthenticated → authenticated', () => {
    expect(authTransition('unauthenticated', 'authenticated')).toBe('login');
  });

  it('logout: authenticated → unauthenticated', () => {
    expect(authTransition('authenticated', 'unauthenticated')).toBe('logout');
  });

  it('unknown → authenticated — no login transition (initial state is not a login)', () => {
    expect(authTransition('unknown', 'authenticated')).toBe('none');
  });

  it('unknown → unauthenticated — no logout transition', () => {
    expect(authTransition('unknown', 'unauthenticated')).toBe('none');
  });

  it('authenticated → authenticated — no transition on re-render', () => {
    expect(authTransition('authenticated', 'authenticated')).toBe('none');
  });

  it('unauthenticated → unauthenticated — no transition on re-render', () => {
    expect(authTransition('unauthenticated', 'unauthenticated')).toBe('none');
  });

  it('any → unknown — no transition (unknown is never a destination)', () => {
    expect(authTransition('authenticated', 'unknown')).toBe('none');
    expect(authTransition('unauthenticated', 'unknown')).toBe('none');
  });
});

describe('transition-guarded dispatch (integration of authTransition + dispatchSesamyEvent)', () => {
  let el: HTMLElement;

  beforeEach(() => {
    el = document.createElement('div');
    document.body.appendChild(el);
  });

  afterEach(() => {
    el.remove();
    el = null as unknown as HTMLElement;
  });

  it('fires sesamy:login-success only on actual login transition', () => {
    const { events: loginEvents } = listen(el, 'sesamy:login-success');
    const { events: logoutEvents } = listen(el, 'sesamy:logout');

    // Simulate initial "already authenticated" state — no login-success should fire
    let state: 'authenticated' | 'unauthenticated' | 'unknown' = 'unknown';
    const advance = (next: 'authenticated' | 'unauthenticated') => {
      const t = authTransition(state, next);
      state = next;
      if (t === 'login') {
        dispatchSesamyEvent(el, 'sesamy:login-success', { userinfo: { sub: 's' } });
      } else if (t === 'logout') {
        dispatchSesamyEvent(el, 'sesamy:logout', {});
      }
    };

    advance('authenticated'); // unknown → authenticated (initial auth probe)
    expect(loginEvents).toHaveLength(0);

    advance('unauthenticated'); // logout transition
    expect(logoutEvents).toHaveLength(1);

    advance('authenticated'); // login transition
    expect(loginEvents).toHaveLength(1);

    advance('authenticated'); // no transition
    expect(loginEvents).toHaveLength(1);
  });

  it('does not fire logout when never logged in', () => {
    const { events } = listen(el, 'sesamy:logout');

    let state: 'authenticated' | 'unauthenticated' | 'unknown' = 'unknown';
    const advance = (next: 'authenticated' | 'unauthenticated') => {
      const t = authTransition(state, next);
      state = next;
      if (t === 'logout') {
        dispatchSesamyEvent(el, 'sesamy:logout', {});
      }
    };

    advance('unauthenticated'); // initial probe — no logout
    advance('unauthenticated'); // no change
    expect(events).toHaveLength(0);
  });
});

describe('SesamyEventName constants', () => {
  it('exposes all seven event names', () => {
    expect(Object.values(SesamyEventName).sort()).toEqual(
      [
        'sesamy:access-granted',
        'sesamy:content-unlocked',
        'sesamy:login-error',
        'sesamy:login-success',
        'sesamy:logout',
        'sesamy:paywall-dismissed',
        'sesamy:paywall-shown'
      ].sort()
    );
  });
});
