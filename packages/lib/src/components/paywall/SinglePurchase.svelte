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
    singlePurchasePrice: number;
    articleUrl: string;
  } & PaywallProps;

  const props: Props = $props();
  let {
    singlePurchase,
    selectProduct,
    hasSubscriptions,
    articleUrl,
    singlePurchasePrice,
    currency
  } = props;
  let { title, description } = singlePurchase;

  const completeAndSelect = () => {
    selectProduct({ ...singlePurchase, price: singlePurchasePrice, url: articleUrl });
  };

  if (articleUrl && !hasSubscriptions) {
    completeAndSelect();
  }
</script>

{#if articleUrl}
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
      <div class="text-base font-bold">{singlePurchasePrice} {currency}</div>
    </Selection>
  </SelectionGroup>
{/if}
