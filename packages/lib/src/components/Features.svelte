<script lang="ts">
  import { slide } from 'svelte/transition';
  import { twMerge } from 'tailwind-merge';
  import Icon from './Icon.svelte';

  type Props = {
    features: string[];
    class?: string;
  };

  let { features, class: classes }: Props = $props();
</script>

<ul class={twMerge('text-gray-600 space-y-0.5 @md:space-y-1.5 text-sm @md:text-base', classes)}>
  {#each features as feature}
    <li class="row-up-left gap-2" transition:slide>
      <Icon class="text-xs @md:text-sm text-primary mt-0.5 @md:mt-1" name="checkmark" />
      <div class={twMerge('flex-1 leading-snug')}>
        {feature}
      </div>
    </li>
  {/each}
</ul>
