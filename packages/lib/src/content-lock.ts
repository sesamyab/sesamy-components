import type { SesamyAPI } from '@sesamy/sesamy-js';

/**
 * What we know about this reader's access to this article.
 *
 * `unknown` is a first-class answer, not an error state. Auth may still be
 * initialising, the session may have expired overnight and be unable to produce
 * a token, the network may be down. In all of those the API would answer for an
 * anonymous visitor — correctly, and uselessly, since an anonymous visitor owns
 * nothing. Treating that as `denied` is what locks an article for a subscriber.
 */
export type AccessState = 'unknown' | 'granted' | 'denied';

/**
 * Ask sesamy-js whether this reader may see the article.
 *
 * Any failure is `unknown`: not knowing is never the same as knowing the reader
 * has no access, and only the latter may take content off the page.
 */
export async function resolveAccess(api: SesamyAPI, host: Element): Promise<AccessState> {
  try {
    const entitlement = await api.content.hasAccess(host);
    return entitlement ? 'granted' : 'denied';
  } catch (error) {
    api.log?.(`Could not resolve access: ${(error as Error).message}`);
    return 'unknown';
  }
}

/**
 * The article's light-DOM node, and where it belongs.
 *
 * Locking removes `[slot="content"]` from the page rather than hiding it with
 * CSS, so the text is not sitting in the DOM for a reader to dig out. Keeping
 * the detached node (and its position) is what makes that reversible: when the
 * reader signs in on the page, the article can come back without a reload.
 */
export class ContentSlot {
  private detached: Element | null = null;
  private anchor: Node | null = null;

  constructor(private readonly host: Element) {}

  private find(): Element | null {
    return this.host.querySelector('[slot="content"]');
  }

  isPresent(): boolean {
    return !!this.find();
  }

  /** Take the article out of the page, remembering where it sat. */
  detach(): void {
    const content = this.find();
    if (!content) return;

    this.detached = content;
    this.anchor = content.nextSibling;
    content.remove();
  }

  /** Put it back exactly where it was. */
  restore(): void {
    if (!this.detached || this.detached.isConnected) return;

    // The anchor can itself have been removed since (publisher scripts mutate
    // these pages); appending is the safe fallback.
    if (this.anchor && this.anchor.parentNode === this.host) {
      this.host.insertBefore(this.detached, this.anchor);
    } else {
      this.host.append(this.detached);
    }
    this.detached = null;
    this.anchor = null;
  }
}

/**
 * Resolve access and bring the page into line with the answer.
 *
 * Safe to call repeatedly — on mount, and again whenever the session changes —
 * which is the point: a denial taken while the session was still settling is
 * undone by the next check that grants.
 */
export async function applyAccess(
  api: SesamyAPI,
  host: Element,
  slot: ContentSlot
): Promise<AccessState> {
  const state = await resolveAccess(api, host);

  if (state === 'granted') slot.restore();
  if (state === 'denied') slot.detach();
  // `unknown`: leave the page exactly as it is.

  return state;
}
