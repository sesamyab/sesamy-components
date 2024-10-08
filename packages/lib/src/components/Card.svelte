<script lang="ts">
  import type { Snippet } from 'svelte';
  import Column from './Column.svelte';
  import { twMerge } from 'tailwind-merge';

  type Props = { children: Snippet; [key: string]: any };

  let { children, class: classes }: Props = $props();
</script>

<Column
  class={twMerge(
    'bg-white border-gray-200 has-[input:checked]:border-[var(--sesamy-main-color,purple)] transition-colors rounded-lg border-2 w-full',
    classes
  )}
  left
>
  {@render children()}
</Column>
