/**
 * Registers a custom element unless the tag is already taken.
 *
 * Publisher pages sometimes run this bundle twice: the script is included by
 * both a theme and a plugin, or an ajax page swap or bfcache restore re-runs
 * it. A bare `customElements.define` then throws `NotSupportedError` on the
 * second run, which surfaces as an unhandled page error even though the copy
 * that loaded first keeps working.
 *
 * The first registration wins. A browser cannot replace a defined element, so
 * if a different class (another copy, possibly another version) arrives later
 * it is ignored, and noted once at debug level so it can be diagnosed without
 * adding noise to publisher consoles.
 *
 * Svelte only emits its own unguarded `customElements.define` when
 * `<svelte:options customElement>` names a `tag`, so the components leave the
 * tag out and are registered through this helper instead (see index.ts).
 */
const reported = new Set<string>();

export function defineCustomElement(tag: string, constructor: CustomElementConstructor): void {
  const registry = globalThis.customElements;
  if (!registry) return;

  const existing = registry.get(tag);
  if (!existing) {
    registry.define(tag, constructor);
    return;
  }

  if (existing !== constructor && !reported.has(tag)) {
    reported.add(tag);
    console.debug(
      `[sesamy-components] <${tag}> is already defined, most likely by another copy of the bundle on this page. Keeping the first definition.`
    );
  }
}
