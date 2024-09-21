declare module "*.wc.svelte" {
  import type { SvelteComponent } from "svelte";

  const component: typeof SvelteComponent;
  export default component;
}
