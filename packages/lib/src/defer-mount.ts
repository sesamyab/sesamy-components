/**
 * Works around a Svelte custom-element bug that blanks slotted components when
 * the bundle executes while the HTML parser is still inside the element.
 *
 * `SvelteElement.connectedCallback` waits a single microtask and then snapshots
 * the element's `childNodes` exactly once to decide which `<slot>` outlets to
 * create. A microtask is not enough for the parser to emit the children, so an
 * element upgraded mid-parse is seen as having no children, and every
 * `<slot name="...">` in the template renders *nothing* — not an empty slot.
 * The snapshot is never recomputed, so the component stays blank for good.
 *
 * This is reachable in production: the WordPress plugin injects the bundle from
 * an inline loader at the top of `<head>`, so on a browser cache hit the script
 * executes tens of kilobytes of HTML before the components it defines.
 *
 * Deferring the upgrade until the document has finished parsing means the
 * snapshot always sees a complete child list. Elements created after parsing
 * (SPA navigation, dynamic insertion) take the unchanged path.
 *
 * Note this fixes the timing, not the underlying unsound assumption: children
 * added after the snapshot are still missed. The durable fix is upstream —
 * slot outlets should be created for every declared slot name, since an empty
 * native slot is harmless and self-heals as children arrive.
 */
export function deferMountUntilParsed<T extends new (...args: any[]) => HTMLElement>(Base: T): T {
  return class extends Base {
    /** Set once the element has waited out the parser, so a disconnect and
     * reconnect before DOMContentLoaded doesn't queue a second listener. */
    private sesamyAwaitingParse = false;

    connectedCallback() {
      const parent = Base.prototype as { connectedCallback?: () => void };

      if (document.readyState === 'loading') {
        if (this.sesamyAwaitingParse) return;
        this.sesamyAwaitingParse = true;

        document.addEventListener(
          'DOMContentLoaded',
          () => {
            this.sesamyAwaitingParse = false;
            // The element may have been removed while we waited; Svelte would
            // mount it into a detached tree and never tear it down.
            if (this.isConnected) parent.connectedCallback?.call(this);
          },
          { once: true }
        );
        return;
      }

      parent.connectedCallback?.call(this);
    }
  } as T;
}
