<script lang="ts">
  import { twMerge } from 'tailwind-merge';

  let { text, chunky, t }: { text: string; chunky?: boolean; t: any } = $props();
</script>

<div
  class={twMerge(
    'absolute top-1 right-5 h-1 w-1 bg-green-500 rotate-6',
    chunky && 'right-12 top-3'
  )}
>
  <div
    class={twMerge(
      'absolute bg-primary bottom-0 rounded left-1/2 -translate-x-1/2 px-2 text-white text-xs py-1 font-bold whitespace-nowrap',
      chunky && 'px-3 text-base'
    )}
  >
    <div
      class="absolute top-full left-1/2 -translate-x-1/2 w-4 h-4 bg-primary rotate-45 -translate-y-3.5 rounded-sm"
    ></div>
    <div class="relative">
      {text}
    </div>
  </div>
</div>
