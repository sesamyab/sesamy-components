<script lang="ts">
  import { getCountriesOptions } from '../../utils/countries';
  import Button from '../../Button.wc.svelte';
  import type { TranslationFunction } from '../../i18n';
  import Input from '../Input.svelte';
  import InputGroup from '../InputGroup.svelte';
  import Select from '../Select.svelte';

  const countries = getCountriesOptions('sv'); // TODO: grab this from lang preferences (see Base.svelte)

  type Props = {
    t: TranslationFunction;
  };

  let { t }: Props = $props();

  let email = $state('');
  let phoneNumber = $state('');
  let country = $state(countries[0].value);
  let loading = $state(false);

  const goToCheckout = () => {
    alert('Go to checkout');
  };
</script>

<InputGroup>
  <Input bind:value={email} compact placeholder={t('email')} />
  <Select options={countries} bind:value={country} compact placeholder={t('country')} />
  <Input bind:value={phoneNumber} compact placeholder={t('phone_number')} />
</InputGroup>

<Button {loading} disabled={loading} class="mt-2 w-full shadow-md" onclick={goToCheckout}>
  {t('pay_now')}
</Button>
