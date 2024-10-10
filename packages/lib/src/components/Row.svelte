<script lang="ts">
  import type { Snippet } from 'svelte';
  import { twMerge } from 'tailwind-merge';

  type Props = { children: Snippet; [key: string]: any };

  let { up, right, down, left, style, class: classes, children, ...rest }: Props = $props();
</script>

<div
  class={twMerge(
    !up && !right && !down && !left && 'row',
    up && !right && !down && !left && 'row-up',
    !up && right && !down && !left && 'row-right',
    !up && !right && down && !left && 'row-down',
    !up && !right && !down && left && 'row-left',
    up && right && !down && !left && 'row-up-right',
    up && !right && !down && left && 'row-up-left',
    !up && right && down && !left && 'row-down-right',
    !up && !right && down && left && 'row-down-left',
    classes
  )}
  {style}
  {...rest}
>
  {@render children()}
</div>
