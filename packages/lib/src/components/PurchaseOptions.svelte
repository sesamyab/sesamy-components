<script lang="ts">
  import type { Snippet } from 'svelte';
  import { twMerge } from 'tailwind-merge';

  type Props = { horizontal?: boolean; children: Snippet; [key: string]: any };

  let { horizontal = false, children, class: classes }: Props = $props();
</script>

<div
  class={twMerge(
    'transition-colors grid rounded-lg w-full auto-rows-fr',
    horizontal && 'gap-4',
    !horizontal && 'bg-white border-gray-200 border-2 checked:border-primary',
    classes
  )}
>
  {@render children()}
</div>
