<svelte:options customElement="sesamy-button" />

<script lang="ts">
  import { twMerge } from "tailwind-merge";
  import Base from "./Base.svelte";

  export let variant: "primary" | "secondary" = "primary";
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

  const variantClasses = {
    primary: {
      solid:
        "bg-[var(--sesamy-button-bg)] text-[var(--sesamy-button-text)] hover:bg-[var(--sesamy-button-bg-hover)] focus:ring-[var(--sesamy-button-ring)]",
      outline:
        "bg-transparent border border-[var(--sesamy-button-border)] text-[var(--sesamy-button-text)] hover:bg-[var(--sesamy-button-bg-hover)] hover:text-[var(--sesamy-button-text-hover)] focus:ring-[var(--sesamy-button-ring)]",
    },
    secondary: {
      solid:
        "bg-[var(--sesamy-button-secondary-bg)] text-[var(--sesamy-button-secondary-text)] hover:bg-[var(--sesamy-button-secondary-bg-hover)] focus:ring-[var(--sesamy-button-secondary-ring)]",
      outline:
        "bg-transparent border border-[var(--sesamy-button-secondary-border)] text-[var(--sesamy-button-secondary-text)] hover:bg-[var(--sesamy-button-secondary-bg-hover)] hover:text-[var(--sesamy-button-secondary-text-hover)] focus:ring-[var(--sesamy-button-secondary-ring)]",
    },
  };

  $: classes = twMerge(
    baseClasses,
    sizeClasses[size],
    variantClasses[variant][outline ? "outline" : "solid"],
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
