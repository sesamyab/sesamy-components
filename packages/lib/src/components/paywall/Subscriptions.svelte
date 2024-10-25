<script lang="ts">
  import { twMerge } from 'tailwind-merge';
  import SelectionGroup from './SelectionGroup.svelte';
  import type { TranslationFunction } from 'src/i18n';
  import type { PaywallSubscription } from 'src/types/Paywall';
  import Column from '../Column.svelte';
  import Features from '../Features.svelte';
  import Button from '../../Button.wc.svelte';
  import Tag from '../Tag.svelte';
  import Selection from './Selection.svelte';

  type Props = {
    t: TranslationFunction;
    horizontal?: boolean;
    subscriptions: PaywallSubscription[];
    currency: string;
    selectProduct: Function;
  };

  let { horizontal = false, subscriptions, currency, t, selectProduct }: Props = $props();
</script>

<SelectionGroup
  class={twMerge(
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
      url,
      discountPrice
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
              <Column class="mb-4" left>
                {#if discountPrice}
                  <div class="leading-none">
                    <span class="font-bold text-4xl">
                      {discountPrice}
                      {currency}
                    </span> <span class="text-2xl">/ {periodText}</span>
                  </div>
                {/if}
                <div class="relative leading-none">
                  <span
                    class={twMerge('font-bold text-4xl', discountPrice && 'text-2xl text-gray-400')}
                  >
                    {price}
                    {currency}
                  </span>
                  <span class={twMerge('text-2xl', discountPrice && 'text-lg text-gray-400')}>
                    / {periodText}
                  </span>
                  <div
                    class={twMerge(
                      'hidden absolute top-1/2 left-0 right-0 h-px bg-gray-400',
                      discountPrice && 'block'
                    )}
                  ></div>
                </div>
              </Column>
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
      <Selection
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
        <Column right>
          {#if discountPrice}
            <div class="text-base font-bold leading-none">
              {discountPrice}
              {currency} / {periodText}
            </div>
          {/if}
          <div
            class={twMerge(
              'text-base font-bold leading-none',
              discountPrice && 'line-through text-gray-400 text-sm'
            )}
          >
            {price}
            {currency} / {periodText}
          </div>
        </Column>
        {#if tag}
          <Tag text={tag} {t} />
        {/if}
      </Selection>
    {/if}
  {/each}
</SelectionGroup>
