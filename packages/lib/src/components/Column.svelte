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
    !up && !right && !down && !left && 'column',
    up && !right && !down && !left && 'column-up',
    !up && right && !down && !left && 'column-right',
    !up && !right && down && !left && 'column-down',
    !up && !right && !down && left && 'column-left',
    up && right && !down && !left && 'column-up-right',
    up && !right && !down && left && 'column-up-left',
    !up && right && down && !left && 'column-down-right',
    !up && !right && down && left && 'column-down-left',
    classes
  )}
  {style}
  {...rest}
>
  {@render children()}
</div>
