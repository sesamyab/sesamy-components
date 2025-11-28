<script lang="ts">
  import { twMerge } from 'tailwind-merge';
  import SelectionGroup from './SelectionGroup.svelte';
  import type { TranslationFunction } from '../../i18n';
  import type { PaywallSubscription } from '../../types/Paywall';
  import Column from '../Column.svelte';
  import Features from '../Features.svelte';
  import Button from '../../Button.wc.svelte';
  import Tag from '../Tag.svelte';
  import Selection from './Selection.svelte';
  import type { SesamyAPI } from '@sesamy/sesamy-js';
  import DescriptionWithReadMore from './DescriptionWithReadMore.svelte';

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

  const hasAnyDisountedPrice = () =>
    subscriptions.some(
      (subscription) =>
        typeof subscription.discountPrice === 'number' &&
        subscription.discountPrice < (subscription.price || Infinity)
    );
</script>

<SelectionGroup
  class={twMerge(
    horizontal && '@xl:grid-cols-3',
    horizontal && subscriptions.length === 4 && '@xl:grid-cols-2 @7xl:grid-cols-4',
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
      discountPrice,
      readMoreLink,
      readMoreText
    } = subscription}
    {@const hasPrice = typeof price === 'number'}
    {@const hasDiscountPrice = typeof discountPrice === 'number'}

    {#if horizontal}
      <div class="@container/box">
        <Column
          class={twMerge(
            'border bg-white dark:bg-black/25 border-gray-300 rounded-lg relative h-full',
            tag && 'border-primary mt-0 border-2'
          )}
        >
          {#if tag}
            <Tag text={tag} {t} chunky />
          {/if}

          <Column class="p-4 flex-1 gap-2 w-full !justify-between shadow-md" left up>
            <Column class="@xl:p-1" left>
              <div class="text-base @xl:text-lg font-bold leading-tight">{title}</div>
              {#if hasPrice}
                <div class="mb-3">
                  <div>
                    <span class="font-bold text-2xl @xs/box:text-3xl whitespace-nowrap">
                      {hasDiscountPrice ? discountPrice : price}
                      {currency}
                    </span>
                    <span class="font-bold whitespace-nowrap @xs/box:text-lg">
                      {periodText && ` / ${periodText}`}
                    </span>
                  </div>
                  {#if hasAnyDisountedPrice()}
                    <div class="h-6 @xs:box/h-7">
                      {#if hasDiscountPrice}
                        <div class="text-gray-500 line-through @xs/box:text-lg">
                          {price}
                          {currency}
                          {#if periodText}
                            {' '}/ {periodText}
                          {/if}
                        </div>
                      {/if}
                    </div>
                  {/if}
                </div>
              {/if}

              {#if description && (!features || features.length < 1)}
                <DescriptionWithReadMore
                  {description}
                  {readMoreLink}
                  {readMoreText}
                  {t}
                  class="text-gray-700 dark:text-gray-300 text-sm"
                />
              {/if}

              {#if features && features.length > 0}
                <Features {features} class="text-gray-700 dark:text-gray-300 text-sm" />
              {/if}
            </Column>

            {#if url}
              <Button
                href={url}
                class="w-full mt-4 bg-[var(--s-paywall-btn-bg-color)] text-[var(--s-paywall-btn-text-color)]"
                variant="primary"
              >
                {buttonText || t('continue')}
              </Button>
            {:else}
              {#await getCheckoutUrl(subscription) then checkoutUrl}
                <Button
                  href={checkoutUrl.replace('poId', 'option')}
                  class="w-full mt-4 bg-[var(--s-paywall-btn-bg-color)] text-[var(--s-paywall-btn-text-color)]"
                  variant="primary"
                >
                  {buttonText || t('continue')}
                </Button>
              {/await}
            {/if}
          </Column>
        </Column>
      </div>
    {:else}
      {#if i}
        <hr class={twMerge('w-full border-primary opacity-25')} />
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
            <DescriptionWithReadMore {description} {readMoreLink} {readMoreText} {t} />
          {/if}
        </Column>
        <div class="column-left @md:column-right">
          {#if hasDiscountPrice}
            <div class="text-base font-bold leading-none">
              {discountPrice}
              {currency}
              {#if periodText}
                {' '}/ {periodText}
              {/if}
            </div>
          {/if}
          {#if hasPrice}
            <div
              class={twMerge(
                'text-base font-bold leading-none',
                hasDiscountPrice && 'line-through text-gray-400 text-sm'
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
