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
  import type { SesamyAPI } from '@sesamy/sesamy-js';

  type Props = {
    api: SesamyAPI;
    t: TranslationFunction;
    horizontal?: boolean;
    subscriptions: PaywallSubscription[];
    currency: string;
    selectProduct: Function;
    redirectUrl: string;
  };

  let {
    api,
    horizontal = false,
    subscriptions,
    currency,
    t,
    selectProduct,
    redirectUrl
  }: Props = $props();

  const getCheckoutUrl = async (product: PaywallSubscription) =>
    api.generateLink({
      target: 'checkout',
      sku: product.sku,
      purchaseOptionId: product.poId,
      discountCode: product.discountCode,
      redirectUrl,
      business: product.preferBusiness
    });
</script>

<SelectionGroup
  class={twMerge(
    horizontal && '@xl:grid-cols-3',
    horizontal && subscriptions.length === 4 && '@xl:grid-cols-2 @4xl:grid-cols-4',
    horizontal && subscriptions.length === 2 && '@xl:grid-cols-2',
    horizontal && subscriptions.length === 1 && 'flex'
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
          'border bg-white dark:bg-black/25 border-gray-300 rounded-lg relative',
          tag && 'border-primary mt-0 border-2'
        )}
      >
        {#if tag}
          <Tag text={tag} {t} chunky />
        {/if}

        <Column class="p-4 flex-1 gap-2 w-full !justify-between shadow-md" left up>
          <Column class="@xl:p-1" left>
            <div class="text-base @xl:text-lg font-bold leading-tight">{title}</div>
            {#if typeof price === 'number'}
              <Column class="mb-0 @xl:mb-4" left>
                {#if discountPrice}
                  <div class="leading-none">
                    <span class="font-bold text-2xl @xl:text-4xl whitespace-nowrap">
                      {discountPrice}
                      {currency}
                    </span>
                    {#if periodText}
                      {' '}<span class="text-xl @xl:text-2xl whitespace-nowrap">/ {periodText}</span
                      >
                    {/if}
                  </div>
                {/if}
                <div class="relative leading-tight">
                  <span
                    class={twMerge(
                      'font-bold text-2xl @xl:text-4xl',
                      discountPrice && 'text-xl @xl:text-2xl text-gray-400'
                    )}
                  >
                    {price}
                    {currency}
                  </span>
                  <span
                    class={twMerge(
                      'text-xl @xl:text-2xl whitespace-nowrap',
                      discountPrice && 'text-base @xl:text-lg text-gray-400'
                    )}
                  >
                    {periodText && ` / ${periodText}`}
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

            {#if description && (!features || features.length < 1)}
              <div class="text-sm text-gray-700">{description}</div>
            {/if}

            {#if features && features.length > 0}
              <Features {features} />
            {/if}
          </Column>

          {#if url}
            <Button
              href={url}
              class="w-full mt-4"
              variant={selected || tag ? 'primary' : 'secondary'}
            >
              {buttonText || t('continue')}
            </Button>
          {:else}
            {#await getCheckoutUrl(subscription) then checkoutUrl}
              <Button
                href={checkoutUrl.replace('poId', 'option')}
                class="w-full mt-4"
                variant={selected || tag ? 'primary' : 'secondary'}
              >
                {buttonText || t('continue')}
              </Button>
            {/await}
          {/if}
        </Column>
      </Column>
    {:else}
      {#if i}
        <hr class={twMerge('w-full border-gray-10 dark:border-gray-800')} />
      {/if}
      <Selection
        {id}
        class="gap-2 @md:gap-4"
        name="purchase-option"
        checked={selected}
        onchange={() => selectProduct(subscription)}
      >
        <Column class="flex-1" left>
          <div class="text-base font-bold leading-tight">{title}</div>
          {#if description}
            <div class="leading-tight text-sm">
              {description}
            </div>
          {/if}
        </Column>
        <div class="column-left @md:column-right">
          {#if discountPrice}
            <div class="text-base font-bold leading-none">
              {discountPrice}
              {currency}
              {#if periodText}
                {' '}/ {periodText}
              {/if}
            </div>
          {/if}
          {#if price}
            <div
              class={twMerge(
                'text-base font-bold leading-none',
                discountPrice && 'line-through text-gray-400 text-sm'
              )}
            >
              {price}
              {currency}
              {#if periodText}
                {' '}/ {periodText}
              {/if}
            </div>
          {/if}
        </div>
        {#if tag}
          <Tag text={tag} {t} />
        {/if}
      </Selection>
    {/if}
  {/each}
</SelectionGroup>
