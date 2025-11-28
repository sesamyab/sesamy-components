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

<ul class={twMerge('space-y-0.5 @md:space-y-1.5', classes)}>
  {#each features as feature}
    <li class="row-up-left gap-2" transition:slide>
      <Icon class="text-primary text-[0.9em] mt-0.5" name="checkmark" />
      <div class={twMerge('flex-1 leading-snug')}>
        {feature}
      </div>
    </li>
  {/each}
  <li class="row-up-left gap-2" transition:slide>
    <Icon class="text-primary text-[0.9em] mt-0.5" name="checkmark" />
    <div class={twMerge('flex-1 leading-snug')}>dfgdfgdf</div>
  </li>
</ul>
