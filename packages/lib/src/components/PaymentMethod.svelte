<script lang="ts">
  import Icon from './Icon.svelte';
  import Row from './Row.svelte';
  import { twMerge } from 'tailwind-merge';
  import type { IconName } from './../icons/types';

  type Props = {
    name: IconName;
  };

  let { name }: Props = $props();
</script>

<Row
  class={twMerge(
    'w-10 aspect-[4/3] px-1 rounded bg-white',
    name === 'klarna' && 'bg-[#FEB4C7]',
    name === 'amex' && 'bg-[#1F72CD]',
    name === 'vipps' && 'text-4xl'
  )}
>
  <Icon {name} multiColor />
</Row>
