<script lang="ts">
  import { twMerge } from 'tailwind-merge';
  import type { Snippet } from 'svelte';
  import type { ButtonProps } from './../types';

  let {
    href,
    onclick,
    class: classes,
    disabled,
    part,
    children,
    ...rest
  }: ButtonProps & { class?: string; children: Snippet } = $props();
</script>

<svelte:element
  this={href ? 'a' : 'button'}
  role={href ? 'link' : 'button'}
  class={twMerge('border-0 bg-none outline-none', classes)}
  tabindex="0"
  {href}
  {onclick}
  {part}
  {disabled}
  {...rest}
>
  {@render children()}
</svelte:element>
