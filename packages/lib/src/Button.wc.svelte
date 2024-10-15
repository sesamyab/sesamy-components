<svelte:options customElement="sesamy-button" />

<script lang="ts">
  import { twMerge } from 'tailwind-merge';
  import Base from './Base.svelte';
  import type { ButtonProps } from './types';

  let {
    loading = false,
    variant = 'primary',
    disabled = false,
    size = 'md',
    part,
    onclick,
    href,
    class: classes
  }: ButtonProps & { class?: string } = $props();

  const baseClasses =
    'inline-flex enabled:active:translate-y-px items-center justify-center font-medium rounded-md transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const variantClasses = {
    primary:
      'bg-[hsl(var(--s-main-color))] text-white hover:brightness-90 focus:ring-[hsla(var(--s-main-color),0.5)]',
    secondary:
      'bg-transparent border border-[hsl(var(--s-main-color))] text-[hsl(var(--s-main-color))] hover:bg-[hsla(var(--s-main-color),0.1)] focus:ring-[hsl(var(--s-main-color))]/0.5',
    tertiary:
      'text-[hsl(var(--s-main-color))] hover:brightness-75 focus:ring-[hsla(var(--s-main-color),0.5)]'
  };

  let mergedClasses = $derived.by(() =>
    twMerge(
      baseClasses,
      sizeClasses[size],
      variantClasses[variant],
      disabled && 'opacity-50 cursor-not-allowed',
      classes
    )
  );
</script>

<Base>
  <Clickable
    class={twMerge(
      'inline-flex ring-2 ring-transparent focus:ring-[hsla(var(--s-main-color),0.25)] active:enabled:translate-y-px border border-transparent items-center justify-center outline-none font-medium rounded-md transition-colors duration-200 ease-in-out',
      size == 'sm' && 'px-3 py-1.5 text-sm',
      size == 'md' && 'px-4 py-2 text-base',
      size == 'lg' && 'px-6 py-3 text-lg',
      variant === 'primary' &&
        'bg-[hsl(var(--s-main-color))] text-white enabled:hover:bg-[hsla(var(--s-main-color),0.9)]',
      variant === 'secondary' &&
        'bg-transparent border-[hsl(var(--s-main-color))] text-[hsl(var(--s-main-color))] enabled:hover:bg-[hsla(var(--s-main-color),0.1)]',
      variant === 'tertiary' &&
        'text-[hsl(var(--s-main-color))] enabled:hover:bg-[hsla(var(--s-main-color),0.1)]',
      disabled && 'opacity-50 cursor-not-allowed',
      classes
    )}
    {href}
    {onclick}
    {part}
    {disabled}
  >
    {#if loading}
      <span
        class="inline-block w-4 h-4 mr-2 border-2 border-current border-r-transparent rounded-full animate-spin"
        aria-hidden="true"
      ></span>
    {/if}
  </Clickable>
</Base>
