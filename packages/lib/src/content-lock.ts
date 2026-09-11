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

/** A node that has been taken out of the page, and where to put it back. */
interface Placement {
  node: Element;
  parent: Node;
  anchor: Node | null;
}

/** Remove a node, remembering where it sat. */
function take(node: Element): Placement | null {
  const parent = node.parentNode;
  if (!parent) return null;

  const placement = { node, parent, anchor: node.nextSibling };
  node.remove();
  return placement;
}

/** Put it back exactly where it was. */
function put(placement: Placement): void {
  const { node, parent, anchor } = placement;
  if (node.isConnected) return;

  // The anchor can itself have been removed since (publisher scripts mutate
  // these pages); appending is the safe fallback.
  if (anchor && anchor.parentNode === parent) {
    parent.insertBefore(node, anchor);
  } else {
    parent.appendChild(node);
  }
}

/**
 * Every node that carries the article, and where each belongs.
 *
 * Locking removes them from the page rather than hiding them with CSS, so the
 * text is not sitting in the DOM for a reader to dig out. Keeping the detached
 * nodes is what makes that reversible: when the reader signs in on the page,
 * the article comes back without a reload — and without being fetched again.
 *
 * There are two of them because the lock modes put the article in two places.
 * `embed` and `encode` read the `[slot="content"]` child inside the host; the
 * fetch-and-inject modes (`encode`, `proxy`, `signedUrl`) render a node *beside*
 * the host. Removing only the first would leave the article on screen after a
 * logout.
 */
export class ContentSlot {
  private detachedSlot: Placement | null = null;
  private injected: Element | null = null;
  private detachedInjected: Placement | null = null;

  constructor(private readonly host: Element) {}

  private find(): Element | null {
    return this.host.querySelector('[slot="content"]');
  }

  isPresent(): boolean {
    return !!this.find();
  }

  /**
   * Adopt a node this component rendered beside the host, so it is locked and
   * unlocked along with the slot child.
   */
  adopt(node: Element): void {
    this.injected = node;
    this.detachedInjected = null;
  }

  /** Take the article out of the page, wherever it is. */
  detach(): void {
    const slotChild = this.find();
    if (slotChild) this.detachedSlot = take(slotChild) ?? this.detachedSlot;

    if (this.injected?.isConnected) {
      this.detachedInjected = take(this.injected) ?? this.detachedInjected;
    }
  }

  /** Put it back. */
  restore(): void {
    if (this.detachedSlot) {
      put(this.detachedSlot);
      this.detachedSlot = null;
    }
    if (this.detachedInjected) {
      put(this.detachedInjected);
      this.detachedInjected = null;
    }
  }
}

/**
 * Bring the page into line with an answer that has already been resolved.
 *
 * Split from `resolveAccess` so a caller can drop a result that a newer check
 * has superseded *before* it touches the DOM: sign-in and sign-out can overlap,
 * and their requests do not necessarily come back in the order they were sent.
 */
export function applyAccessState(state: AccessState, slot: ContentSlot): void {
  if (state === 'granted') slot.restore();
  if (state === 'denied') slot.detach();
  // `unknown`: leave the page exactly as it is.
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
  applyAccessState(state, slot);
  return state;
}
