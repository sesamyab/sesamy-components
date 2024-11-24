<script lang="ts">
  import { twMerge } from 'tailwind-merge';
  import type { Snippet } from 'svelte';

  type Props = {
    class?: string;
    children: Snippet;
  };

  let { class: classes, children }: Props = $props();
</script>

<div
  class={twMerge(
    'w-full [&>label:first-child>:where(select,input)]:rounded-t-md [&>label:last-child>:where(select,input)]:rounded-b-md [&>label>:where(select,input)]:rounded-none [&_label>:where(select,input)]:-mt-px [&_label>select]:-mt-px',
    'max-sm:gap-0 max-sm:[&>*:first-child>*:first-child>label:first-of-type>:where(select,input)]:rounded-t-md max-sm:[&>*:last-child>*:last-child>label:last-of-type>:where(select,input)]:rounded-b-md max-sm:[&>*]:gap-0 max-sm:[&_label>:where(select,input)]:rounded-none',
    classes
  )}
>
  {@render children()}
</div>
