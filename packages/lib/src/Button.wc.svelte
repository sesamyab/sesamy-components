<svelte:options customElement="sesamy-button" />

<script lang="ts">
  import { twMerge } from 'tailwind-merge';
  import Base from './Base.svelte';
  import type { ButtonProps } from './types';
  import Clickable from './components/Clickable.svelte';

  let {
    loading = false,
    variant = 'primary',
    disabled = false,
    size = 'md',
    part,
    onclick,
    href,
    type = 'button',
    class: classes
  }: ButtonProps & { loading?: boolean; disabled?: boolean; class?: string } = $props();
</script>

<Base>
  <Clickable
    class={twMerge(
      'inline-flex font-bold ring-2 ring-transparent focus:ring-primary/25 active:enabled:translate-y-px border border-transparent items-center justify-center outline-none rounded-md transition-colors duration-200 ease-in-out',
      size == 'sm' && 'px-3 py-1.5 text-sm',
      size == 'md' && 'px-4 py-2 text-base',
      size == 'lg' && 'px-6 py-3 text-lg',
      variant === 'primary' && 'bg-primary text-white enabled:hover:bg-primary/90',
      variant === 'secondary' &&
        'bg-transparent border-primary text-primary enabled:hover:bg-primary/10',
      variant === 'tertiary' && 'text-primary enabled:hover:bg-primary/10',
      disabled && 'opacity-50 cursor-not-allowed',
      classes
    )}
    {href}
    {onclick}
    {part}
    {disabled}
    {type}
  >
    {#if loading}
      <span
        class="inline-block w-4 h-4 mr-2 border-2 border-current border-r-transparent rounded-full animate-spin"
        aria-hidden="true"
      ></span>
    {/if}
    <!-- This should ideally be {@render children()} but doesn't seem to work as of now -->
    <slot />
  </Clickable>
</Base>
