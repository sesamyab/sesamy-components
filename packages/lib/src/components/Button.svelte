<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import { twMerge } from 'tailwind-merge';

  type Props = HTMLButtonAttributes & {
    onclick?: () => void;
    children: Snippet;
    secondary?: boolean;
  };

  let { onclick, children, class: classes, secondary = false, ...rest }: Props = $props();
</script>

<button
  class={twMerge(
    'bg-[var(--s-main-color,purple)] active:translate-y-px border border-transparent font-bold text-white row w-full rounded-lg py-3',
    classes,
    !secondary && 'shadow',
    secondary &&
      'bg-transparent border-[var(--s-main-color,purple)] text-[var(--s-main-color,purple)]'
  )}
  {onclick}
  {...rest}
>
  {@render children()}
</button>
