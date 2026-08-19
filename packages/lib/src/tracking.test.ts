import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { SesamyAPI } from '@sesamy/sesamy-js';
import {
  disableInteractions,
  enableInteractions,
  interactionsEnabled,
  resetInteractions,
  resolveArticleState,
  resolveItemSrc,
  track
} from './tracking';

type TrackCall = [string, Record<string, unknown>];

function fakeApi(): { api: SesamyAPI; calls: TrackCall[] } {
  const calls: TrackCall[] = [];
  const api = {
    analytics: {
      track: (event: string, properties: Record<string, unknown>) => {
        calls.push([event, properties]);
      }
    }
  } as unknown as SesamyAPI;
  return { api, calls };
}

function setAnalyticsMeta(content: string) {
  const meta = document.createElement('meta');
  meta.setAttribute('name', 'sesamy:analytics');
  meta.setAttribute('content', content);
  document.head.appendChild(meta);
}

beforeEach(() => {
  resetInteractions();
});

afterEach(() => {
  resetInteractions();
  document.head.querySelectorAll('meta[name="sesamy:analytics"]').forEach((el) => el.remove());
});

describe('track', () => {
  it('delegates to the sesamy-js analytics API', () => {
    const { api, calls } = fakeApi();

    track(api, 'viewArticle', {
      itemSrc: 'https://example.com/article',
      publisherContentId: 'article-1',
      state: 'locked'
    });

    expect(calls).toEqual([
      [
        'viewArticle',
        {
          name: 'viewArticle',
          itemSrc: 'https://example.com/article',
          publisherContentId: 'article-1',
          state: 'locked'
        }
      ]
    ]);
  });

  it('repeats the event name in the properties for legacy consumers', () => {
    const { api, calls } = fakeApi();

    track(api, 'addToCart', { itemSrc: 'https://example.com/article', sku: 'sku_1' });
    track(api, 'content_unlocked', { itemSrc: 'https://example.com/article' });

    expect(calls.map(([event, properties]) => [event, properties.name])).toEqual([
      ['addToCart', 'addToCart'],
      ['content_unlocked', 'content_unlocked']
    ]);
  });

  it('swallows errors thrown by the analytics API', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const api = {
      analytics: {
        track: () => {
          throw new Error('boom');
        }
      }
    } as unknown as SesamyAPI;

    expect(() =>
      track(api, 'viewArticle', { itemSrc: 'https://example.com', state: 'public' })
    ).not.toThrow();
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });
});

describe('interaction opt-out', () => {
  it('is enabled by default', () => {
    expect(interactionsEnabled()).toBe(true);
  });

  it('is disabled by a sesamy:analytics meta tag set to false', () => {
    setAnalyticsMeta('false');
    expect(interactionsEnabled()).toBe(false);
  });

  it('stays enabled for any other meta tag value', () => {
    setAnalyticsMeta('true');
    expect(interactionsEnabled()).toBe(true);
  });

  it('does not emit while disabled, and resumes once re-enabled', () => {
    const { api, calls } = fakeApi();
    const properties = { itemSrc: 'https://example.com', state: 'public' } as const;

    disableInteractions();
    track(api, 'viewArticle', properties);
    expect(calls).toHaveLength(0);

    enableInteractions();
    track(api, 'viewArticle', properties);
    expect(calls).toHaveLength(1);
  });

  it('lets an explicit call override the meta tag in both directions', () => {
    setAnalyticsMeta('false');

    enableInteractions();
    expect(interactionsEnabled()).toBe(true);

    resetInteractions();
    expect(interactionsEnabled()).toBe(false);
  });
});

describe('resolveItemSrc', () => {
  it('prefers the first candidate that is set', () => {
    expect(resolveItemSrc('https://example.com/explicit', 'https://example.com/content')).toBe(
      'https://example.com/explicit'
    );
    expect(resolveItemSrc('', 'https://example.com/content')).toBe('https://example.com/content');
  });

  it('falls back to the current page url', () => {
    expect(resolveItemSrc(undefined, undefined)).toBe(window.location.href);
  });
});

describe('resolveArticleState', () => {
  it('reports the declared access level ahead of the entitlement', () => {
    expect(resolveArticleState('public', false)).toBe('public');
    expect(resolveArticleState('logged-in', false)).toBe('logged-in');
  });

  it('distinguishes unlocked from locked entitlement content', () => {
    expect(resolveArticleState('entitlement', { id: 'ent_1' })).toBe('unlocked');
    expect(resolveArticleState('entitlement', false)).toBe('locked');
    expect(resolveArticleState(undefined, null)).toBe('locked');
  });
});
