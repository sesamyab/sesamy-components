<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import { twMerge } from 'tailwind-merge';

  type Props = HTMLButtonAttributes & {
    onclick: () => void;
    children: Snippet;
  };

  let { onclick, children, class: classes, ...rest }: Props = $props();
</script>

<button
  class={twMerge(
    'bg-[var(--s-main-color,purple)] font-bold text-white row w-full rounded-lg shadow py-3',
    classes
  )}
  {onclick}
  {...rest}
>
  {@render children()}
</button>
