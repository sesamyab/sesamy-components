<script lang="ts">
  import { twMerge } from 'tailwind-merge';
  import type { HTMLSelectAttributes } from 'svelte/elements';
  import Icon from './Icon.svelte';

  type SelectOption = {
    value: string;
    label: string;
  };

  type Props = HTMLSelectAttributes & {
    value: string;
    hasError?: boolean;
    options: SelectOption[];
    placeholder?: string;
    compact?: boolean;
  };

  let {
    value = $bindable(),
    class: classes,
    hasError = false,
    options,
    placeholder = '',
    compact = false,
    ...props
  }: Props = $props();
</script>

<label class="relative w-full gap-2 column-left">
  <select
    bind:value
    class={twMerge(
      'peer w-full appearance-none rounded-md border border-gray-300/50 bg-white p-4 text-base leading-snug text-gray-800 outline-0 transition-colors duration-150 placeholder:text-gray-400 focus:border-gray-300 disabled:opacity-[20%]',
      hasError && 'border-red focus:border-red',
      compact && 'pb-2 pt-6 placeholder:text-transparent',
      classes
    )}
    {...props}
  >
    {#each options as { value, label } (value)}
      <option {value}>
        {label}
      </option>
    {/each}
  </select>
  {#if compact}
    <div
      class={twMerge(
        'pointer-events-none absolute left-4 right-4 top-1/2 line-clamp-1 -translate-y-1/2 text-base font-medium text-gray-400 transition-[transform,font-size] peer-focus:-translate-y-[calc(50%+theme(space.3))] peer-focus:text-xs',
        value !== undefined && value && '-translate-y-[calc(50%+theme(space.3))] text-xs sm:text-xs'
      )}
    >
      {placeholder}
    </div>
  {/if}
  <Icon
    class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-300 peer-focus:text-gray-400 sm:text-xs"
    name="chevron-down"
  />
</label>
