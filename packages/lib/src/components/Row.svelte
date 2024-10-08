<script lang="ts">
  import type { Snippet } from 'svelte';
  import { twMerge } from 'tailwind-merge';

  let {
    up,
    right,
    down,
    left,
    style,
    class: classes,
    children,
    ...rest
  }: { [x: string]: any; children: Snippet } = $props();
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
