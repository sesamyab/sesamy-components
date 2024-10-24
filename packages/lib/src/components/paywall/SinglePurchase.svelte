<script lang="ts">
  import type { TranslationFunction } from 'src/i18n';
  import Column from '../Column.svelte';
  import PurchaseOption from './Selection.svelte';
  import PurchaseOptions from './SelectionGroup.svelte';

  type Props = {
    t: TranslationFunction;
    singlePurchase: any;
    selectProduct: Function;
  };

  let { singlePurchase, selectProduct }: Props = $props();
  let { title, description } = singlePurchase;
</script>

<PurchaseOptions>
  <PurchaseOption id="five" name="purchase-option" onchange={() => selectProduct(singlePurchase)}>
    <Column left>
      <div class="text-base font-bold">{title}</div>
      <div class="text-sm">
        {description}
      </div>
    </Column>
    <div class="text-base font-bold">TODO</div>
  </PurchaseOption>
</PurchaseOptions>
