<script lang="ts">
  import { twMerge } from 'tailwind-merge';
  import PurchaseOptions from './PurchaseOptions.svelte';
  import type { TranslationFunction } from 'src/i18n';
  import type { PaywallSubscription } from 'src/types/Paywall';
  import Column from '../Column.svelte';
  import Features from '../Features.svelte';
  import Button from '../../Button.wc.svelte';
  import Tag from '../Tag.svelte';
  import PurchaseOption from './PurchaseOption.svelte';

  type Props = {
    t: TranslationFunction;
    horizontal?: boolean;
    subscriptions: PaywallSubscription[];
    currency: string;
    selectProduct: Function;
  };

  let { horizontal = false, subscriptions, currency, t, selectProduct }: Props = $props();
</script>

<PurchaseOptions
  class={twMerge(
    'mt-2',
    !horizontal && 'column-left',
    horizontal && 'grid-cols-3',
    horizontal && subscriptions.length === 2 && 'grid-cols-2',
    horizontal && subscriptions.length === 1 && 'flex justify-center'
  )}
  {horizontal}
>
  {#each subscriptions as subscription, i}
    {@const {
      id,
      title,
      description,
      price,
      periodText,
      features,
      selected,
      tag,
      buttonText,
      url
    } = subscription}

    {#if horizontal}
      <Column
        class={twMerge(
          'border bg-white border-gray-300 rounded-lg relative',
          tag && 'border-primary mt-0 border-2'
        )}
      >
        {#if tag}
          <Tag text={tag} {t} chunky />
        {/if}

        <Column class="p-4 flex-1 w-full !justify-between gap-8 shadow-md" left up>
          <Column class="gap-1 p-2" left>
            <div class="text-lg font-bold mb-1">{title}</div>
            {#if typeof price === 'number'}
              <div class="d mb-4 leading-none">
                <span class="font-bold text-4xl">
                  {price}
                  {currency}
                </span> <span class="text-2xl">/ {periodText}</span>
              </div>
            {/if}

            {#if features}
              <Features {features} />
            {/if}
          </Column>

          <Button href={url} class="w-full mt-2" variant={tag ? 'primary' : 'secondary'}>
            {buttonText || t('continue')}
          </Button>
        </Column>
      </Column>
    {:else}
      {#if i}
        <hr class="w-full border-gray-100" />
      {/if}
      <PurchaseOption
        {id}
        name="purchase-option"
        checked={selected}
        onchange={() => selectProduct(subscription)}
      >
        <Column left>
          <div class="text-base font-bold">{title}</div>
          {#if description}
            <div class="text-sm">
              {description}
            </div>
          {/if}
        </Column>
        <div class="text-base font-bold">{price} {currency} / {periodText}</div>
        {#if tag}
          <Tag text={tag} {t} />
        {/if}
      </PurchaseOption>
    {/if}
  {/each}
</PurchaseOptions>
