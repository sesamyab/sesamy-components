<svelte:options customElement="sesamy-button" />

<script lang="ts">
  import { twMerge } from 'tailwind-merge';
  import Base from './Base.svelte';
  import type { ButtonProps, Variant } from './types';

  let {
    loading = false,
    variant = 'primary',
    disabled = false,
    size = 'md',
    part,
    onclick,
    href
  }: ButtonProps = $props();

  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-md transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const variantClasses = {
    primary:
      'bg-[var(--s-main-color,#3b82f6)] text-white hover:brightness-90 focus:ring-[color:var(--s-main-color,#3b82f6)] focus:ring-opacity-50',
    secondary:
      'bg-transparent border border-[var(--s-main-color,#3b82f6)] text-[var(--s-main-color,#3b82f6)] hover:bg-[var(--s-main-color,#3b82f6)] hover:bg-opacity-10 focus:ring-[color:var(--s-main-color,#3b82f6)] focus:ring-opacity-50',
    tertiary:
      'text-[var(--s-main-color,#3b82f6)] hover:brightness-75 focus:ring-[color:var(--s-main-color,#3b82f6)] focus:ring-opacity-50'
  };

  // Define reactive state for classes
  let classes = $state('');

  $effect(() => {
    classes = twMerge(
      baseClasses,
      sizeClasses[size],
      variantClasses[variant],
      disabled && 'opacity-50 cursor-not-allowed'
    );
  });
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
