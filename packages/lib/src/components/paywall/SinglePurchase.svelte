<script lang="ts">
  import type { TranslationFunction } from 'src/i18n';
  import Column from '../Column.svelte';
  import Selection from './Selection.svelte';
  import SelectionGroup from './SelectionGroup.svelte';
  import type { PaywallSinglePurchase } from 'src/types/Paywall';
  import type { PaywallProps } from 'src/types';

  type Props = {
    t: TranslationFunction;
    singlePurchase: PaywallSinglePurchase;
    selectProduct: Function;
    hasSubscriptions: boolean;
  } & PaywallProps;

  let {
    singlePurchase,
    selectProduct,
    hasSubscriptions,
    'item-src': itemSrc,
    price,
    currency
  }: Props = $props();
  let { title, description } = singlePurchase;

  const completeAndSelect = () => {
    const parsedPrice = price ? parseFloat(price) : 0;
    selectProduct({ ...singlePurchase, price: parsedPrice, url: itemSrc });
  };

  // TODO: replace with sesamy-js logic
  if (!price)
    price = (document.querySelector('meta[property="sesamy:price"]') as HTMLMetaElement)?.content;
  if (!currency)
    currency = (document.querySelector('meta[property="sesamy:currency"]') as HTMLMetaElement)
      ?.content;
  if (!itemSrc)
    itemSrc = (document.querySelector('meta[property="sesamy:item-src"]') as HTMLMetaElement)
      ?.content;

  if (itemSrc && !hasSubscriptions) {
    completeAndSelect();
  }
</script>

{#if itemSrc}
  <SelectionGroup>
    <Selection
      id="single-purchase"
      name="purchase-option"
      class="gap-2 @md:gap-4"
      checked={!hasSubscriptions}
      onchange={completeAndSelect}
    >
      <Column left>
        <div class="text-base font-bold leading-tight">{title}</div>
        <div class="text-sm">
          {description}
        </div>
      </Column>
      <div class="text-base font-bold">{price} {currency}</div>
    </Selection>
  </SelectionGroup>
{/if}
