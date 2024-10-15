<script lang="ts">
  import { twMerge } from 'tailwind-merge';
  import Icon from './Icon.svelte';

  type Props = {
    features: string[];
    bold?: boolean;
  };

  let { features, bold = false }: Props = $props();
</script>

<ul class="text-black column-left gap-2">
  {#each features as feature}
    <li class="row-up-left gap-2">
      <Icon class="text-xs text-main mt-1.5" name="checkmark" />
      <div class={twMerge('flex-1 leading-snug', bold && 'font-bold')}>{feature}</div>
    </li>
  {/each}
</ul>
