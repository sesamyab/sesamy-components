declare module '*.wc.svelte' {
  import type { SvelteComponent } from 'svelte';

  const component: typeof SvelteComponent;
  export default component;
}

/// <reference types="vite/client" />
interface ImportMeta {
  readonly env: Record<string, string>;
}
