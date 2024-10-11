<svelte:options customElement="sesamy-button" />

<script lang="ts">
  import { twMerge } from "tailwind-merge";
  import Base from "./Base.svelte";

  export let loading = false;
  export let disabled = false;
  export let outline = false;
  export let size: "sm" | "md" | "lg" = "md";
  export let part;
  export let onclick = () => {};
  export let href = "";

  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-md transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2";

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const getButtonClasses = (isOutline: boolean) => {
    return isOutline
      ? "bg-transparent border border-blue-500 text-blue-500 hover:bg-blue-50 hover:text-blue-600 focus:ring-blue-300"
      : "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-300";
  };

  $: classes = twMerge(
    baseClasses,
    sizeClasses[size],
    getButtonClasses(outline),
    disabled && "opacity-50 cursor-not-allowed",
  );
</script>

<Base>
  {#if href && !disabled && !loading}
    <a {href} class={classes} {onclick}>
      <slot />
    </a>
  {:else}
    <button class={classes} {disabled} {onclick} {part}>
      {#if loading}
        <span
          class="inline-block w-4 h-4 mr-2 border-2 border-current border-r-transparent rounded-full animate-spin"
          aria-hidden="true"
        ></span>
      {/if}
      <slot />
    </button>
  {/if}
</Base>