declare module '*.wc.svelte' {
  import type { SvelteComponent } from 'svelte';

  // `element` is the custom element class Svelte builds when the file is
  // compiled with `customElement: true`; see src/register.ts.
  const component: typeof SvelteComponent & { element?: CustomElementConstructor };
  export default component;
}

/// <reference types="vite/client" />
interface ImportMeta {
  readonly env: Record<string, string>;
}
