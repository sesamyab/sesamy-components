<script lang="ts">
  import type { Snippet } from 'svelte';
  import Row from '../Row.svelte';
  import { twMerge } from 'tailwind-merge';
  import Icon from '../Icon.svelte';

  type Props = {
    id: string;
    name: string;
    type?: 'radio' | 'checkbox';
    checked?: boolean;
    children: Snippet;
    class?: string;
    [key: string]: any;
  };

  let {
    id,
    name,
    type = 'radio',
    checked,
    children,
    onchange,
    class: classes,
    ...rest
  }: Props = $props();
</script>

<label class="p-3 @3xl:p-4 row-left gap-4 w-full relative cursor-pointer" for={id} {...rest}>
  <input {onchange} {type} class="peer sr-only" {checked} {name} {id} />
  {#if type === 'checkbox'}
    <div
      class="w-4 h-4 rounded transition-all bg-white dark:bg-black border border-gray-300 dark:border-gray-500 relative ring ring-transparent peer-focus-visible:ring-primary/20 peer-checked:border-primary peer-checked:bg-primary"
    >
      <div
        class="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 text-[8px] text-white dark:text-black"
      >
        <Icon name="checkmark" />
      </div>
    </div>
  {/if}
  {#if type === 'radio'}
    <div
      class="w-4 h-4 rounded-full transition-all bg-white dark:bg-black border border-gray-300 dark:border-gray-500 relative ring ring-transparent peer-focus-visible:ring-primary/20 peer-checked:border-primary peer-checked:bg-primary"
    >
      <div
        class="content-[''] absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white dark:bg-black rounded-full"
      ></div>
    </div>
  {/if}
  <div class={twMerge('column-up-left @md:row-left flex-1 !justify-between', classes)}>
    {@render children()}
  </div>
</label>
