<script lang="ts">
  import { slide } from 'svelte/transition';
  import { twMerge } from 'tailwind-merge';
  import Icon from './Icon.svelte';

  type Props = {
    features: string[];
    bold?: boolean;
  };

  let { features, bold = false }: Props = $props();
</script>

<ul class="text-black space-y-2">
  {#each features as feature}
    <li class="row-up-left gap-2" transition:slide>
      <Icon class="text-xs text-primary mt-1.5" name="checkmark" />
      <div class={twMerge('flex-1 leading-snug', bold && 'font-bold')}>{feature}</div>
    </li>
  {/each}
</ul>
