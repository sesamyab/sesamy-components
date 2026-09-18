import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import type { SesamyAPI } from '@sesamy/sesamy-js';
import './ContentContainer.wc.svelte';
import { ACCESS_CHECK_TIMEOUT_MS, ACCESS_RETRY_DELAYS_MS, accessRetryDelay } from './content-lock';

/**
 * The publisher-reported bug, at the level it was reported.
 *
 * A subscriber opens an article in the morning. The access token expired
 * overnight, so the first entitlements check cannot be answered for them —
 * either the session is still being established, or it can no longer produce a
 * token at all. `<sesamy-login>` shows them as signed in (it answers from a
 * cache and needs no network), while the content container concluded "no
 * access" and deleted the article from the page. Nothing brought it back: not
 * the token arriving a second later, not signing in again on the same page.
 */

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function mount(attributes: Record<string, string> = {}): { host: HTMLElement; content: Element } {
  const host = document.createElement('sesamy-content-container');
  host.setAttribute('item-src', 'https://example.com/article');
  host.setAttribute('lock-mode', 'embed');
  for (const [name, value] of Object.entries(attributes)) {
    host.setAttribute(name, value);
  }

  const preview = document.createElement('div');
  preview.setAttribute('slot', 'preview');
  preview.textContent = 'Teaser';

  const content = document.createElement('div');
  content.setAttribute('slot', 'content');
  content.textContent = 'The full article';

  host.append(preview, content);
  document.body.append(host);
  return { host, content };
}

/** The article node in the publisher's page — what a denial takes away. */
const contentSlot = (host: HTMLElement) => host.querySelector('[slot="content"]');

/**
 * Which slot the component projects — what the reader actually sees. A gate
 * that projects neither leaves a blank gap where the article should be.
 */
const projected = (host: HTMLElement) =>
  Array.from(host.shadowRoot?.querySelectorAll('slot') ?? [])
    .map((slot) => slot.getAttribute('name'))
    .filter(Boolean);

/** A sesamy-js api whose access answer the test controls. */
function fakeApi(hasAccess: () => unknown) {
  return {
    isReady: () => true,
    log: vi.fn(),
    content: {
      get: () => ({
        url: 'https://example.com/article',
        accessLevel: 'entitlement',
        id: 'article-1'
      }),
      hasAccess: vi.fn(async () => {
        const answer = hasAccess();
        if (answer instanceof Error) throw answer;
        return answer;
      }),
      getLanguage: () => 'en',
      unlock: vi.fn()
    },
    analytics: { track: vi.fn() }
  } as unknown as SesamyAPI;
}

describe('<sesamy-content-container> in embed mode', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    delete (window as { sesamy?: SesamyAPI }).sesamy;
    document.body.innerHTML = '';
  });

  it('keeps the article when the session could not be read', async () => {
    // The morning state: sesamy-js refuses to answer from an anonymous request
    // rather than reporting a subscriber as having no entitlements.
    const error = Object.assign(new Error('session unavailable'), {
      name: 'SessionUnavailableError'
    });
    window.sesamy = fakeApi(() => error);

    const { host, content } = mount();
    await flush();

    // Not knowing is not a denial. The article stays in the page so it can be
    // shown the moment the session resolves.
    expect(contentSlot(host)).toBe(content);
    // And the reader gets the teaser, not a blank gap where the article was.
    expect(projected(host)).toEqual(['preview']);
  });

  it('shows the teaser rather than a blank gap when the check fails outright', async () => {
    window.sesamy = fakeApi(() => new Error('NetworkError: failed to fetch'));

    const { host } = mount();
    await flush();

    expect(projected(host)).toEqual(['preview']);
  });

  it('removes the article when the reader definitely has no access', async () => {
    window.sesamy = fakeApi(() => null);

    const { host } = mount();
    await flush();

    expect(contentSlot(host)).toBeNull();
    expect(projected(host)).toEqual(['preview']);
  });

  it('gives the article back when the reader signs in on the page', async () => {
    let entitled = false;
    window.sesamy = fakeApi(() => (entitled ? { id: 'ent_1' } : null));

    const { host, content } = mount();
    await flush();
    expect(contentSlot(host)).toBeNull();

    // The reader signs in. sesamy-js announces the new session; the gate has to
    // reconsider rather than sit on the decision it made while signed out.
    entitled = true;
    window.dispatchEvent(new CustomEvent('sesamyJsAuthenticated', { detail: {} }));
    await flush();

    expect(contentSlot(host)).toBe(content);
    expect(projected(host)).toEqual(['content']);
  });

  it('re-locks the article when the reader signs out', async () => {
    let entitled = true;
    window.sesamy = fakeApi(() => (entitled ? { id: 'ent_1' } : null));

    const { host } = mount();
    await flush();
    expect(contentSlot(host)).not.toBeNull();

    entitled = false;
    window.dispatchEvent(new CustomEvent('sesamyJsLogout', { detail: {} }));
    await flush();

    expect(contentSlot(host)).toBeNull();
  });

  it('leaves the article alone while sesamy-js is still initialising', async () => {
    // `window.sesamy` exists — it is installed at the top of init() — but is not
    // ready. Nothing may be decided against the reader until it is.
    const api = fakeApi(() => null);
    (api as unknown as { isReady: () => boolean }).isReady = () => false;
    window.sesamy = api;

    const { host, content } = mount();
    await flush();

    expect(contentSlot(host)).toBe(content);
    expect(api.content.hasAccess).not.toHaveBeenCalled();
  });

  it('honours its own access-level attribute over what sesamy-js resolved', async () => {
    // The container's attribute is the documented contract and wins over the
    // surrounding <sesamy-article>. Public content is never gated at all.
    const api = fakeApi(() => null);
    window.sesamy = api;

    const { host, content } = mount({ 'access-level': 'public' });
    await flush();

    expect(api.content.hasAccess).not.toHaveBeenCalled();
    expect(contentSlot(host)).toBe(content);
    expect(projected(host)).toEqual(['content']);
  });

  it('never touches the light DOM for a reader who has access', async () => {
    // The happy path must stay byte-for-byte what it was. Publisher content
    // carries ads, iframes and players whose state does not survive being
    // removed from the document, which is why embed mode projects the slot
    // rather than re-rendering it. A gate that "restores" content it never took
    // away would reload every one of them on an ordinary page view.
    window.sesamy = fakeApi(() => ({ id: 'ent_1' }));

    const { host, content } = mount();
    const mutations: MutationRecord[] = [];
    const observer = new MutationObserver((records) => mutations.push(...records));
    observer.observe(host, { childList: true, subtree: true, attributes: true });

    await flush();
    // A second session event, which is where a re-check could churn the DOM.
    window.dispatchEvent(new CustomEvent('sesamyJsAuthenticated', { detail: {} }));
    await flush();
    observer.disconnect();

    expect(mutations).toEqual([]);
    expect(content.isConnected).toBe(true);
  });

  it('hands back the same node, so listeners and player state survive a re-lock', async () => {
    // Restoring a *clone* would silently drop every event listener and any
    // state publisher scripts hold on those nodes. It has to be the same node.
    let entitled = true;
    window.sesamy = fakeApi(() => (entitled ? { id: 'ent_1' } : null));

    const { host, content } = mount();
    const clicks: string[] = [];
    content.addEventListener('click', () => clicks.push('clicked'));
    await flush();

    entitled = false;
    window.dispatchEvent(new CustomEvent('sesamyJsLogout', { detail: {} }));
    await flush();
    expect(contentSlot(host)).toBeNull();

    entitled = true;
    window.dispatchEvent(new CustomEvent('sesamyJsAuthenticated', { detail: {} }));
    await flush();

    expect(contentSlot(host)).toBe(content);
    content.dispatchEvent(new Event('click'));
    expect(clicks).toEqual(['clicked']);
  });

  it('ignores an access answer that a newer check has superseded', async () => {
    // Sign-in and sign-out overlap, and the requests need not come back in
    // order. A grant that was already in flight when the reader signed out must
    // not hand the article back to them.
    const pending: Array<(value: unknown) => void> = [];
    const api = {
      isReady: () => true,
      log: vi.fn(),
      content: {
        get: () => ({ url: 'https://example.com/article', accessLevel: 'entitlement', id: 'a' }),
        hasAccess: vi.fn(() => new Promise((resolve) => pending.push(resolve))),
        getLanguage: () => 'en',
        unlock: vi.fn()
      },
      analytics: { track: vi.fn() }
    } as unknown as SesamyAPI;
    window.sesamy = api;

    const { host } = mount();
    await flush();

    // The first check (from mount) is in flight. A logout starts a second one.
    window.dispatchEvent(new CustomEvent('sesamyJsLogout', { detail: {} }));
    await flush();
    expect(pending).toHaveLength(2);

    // The newer check answers first: denied.
    pending[1](null);
    await flush();
    expect(contentSlot(host)).toBeNull();

    // The older, superseded check now comes back with a grant. It is stale and
    // must change nothing.
    pending[0]({ id: 'ent_1' });
    await flush();

    expect(contentSlot(host)).toBeNull();
    expect(projected(host)).toEqual(['preview']);
  });

  it('does nothing with an answer that arrives after it was taken off the page', async () => {
    let release!: (value: unknown) => void;
    const api = {
      isReady: () => true,
      log: vi.fn(),
      content: {
        get: () => ({ url: 'https://example.com/article', accessLevel: 'entitlement', id: 'a' }),
        hasAccess: vi.fn(
          () =>
            new Promise((resolve) => {
              release = resolve;
            })
        ),
        getLanguage: () => 'en',
        unlock: vi.fn()
      },
      analytics: { track: vi.fn() }
    } as unknown as SesamyAPI;
    window.sesamy = api;
    const unlocked = vi.fn();
    window.addEventListener('sesamyUnlocked', unlocked);

    const { host } = mount();
    await flush();
    host.remove();
    await flush();

    release({ id: 'ent_1' });
    await flush();
    window.removeEventListener('sesamyUnlocked', unlocked);

    expect(unlocked).not.toHaveBeenCalled();
    expect(api.analytics.track).not.toHaveBeenCalled();
  });

  it('checks access once per session change, not once per render', async () => {
    const api = fakeApi(() => ({ id: 'ent_1' }));
    window.sesamy = api;

    mount();
    await flush();

    expect(api.content.hasAccess).toHaveBeenCalledTimes(1);
  });
});

/**
 * Publisher pages hide the container until the bundle has decided, so the
 * locked body does not flash:
 *
 *     sesamy-content-container { display: none; }
 *
 * Older versions rebuilt the article beside the host, where the rule could not
 * reach it. Embed mode projects it through the host's shadow root, and a hidden
 * shadow host hides its shadow tree — so a subscriber was handed a blank space
 * where the article they pay for should be (bilbransje24.no).
 */
describe('<sesamy-content-container> on a page that hides the container', () => {
  let stylesheet: HTMLStyleElement;

  const hide = (css: string) => {
    stylesheet = document.createElement('style');
    stylesheet.textContent = css;
    document.head.append(stylesheet);
  };

  /**
   * What the component declares on the host, not what jsdom computes.
   *
   * jsdom applies the stylesheet, so it can answer "is this element hidden"
   * before the component touches it — but it stores `revert` verbatim instead
   * of resolving it, and does not model the style attribute outranking an
   * `!important` rule. Asserting the computed value after the override would
   * pass whatever the component did, including nothing useful.
   */
  const override = (host: HTMLElement) =>
    host.style.display && `${host.style.display} ${host.style.getPropertyPriority('display')}`.trim();

  const hiddenByPage = (host: HTMLElement) => getComputedStyle(host).display === 'none';

  /**
   * What the override should read as here. `revert` is the intended value, but
   * jsdom reports no support for it, so these runs exercise the fallback. The
   * `revert` branch has a test of its own below.
   */
  const revertOrFallback = supportsRevert() ? 'revert important' : 'inline important';

  function supportsRevert(): boolean {
    const css = (globalThis as { CSS?: { supports?: (p: string, v: string) => boolean } }).CSS;
    return css?.supports?.('display', 'revert') ?? false;
  }

  /** jsdom ships no `window.CSS`, so both branches have to be stood up here. */
  function withRevertSupport(supported: boolean) {
    const global = globalThis as { CSS?: unknown };
    const had = 'CSS' in global;
    const previous = global.CSS;
    global.CSS = { supports: () => supported };
    return () => {
      if (had) global.CSS = previous;
      else delete global.CSS;
    };
  }

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    delete (window as { sesamy?: SesamyAPI }).sesamy;
    document.body.innerHTML = '';
    stylesheet?.remove();
  });

  it('shows the article to a reader who has access', async () => {
    hide('sesamy-content-container { display: none; }');
    window.sesamy = fakeApi(() => ({ id: 'ent_1' }));

    const { host } = mount();
    await flush();

    expect(projected(host)).toEqual(['content']);
    // Whichever it lands on, it is the display this markup has on a page that
    // never added the rule — not a block box the publisher's layout never had.
    expect(override(host)).toBe(revertOrFallback);
  });

  it('declares the override important, so a publisher !important cannot win', async () => {
    hide('sesamy-content-container { display: none !important; }');
    window.sesamy = fakeApi(() => ({ id: 'ent_1' }));

    const { host } = mount();
    await flush();

    // A style-attribute declaration outranks an author rule of the same
    // importance, so this is what decides the real page.
    expect(override(host)).toBe(revertOrFallback);
  });

  it('leaves the page hidden while access is still unknown', async () => {
    // The rule is doing its job here: nothing has been established about this
    // reader, so the locked body must not flash into view.
    hide('sesamy-content-container { display: none; }');
    window.sesamy = fakeApi(() => new Error('NetworkError: failed to fetch'));

    const { host } = mount();
    await flush();

    expect(override(host)).toBe('');
    expect(hiddenByPage(host)).toBe(true);
  });

  it('leaves the page hidden for a reader who has been refused', async () => {
    hide('sesamy-content-container { display: none; }');
    window.sesamy = fakeApi(() => null);

    const { host } = mount();
    await flush();

    expect(override(host)).toBe('');
    expect(hiddenByPage(host)).toBe(true);
  });

  it('hides the container again when the reader signs out', async () => {
    hide('sesamy-content-container { display: none; }');
    let entitled = true;
    window.sesamy = fakeApi(() => (entitled ? { id: 'ent_1' } : null));

    const { host } = mount();
    await flush();
    expect(override(host)).toBe(revertOrFallback);

    entitled = false;
    window.dispatchEvent(new CustomEvent('sesamyJsLogout', { detail: {} }));
    await flush();

    // The page's own rule is back in charge, teaser and all.
    expect(override(host)).toBe('');
    expect(hiddenByPage(host)).toBe(true);
  });

  it('prefers revert where the browser supports it', async () => {
    // The value that matters in a real browser, which jsdom cannot report for
    // itself: roll `display` back to what the page would compute with no author
    // rule, rather than imposing one of our own.
    hide('sesamy-content-container { display: none; }');
    const restore = withRevertSupport(true);
    window.sesamy = fakeApi(() => ({ id: 'ent_1' }));

    const { host } = mount();
    await flush();
    restore();

    expect(override(host)).toBe('revert important');
  });

  it('falls back to a usable display where revert would be dropped', async () => {
    // Chrome before 84, Firefox before 67: an unknown value is discarded, which
    // would leave the article hidden. jsdom reports no support, so this is the
    // path these runs take by default.
    hide('sesamy-content-container { display: none; }');
    const restore = withRevertSupport(false);
    window.sesamy = fakeApi(() => ({ id: 'ent_1' }));

    const { host } = mount();
    await flush();
    restore();

    expect(override(host)).toBe('inline important');
  });

  it('gives an inline display the page set of its own back on a denial', async () => {
    // Some pages hide the container with an inline style rather than a rule.
    // Clearing `display` outright on the way back would drop what the page put
    // there, so the previous declaration is restored instead.
    let entitled = true;
    window.sesamy = fakeApi(() => (entitled ? { id: 'ent_1' } : null));

    const { host } = mount();
    host.style.setProperty('display', 'none');
    await flush();
    expect(override(host)).toBe(revertOrFallback);

    entitled = false;
    window.dispatchEvent(new CustomEvent('sesamyJsLogout', { detail: {} }));
    await flush();

    expect(override(host)).toBe('none');
  });

  it('keeps the page\'s own important inline display, priority and all', async () => {
    let entitled = true;
    window.sesamy = fakeApi(() => (entitled ? { id: 'ent_1' } : null));

    const { host } = mount();
    host.style.setProperty('display', 'none', 'important');
    await flush();

    entitled = false;
    window.dispatchEvent(new CustomEvent('sesamyJsLogout', { detail: {} }));
    await flush();

    expect(override(host)).toBe('none important');
  });

  it('does not touch a container the page never hid', async () => {
    window.sesamy = fakeApi(() => ({ id: 'ent_1' }));

    const { host } = mount();
    await flush();

    // No inline display of our own: the publisher's own layout decides.
    expect(host.style.display).toBe('');
  });
});

describe('<sesamy-content-container> in a fetch-and-inject lock mode', () => {
  // proxy/signedUrl/encode render the article *beside* the host, after a
  // network round trip. The reader can sign out while that fetch is in flight.
  const injectedText = (host: HTMLElement) =>
    Array.from(host.parentElement?.children ?? [])
      .filter((el) => el !== host && el.tagName === 'DIV')
      .map((el) => el.textContent)
      .join('');

  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.querySelectorAll('script').forEach((s) => s.remove());
  });

  afterEach(() => {
    delete (window as { sesamy?: SesamyAPI }).sesamy;
    document.body.innerHTML = '';
    document.head.querySelectorAll('script').forEach((s) => s.remove());
  });

  it('does not insert an article that finished fetching after the reader signed out', async () => {
    let entitled = true;
    let releaseFetch!: (html: string) => void;
    const unlock = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          releaseFetch = resolve;
        })
    );
    const api = {
      isReady: () => true,
      log: vi.fn(),
      content: {
        get: () => ({ url: 'https://example.com/article', accessLevel: 'entitlement', id: 'a' }),
        hasAccess: vi.fn(async () => (entitled ? { id: 'ent_1' } : null)),
        getLanguage: () => 'en',
        unlock
      },
      analytics: { track: vi.fn() }
    } as unknown as SesamyAPI;
    window.sesamy = api;

    const { host } = mount({ 'lock-mode': 'proxy' });
    await flush();
    expect(unlock).toHaveBeenCalledTimes(1);

    // The fetch is still in flight when the reader signs out.
    entitled = false;
    window.dispatchEvent(new CustomEvent('sesamyJsLogout', { detail: {} }));
    await flush();

    // Only now does the article come back from the server.
    releaseFetch('<p>The full article</p>');
    await flush();

    expect(injectedText(host)).toBe('');
  });

  it('renders the article it already fetched when the reader signs back in', async () => {
    let entitled = true;
    let releaseFetch!: (html: string) => void;
    const unlock = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          releaseFetch = resolve;
        })
    );
    const api = {
      isReady: () => true,
      log: vi.fn(),
      content: {
        get: () => ({ url: 'https://example.com/article', accessLevel: 'entitlement', id: 'a' }),
        hasAccess: vi.fn(async () => (entitled ? { id: 'ent_1' } : null)),
        getLanguage: () => 'en',
        unlock
      },
      analytics: { track: vi.fn() }
    } as unknown as SesamyAPI;
    window.sesamy = api;

    const { host } = mount({ 'lock-mode': 'proxy' });
    await flush();

    entitled = false;
    window.dispatchEvent(new CustomEvent('sesamyJsLogout', { detail: {} }));
    await flush();
    releaseFetch('<p>The full article</p>');
    await flush();
    expect(injectedText(host)).toBe('');

    entitled = true;
    window.dispatchEvent(new CustomEvent('sesamyJsAuthenticated', { detail: {} }));
    await flush();

    expect(injectedText(host)).toContain('The full article');
    // Discarding the fetch would have meant paying for it twice.
    expect(unlock).toHaveBeenCalledTimes(1);
  });

  describe('when the session changes while the article is being fetched', () => {
    // A token refresh, or signing in again, starts a new session that is just
    // as entitled. The fetch from the old session must still end up on the page.
    function setup() {
      const checks: Array<(value: unknown) => void> = [];
      let releaseFetch!: (html: string) => void;
      let deferChecks = false;
      const unlock = vi.fn(
        () =>
          new Promise<string>((resolve) => {
            releaseFetch = resolve;
          })
      );
      const api = {
        isReady: () => true,
        log: vi.fn(),
        content: {
          get: () => ({ url: 'https://example.com/article', accessLevel: 'entitlement', id: 'a' }),
          hasAccess: vi.fn(() =>
            deferChecks
              ? new Promise((resolve) => checks.push(resolve))
              : Promise.resolve({ id: 'ent_1' })
          ),
          getLanguage: () => 'en',
          unlock
        },
        analytics: { track: vi.fn() }
      } as unknown as SesamyAPI;
      window.sesamy = api;
      return {
        unlock,
        checks,
        deferNextChecks: () => (deferChecks = true),
        releaseFetch: (html: string) => releaseFetch(html)
      };
    }

    it('renders the article when the new session is granted before the fetch lands', async () => {
      const { unlock, releaseFetch } = setup();

      const { host } = mount({ 'lock-mode': 'proxy' });
      await flush();
      expect(unlock).toHaveBeenCalledTimes(1);

      window.dispatchEvent(new CustomEvent('sesamyJsAuthenticated', { detail: {} }));
      await flush();

      releaseFetch('<p>The full article</p>');
      await flush();

      expect(injectedText(host)).toBe('The full article');
      expect(unlock).toHaveBeenCalledTimes(1);
    });

    it('renders the article when the new session is granted after the fetch lands', async () => {
      const { unlock, checks, deferNextChecks, releaseFetch } = setup();

      const { host } = mount({ 'lock-mode': 'proxy' });
      await flush();

      deferNextChecks();
      window.dispatchEvent(new CustomEvent('sesamyJsAuthenticated', { detail: {} }));
      await flush();

      // The new session has not been answered yet, so the article waits.
      releaseFetch('<p>The full article</p>');
      await flush();
      expect(injectedText(host)).toBe('');

      checks[0]({ id: 'ent_1' });
      await flush();

      expect(injectedText(host)).toBe('The full article');
      expect(unlock).toHaveBeenCalledTimes(1);
    });
  });

  it('does not re-run scripts embedded in the fetched article', async () => {
    // injectContent hoists <script> tags out of the fetched HTML into <head> to
    // make them execute. Re-running the injection on a later grant would run
    // every one of them a second time — double-counted analytics, duplicated ad
    // slots, players initialised twice.
    let entitled = true;
    const api = {
      isReady: () => true,
      log: vi.fn(),
      content: {
        get: () => ({ url: 'https://example.com/article', accessLevel: 'entitlement', id: 'a' }),
        hasAccess: vi.fn(async () => (entitled ? { id: 'ent_1' } : null)),
        getLanguage: () => 'en',
        unlock: vi.fn(
          async () => '<p>The full article</p><script src="https://example.com/ads.js"></script>'
        )
      },
      analytics: { track: vi.fn() }
    } as unknown as SesamyAPI;
    window.sesamy = api;

    const adScripts = () =>
      document.head.querySelectorAll('script[src="https://example.com/ads.js"]').length;

    mount({ 'lock-mode': 'proxy' });
    await flush();
    expect(adScripts()).toBe(1);

    entitled = false;
    window.dispatchEvent(new CustomEvent('sesamyJsLogout', { detail: {} }));
    await flush();

    entitled = true;
    window.dispatchEvent(new CustomEvent('sesamyJsAuthenticated', { detail: {} }));
    await flush();

    expect(adScripts()).toBe(1);
  });

  it('does not stack a second copy when access is granted again', async () => {
    let entitled = true;
    const api = {
      isReady: () => true,
      log: vi.fn(),
      content: {
        get: () => ({ url: 'https://example.com/article', accessLevel: 'entitlement', id: 'a' }),
        hasAccess: vi.fn(async () => (entitled ? { id: 'ent_1' } : null)),
        getLanguage: () => 'en',
        unlock: vi.fn(async () => '<p>The full article</p>')
      },
      analytics: { track: vi.fn() }
    } as unknown as SesamyAPI;
    window.sesamy = api;

    const { host } = mount({ 'lock-mode': 'proxy' });
    await flush();
    expect(injectedText(host)).toContain('The full article');

    entitled = false;
    window.dispatchEvent(new CustomEvent('sesamyJsLogout', { detail: {} }));
    await flush();
    expect(injectedText(host)).toBe('');

    entitled = true;
    window.dispatchEvent(new CustomEvent('sesamyJsAuthenticated', { detail: {} }));
    await flush();

    expect(injectedText(host)).toBe('The full article');
  });
});

describe('<sesamy-content-container> when the access check has no answer', () => {
  // "The article stays locked until I reload." The check on mount throws or
  // stalls, the container is left `unknown`, and with an empty preview slot the
  // reader sees a blank gap. Only an auth event made it ask again, and nothing
  // guarantees one fires.

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
    delete (window as { sesamy?: SesamyAPI }).sesamy;
    vi.useRealTimers();
  });

  /** Run pending microtasks, and any timers due within `ms`. */
  const advance = (ms = 0) => vi.advanceTimersByTimeAsync(ms);
  const failure = () => new Error('Failed to fetch');
  const stalled = () => new Promise(() => {});
  const callCount = (api: SesamyAPI) => (api.content.hasAccess as Mock).mock.calls.length;

  it('asks again after a failed check, and shows the article once it answers', async () => {
    let calls = 0;
    const api = fakeApi(() => (++calls === 1 ? failure() : { id: 'ent_1' }));
    window.sesamy = api;

    const { host, content } = mount();
    await advance();
    expect(projected(host)).toEqual(['preview']);
    expect(contentSlot(host)).toBe(content);

    await advance(accessRetryDelay(0));

    expect(callCount(api)).toBe(2);
    expect(projected(host)).toEqual(['content']);
  });

  it('stops waiting on a check that never comes back, and asks again', async () => {
    let calls = 0;
    const api = fakeApi(() => (++calls === 1 ? stalled() : { id: 'ent_1' }));
    window.sesamy = api;

    const { host } = mount();
    await advance(ACCESS_CHECK_TIMEOUT_MS);
    expect(callCount(api)).toBe(1);
    expect(projected(host)).toEqual(['preview']);

    await advance(accessRetryDelay(0));

    expect(callCount(api)).toBe(2);
    expect(projected(host)).toEqual(['content']);
  });

  it('uses a slow answer that arrives after its check timed out', async () => {
    let release!: (value: unknown) => void;
    let calls = 0;
    const api = fakeApi(() =>
      ++calls === 1
        ? new Promise((resolve) => {
            release = resolve;
          })
        : stalled()
    );
    window.sesamy = api;

    const { host } = mount();
    // Timed out, and the retry is stalled too.
    await advance(ACCESS_CHECK_TIMEOUT_MS + accessRetryDelay(0));
    expect(projected(host)).toEqual(['preview']);

    release({ id: 'ent_1' });
    await advance();

    expect(projected(host)).toEqual(['content']);
  });

  it('keeps the first definite answer over a retry that was already in flight', async () => {
    const pending: Array<(value: unknown) => void> = [];
    const api = fakeApi(() => new Promise((resolve) => pending.push(resolve)));
    window.sesamy = api;

    const { host, content } = mount();
    // The first check times out, and the retry goes out.
    await advance(ACCESS_CHECK_TIMEOUT_MS + accessRetryDelay(0));
    expect(pending).toHaveLength(2);

    // The slow first check comes back with a grant.
    pending[0]({ id: 'ent_1' });
    await advance();
    expect(projected(host)).toEqual(['content']);

    // The retry answers differently. The session is answered already.
    pending[1](null);
    await advance();

    expect(contentSlot(host)).toBe(content);
    expect(projected(host)).toEqual(['content']);
  });

  it('keeps asking, backing off, for as long as there is no answer', async () => {
    const api = fakeApi(failure);
    window.sesamy = api;

    mount();
    await advance();
    expect(callCount(api)).toBe(1);

    for (let retry = 0; retry < ACCESS_RETRY_DELAYS_MS.length + 2; retry++) {
      const delay = accessRetryDelay(retry);
      await advance(delay - 1);
      expect(callCount(api)).toBe(retry + 1);
      await advance(1);
      expect(callCount(api)).toBe(retry + 2);
    }
  });

  it('asks again straight away when the browser comes back online', async () => {
    let online = false;
    const api = fakeApi(() => (online ? { id: 'ent_1' } : failure()));
    window.sesamy = api;

    const { host } = mount();
    await advance();
    expect(projected(host)).toEqual(['preview']);

    online = true;
    window.dispatchEvent(new Event('online'));
    await advance();

    expect(projected(host)).toEqual(['content']);
  });

  it('stops asking once it has a definite answer', async () => {
    let calls = 0;
    const api = fakeApi(() => (++calls === 1 ? failure() : null));
    window.sesamy = api;

    const { host } = mount();
    await advance(accessRetryDelay(0));
    expect(contentSlot(host)).toBeNull();

    await advance(120_000);

    expect(callCount(api)).toBe(2);
  });

  it('stops asking once the container is taken off the page', async () => {
    const api = fakeApi(failure);
    window.sesamy = api;

    const { host } = mount();
    await advance();
    host.remove();
    await advance(120_000);

    expect(callCount(api)).toBe(1);
  });

  it('does not hide an article it already shows when a later check fails', async () => {
    // A session event re-checks. If that check fails, not knowing must not take
    // back what the reader was already reading.
    let failing = false;
    const api = fakeApi(() => (failing ? failure() : { id: 'ent_1' }));
    window.sesamy = api;

    const { host } = mount();
    await advance();
    expect(projected(host)).toEqual(['content']);

    failing = true;
    window.dispatchEvent(new CustomEvent('sesamyJsAuthenticated', { detail: {} }));
    await advance();

    expect(projected(host)).toEqual(['content']);
  });

  it('reports the unresolved check once, and how it recovered', async () => {
    let calls = 0;
    const api = fakeApi(() => (++calls <= 2 ? failure() : { id: 'ent_1' }));
    window.sesamy = api;

    mount();
    await advance();
    await advance(accessRetryDelay(0));
    await advance(accessRetryDelay(1));

    const tracked = (name: string) =>
      (api.analytics.track as Mock).mock.calls
        .filter(([event]) => event === name)
        .map(([, properties]) => properties);

    expect(tracked('content_access_unresolved')).toEqual([
      expect.objectContaining({ publisherContentId: 'article-1', reason: 'Failed to fetch' })
    ]);
    expect(tracked('content_access_recovered')).toEqual([
      expect.objectContaining({
        state: 'granted',
        attempts: 2,
        elapsedMs: accessRetryDelay(0) + accessRetryDelay(1)
      })
    ]);
    // The view is still counted once, and only as what it turned out to be.
    expect(tracked('viewArticle')).toEqual([expect.objectContaining({ state: 'unlocked' })]);
  });
});
