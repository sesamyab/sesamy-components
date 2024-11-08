<script lang="ts">
  import { twMerge } from 'tailwind-merge';

  let { isOpen = false } = $props();
</script>

<div
  class={twMerge(
    'grid transition-[grid-template-rows] duration-200 ease-out grid-rows-[0fr]',
    isOpen && 'grid-rows-[1fr]'
  )}
>
  <div class="overflow-hidden">
    <slot />
  </div>
</div>
