import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { SesamyAPI } from '@sesamy/sesamy-js';
import './ContentContainer.wc.svelte';

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

  it('checks access once per session change, not once per render', async () => {
    const api = fakeApi(() => ({ id: 'ent_1' }));
    window.sesamy = api;

    mount();
    await flush();

    expect(api.content.hasAccess).toHaveBeenCalledTimes(1);
  });
});
