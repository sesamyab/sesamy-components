<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { twMerge } from 'tailwind-merge';

  type Props = HTMLInputAttributes & {
    value: string;
    error?: string;
    hasError?: boolean;
    placeholder?: string;
    compact?: boolean;
  };

  let {
    value = $bindable(),
    error,
    hasError = false,
    placeholder = '',
    compact = false,
    class: classes = '',
    ...props
  }: Props = $props();
</script>

<label class={twMerge('relative w-full column-left', (hasError || !!error) && 'z-20')}>
  <input
    {...props}
    class={twMerge(
      'relative peer w-full rounded-md border border-gray-200 bg-white p-4 text-base leading-snug text-gray-800 outline-0 transition-colors duration-150 placeholder:text-gray-400 focus:border-gray-300 disabled:opacity-[20%] dark:border-gray-700 dark:bg-black/25 dark:text-gray-100',
      (hasError || !!error) && '!border-red-500 z-10',
      compact && 'pb-2 pt-6 placeholder:text-transparent',
      String(classes)
    )}
    {placeholder}
    bind:value
  />
  {#if compact}
    <div
      class={twMerge(
        'pointer-events-none absolute left-4 right-4 top-1/2 line-clamp-1 -translate-y-1/2 text-base font-medium text-gray-400 transition-[transform,font-size] peer-focus-visible:-translate-y-[calc(50%+theme(space.3))] peer-focus:text-xs',
        !!value && '-translate-y-[calc(50%+theme(space.3))] text-xs sm:text-xs'
      )}
    >
      {placeholder}
    </div>
  {/if}
</label>
