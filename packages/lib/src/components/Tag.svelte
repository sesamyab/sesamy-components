<script lang="ts">
  import { twMerge } from 'tailwind-merge';

  let { text, chunky, t }: { text: string; chunky?: boolean; t: any } = $props();
</script>

<div class={twMerge('absolute top-2 -right-3 rotate-3', chunky && 'top-5')}>
  <div
    class={twMerge(
      'absolute bg-primary bottom-0 rounded right-0 px-2 text-white text-xs py-1 font-bold whitespace-nowrap',
      chunky && 'px-3 text-sm @xl:text-base bottom-1'
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
