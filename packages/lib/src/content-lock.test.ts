import { describe, it, expect, vi } from 'vitest';
import type { SesamyAPI } from '@sesamy/sesamy-js';
import { ContentSlot, applyAccess, resolveAccess } from './content-lock';

/**
 * The rule these tests exist to hold: a content gate may only remove the
 * article when it *affirmatively knows* the reader has no access. Not knowing —
 * auth still initialising, a session that can no longer produce a token, a
 * network failure — must leave the page as it is, because the removal is what
 * the reader is left with for good.
 */

function buildHost(): { host: HTMLElement; content: HTMLElement } {
  const host = document.createElement('sesamy-content-container');
  const preview = document.createElement('div');
  preview.setAttribute('slot', 'preview');
  preview.textContent = 'Teaser';

  const content = document.createElement('div');
  content.setAttribute('slot', 'content');
  content.innerHTML = '<p>The full article</p>';

  const trailing = document.createElement('div');
  trailing.className = 'after';

  host.append(preview, content, trailing);
  document.body.append(host);
  return { host, content };
}

function apiReturning(value: unknown): SesamyAPI {
  return {
    content: { hasAccess: vi.fn().mockResolvedValue(value) },
    log: vi.fn()
  } as unknown as SesamyAPI;
}

function apiRejecting(error: Error): SesamyAPI {
  return {
    content: { hasAccess: vi.fn().mockRejectedValue(error) },
    log: vi.fn()
  } as unknown as SesamyAPI;
}

describe('resolveAccess', () => {
  it('grants on an entitlement', async () => {
    await expect(resolveAccess(apiReturning({ id: 'ent_1' }), document.createElement('div'))).resolves.toBe(
      'granted'
    );
  });

  it('grants on a plain true (public or logged-in content)', async () => {
    await expect(resolveAccess(apiReturning(true), document.createElement('div'))).resolves.toBe(
      'granted'
    );
  });

  it('denies on a null answer — the reader is known not to have access', async () => {
    await expect(resolveAccess(apiReturning(null), document.createElement('div'))).resolves.toBe(
      'denied'
    );
  });

  it('reports unknown when the session could not be read', async () => {
    // sesamy-js throws SessionUnavailableError when the reader is authenticated
    // but no access token can be produced — the morning-after-expiry state. The
    // API would answer for an anonymous visitor, so "no entitlements" there
    // means nothing about this reader.
    const error = Object.assign(new Error('session unavailable'), {
      name: 'SessionUnavailableError'
    });
    await expect(resolveAccess(apiRejecting(error), document.createElement('div'))).resolves.toBe(
      'unknown'
    );
  });

  it('reports unknown on any other failure rather than guessing', async () => {
    await expect(
      resolveAccess(apiRejecting(new Error('NetworkError')), document.createElement('div'))
    ).resolves.toBe('unknown');
  });
});

describe('ContentSlot', () => {
  it('takes the content out of the page', () => {
    const { host, content } = buildHost();
    const slot = new ContentSlot(host);

    slot.detach();

    expect(host.querySelector('[slot="content"]')).toBeNull();
    expect(content.isConnected).toBe(false);
  });

  it('puts it back in its original position', () => {
    const { host, content } = buildHost();
    const slot = new ContentSlot(host);

    slot.detach();
    slot.restore();

    expect(host.querySelector('[slot="content"]')).toBe(content);
    // Order matters: publisher CSS and scripts address siblings positionally.
    expect(Array.from(host.children).indexOf(content)).toBe(1);
  });

  it('survives repeated detach/restore cycles', () => {
    const { host, content } = buildHost();
    const slot = new ContentSlot(host);

    slot.detach();
    slot.detach();
    slot.restore();
    slot.restore();

    expect(host.querySelectorAll('[slot="content"]')).toHaveLength(1);
    expect(host.querySelector('[slot="content"]')).toBe(content);
  });

  it('is a no-op for a container that has no content slot', () => {
    const host = document.createElement('sesamy-content-container');
    document.body.append(host);
    const slot = new ContentSlot(host);

    expect(() => {
      slot.detach();
      slot.restore();
    }).not.toThrow();
  });
});

describe('applyAccess', () => {
  it('removes the content when access is denied', async () => {
    const { host } = buildHost();
    const slot = new ContentSlot(host);

    await applyAccess(apiReturning(null), host, slot);

    expect(host.querySelector('[slot="content"]')).toBeNull();
  });

  it('leaves the content in place when access is unknown', async () => {
    const { host, content } = buildHost();
    const slot = new ContentSlot(host);

    const state = await applyAccess(apiRejecting(new Error('offline')), host, slot);

    expect(state).toBe('unknown');
    expect(host.querySelector('[slot="content"]')).toBe(content);
  });

  it('gives the content back when a later check grants access', async () => {
    // The reader logs in on the page, or the session recovers, after the first
    // check already denied. Without this the article is gone until a reload —
    // which is exactly what publishers were reporting.
    const { host, content } = buildHost();
    const slot = new ContentSlot(host);

    await applyAccess(apiReturning(null), host, slot);
    expect(host.querySelector('[slot="content"]')).toBeNull();

    await applyAccess(apiReturning({ id: 'ent_1' }), host, slot);

    expect(host.querySelector('[slot="content"]')).toBe(content);
  });

  it('does not resurrect the content when a later check is merely inconclusive', async () => {
    const { host } = buildHost();
    const slot = new ContentSlot(host);

    await applyAccess(apiReturning(null), host, slot);
    await applyAccess(apiRejecting(new Error('offline')), host, slot);

    expect(host.querySelector('[slot="content"]')).toBeNull();
  });
});
