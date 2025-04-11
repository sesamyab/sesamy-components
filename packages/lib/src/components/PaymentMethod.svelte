<script lang="ts">
  import Icon from './Icon.svelte';
  import Row from './Row.svelte';
  import { twMerge } from 'tailwind-merge';
  import type { IconName } from './../icons/types';
  import PaymentMethodLogo from './PaymentMethodLogo.svelte';

  type Props = {
    name: IconName;
    size?: 'sm' | 'md' | 'lg';
  };

  let { name, size = 'md' }: Props = $props();
</script>

<Row
  class={twMerge(
    'aspect-[4/3] px-1 rounded bg-white border border-transparent',
    name === 'klarna' && 'bg-[#FEB4C7]',
    name === 'amex' && 'bg-[#1F72CD]',
    size === 'sm' && 'w-8 border-gray-300',
    size === 'md' && 'w-10 shadow-sm',
    size === 'lg' && 'w-12 shadow'
  )}
>
  <PaymentMethodLogo method={name.toUpperCase()} width="38" height="auto" />
</Row>
