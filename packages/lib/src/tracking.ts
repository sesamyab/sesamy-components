import type { SesamyAPI } from '@sesamy/sesamy-js';

/**
 * First-party interaction tracking.
 *
 * The components delegate to sesamy-js (`api.analytics.track`) rather than
 * posting to `/interactions` themselves, so events flow through the sesamy-js
 * pipeline with its context (anonymousId, userId, vendor, page). sesamy-js
 * turns each call into `{ type: 'track', event: <name>, properties }`.
 *
 * Event names and property names mirror the ones `@sesamy/web-components`
 * produced, so the downstream consumers of the interactions index keep working
 * unchanged — only `context.library` differs.
 */
export const TrackEventName = {
  VIEW_ARTICLE: 'viewArticle',
  ADD_TO_CART: 'addToCart',
  CONTENT_UNLOCKED: 'content_unlocked'
} as const;

export type TrackEventName = (typeof TrackEventName)[keyof typeof TrackEventName];

export type ArticleState = 'public' | 'locked' | 'unlocked' | 'logged-in';

export interface ViewArticleProperties {
  itemSrc: string;
  publisherContentId?: string;
  state: ArticleState;
}

export interface AddToCartProperties {
  itemSrc: string;
  publisherContentId?: string;
  sku?: string;
  purchaseOptionId?: string;
  price?: number;
  currency?: string;
  paywallId?: string;
}

export interface ContentUnlockedProperties {
  itemSrc: string;
  publisherContentId?: string;
  contentName?: string;
}

export interface TrackEventProperties {
  viewArticle: ViewArticleProperties;
  addToCart: AddToCartProperties;
  content_unlocked: ContentUnlockedProperties;
}

/**
 * `null` means "no explicit choice made" — the meta tag decides.
 */
let override: boolean | null = null;

/**
 * Opt back in to first-party interaction tracking, overriding the
 * `<meta name="sesamy:analytics" content="false">` opt-out.
 */
export function enableInteractions(): void {
  override = true;
}

/**
 * Stop the components from emitting interactions through sesamy-js. The
 * per-element DOM events (`sesamy:content-unlocked` and friends) keep firing;
 * only the first-party emission is suppressed.
 */
export function disableInteractions(): void {
  override = false;
}

/**
 * Drop any explicit `enableInteractions`/`disableInteractions` call and fall
 * back to the document's `sesamy:analytics` meta tag.
 */
export function resetInteractions(): void {
  override = null;
}

/**
 * Whether the components currently emit interactions. Defaults to enabled;
 * `<meta name="sesamy:analytics" content="false">` opts a page out, which is
 * the same switch `@sesamy/web-components` honoured.
 */
export function interactionsEnabled(): boolean {
  if (override !== null) {
    return override;
  }

  const meta = document.querySelector('meta[name="sesamy:analytics"]');
  return meta?.getAttribute('content') !== 'false';
}

/**
 * Resolve the item source the same way the legacy components did: the first
 * candidate that is set (an explicit attribute, then the URL sesamy-js resolved
 * for the content), falling back to the current page.
 */
export function resolveItemSrc(...candidates: (string | undefined)[]): string {
  return candidates.find((candidate) => !!candidate) || window.location.href;
}

/**
 * The `state` carried by `viewArticle`, resolved the way the legacy components
 * resolved it: the declared access level wins, and only entitlement-gated
 * content is reported as locked/unlocked.
 */
export function resolveArticleState(
  accessLevel: string | undefined,
  hasAccess: unknown
): ArticleState {
  if (accessLevel === 'public') return 'public';
  if (accessLevel === 'logged-in') return 'logged-in';
  return hasAccess ? 'unlocked' : 'locked';
}

/**
 * Picks the access level a content container should enforce. The container's
 * own `access-level` attribute wins over whatever sesamy-js resolved: since
 * sesamy-js 1.126 `content.get(element)` reads attributes from the nearest
 * <sesamy-article>, so a container nested inside an article would otherwise
 * lose its own setting.
 */
export function resolveAccessLevel(
  attribute: string | undefined,
  resolved: string | undefined
): string | undefined {
  return attribute || resolved;
}

export function track<K extends TrackEventName>(
  api: SesamyAPI,
  name: K,
  properties: TrackEventProperties[K]
): void {
  if (!interactionsEnabled()) {
    return;
  }

  try {
    // The legacy components sent the event name inside `properties` as well;
    // keep that so consumers reading `properties.name` are unaffected.
    api.analytics.track(name, { name, ...properties });
  } catch (err) {
    // Tracking must never break rendering.
    console.error(`Failed to track ${name}:`, err);
  }
}
