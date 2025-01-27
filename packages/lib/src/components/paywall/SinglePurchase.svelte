<script lang="ts">
  import type { TranslationFunction } from 'src/i18n';
  import Column from '../Column.svelte';
  import Selection from './Selection.svelte';
  import SelectionGroup from './SelectionGroup.svelte';
  import type { PaywallSinglePurchase } from 'src/types/Paywall';
  import type { PaywallProps } from 'src/types';
  import type { SesamyAPI } from '@sesamy/sesamy-js';

  type Props = {
    api: SesamyAPI;
    t: TranslationFunction;
    singlePurchase: PaywallSinglePurchase;
    selectProduct: Function;
    hasSubscriptions: boolean;
    articleElement: Element | null;
  } & PaywallProps;

  const props: Props = $props();
  let {
    api,
    singlePurchase,
    selectProduct,
    hasSubscriptions,
    articleElement,
    'item-src': itemSrc,
    price,
    currency
  } = props;
  let { title, description } = singlePurchase;

  const getPrice = () => {
    if (articleElement && api.content.get(articleElement)?.price) {
      return api.content.get(articleElement)?.price;
    }
    if (price) {
      return parseFloat(price) || 0;
    }
    return 0;
  };
  const getArticleUrl = () => {
    if (articleElement && api.content.get(articleElement)?.url) {
      return api.content.get(articleElement)?.url;
    }
    return itemSrc;
  };

  const completeAndSelect = () => {
    selectProduct({ ...singlePurchase, price: getPrice(), url: getArticleUrl() });
  };

  if (itemSrc && !hasSubscriptions) {
    completeAndSelect();
  }
</script>

{#if getArticleUrl()}
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
