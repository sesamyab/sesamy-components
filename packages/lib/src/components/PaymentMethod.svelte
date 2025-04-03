<script lang="ts">
  import Icon from './Icon.svelte';
  import Row from './Row.svelte';
  import { twMerge } from 'tailwind-merge';
  import type { IconName } from './../icons/types';
  import SwishLogo from '../assets/SwishLogo.svelte';

  type Props = {
    name: IconName;
    size?: 'sm' | 'md' | 'lg';
  };

  let { name, size = 'md' }: Props = $props();
</script>

<Row
  class={twMerge(
    'aspect-[4/3] px-1 rounded bg-white text-black border border-transparent',
    name === 'klarna' && 'bg-[#FEB4C7]',
    name === 'amex' && 'bg-[#1F72CD]',
    size === 'sm' && 'w-8 border-gray-300',
    size === 'md' && 'w-10 shadow-sm',
    size === 'lg' && 'w-12 shadow'
  )}
>
  {#if name === 'swish'}
    <SwishLogo width="30" height="30" />
  {:else}
    <Icon {name} multiColor />
  {/if}
</Row>
