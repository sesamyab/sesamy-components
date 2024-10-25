<script lang="ts">
  import type { TranslationFunction } from 'src/i18n';
  import Column from '../Column.svelte';
  import PurchaseOption from './Selection.svelte';
  import PurchaseOptions from './SelectionGroup.svelte';
  import type { PaywallSinglePurchase } from 'src/types/Paywall';

  type Props = {
    t: TranslationFunction;
    singlePurchase: PaywallSinglePurchase;
    selectProduct: Function;
  };

  let { singlePurchase, selectProduct }: Props = $props();
  let { title, description } = singlePurchase;

  const completeAndSelect = (singlePurchase: PaywallSinglePurchase) => {
    selectProduct({ ...singlePurchase, price, currency, url: '' });
  };

  // TODO: final implementation?
  let price = (document.querySelector('meta[property="sesamy:price"]') as HTMLMetaElement)?.content;
  let currency = (document.querySelector('meta[property="sesamy:currency"]') as HTMLMetaElement)
    ?.content;
</script>

<PurchaseOptions>
  <PurchaseOption
    id="single-purchase"
    name="purchase-option"
    onchange={() => completeAndSelect(singlePurchase)}
  >
    <Column left>
      <div class="text-base font-bold">{title}</div>
      <div class="text-sm">
        {description}
      </div>
    </Column>
    <div class="text-base font-bold">{price} {currency}</div>
  </PurchaseOption>
</PurchaseOptions>
