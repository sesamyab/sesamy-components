<script lang="ts">
  import type { Snippet } from 'svelte';
  import { twMerge } from 'tailwind-merge';

  type Props = { horizontal?: boolean; children: Snippet; [key: string]: any };

  let { horizontal = false, children, class: classes }: Props = $props();
</script>

<div
  class={twMerge(
    'transition-colors rounded-md w-full bg-white border-gray-200 border has-[input:checked]:border-primary dark:bg-black/25 dark:border-gray-800',
    horizontal && 'row gap-2 @xl:gap-4',
    classes
  )}
>
  {@render children()}
</div>
