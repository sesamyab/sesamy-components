<script lang="ts">
  import { getCountriesOptions } from '../../utils/countries';
  import Button from '../../Button.wc.svelte';
  import type { TranslationFunction } from '../../i18n';
  import Input from '../Input.svelte';
  import InputGroup from '../InputGroup.svelte';
  import Select from '../Select.svelte';
  import type { Checkout } from '@sesamy/sesamy-js';
  import Selection from './Selection.svelte';
  import SelectionGroup from './SelectionGroup.svelte';
  import PaymentMethod from '../PaymentMethod.svelte';
  import type { IconName } from '../../icons/types';
  import Icon from '../Icon.svelte';
  import Row from '../Row.svelte';
  import { isValidEmail } from '../../utils/email';

  type Props = {
    t: TranslationFunction;
    checkout: Checkout;
  };

  let { t }: Props = $props();
  const checkout = {
    id: 'a4b11ff4-eae6-4281-8202-6a5033548772',
    items: [
      {
        sku: 'sid:a1tdI9vbB6AEPhICVGQqD',
        title: 'Physical Bundle',
        purchaseOptionId: 'TNbgcuG_7XHXgatiAH9d3',
        cover: 'https://sesamy.com/'
      }
    ],
    address: {},
    isBusiness: false,
    status: 'PENDING',
    type: 'SINGLE',
    price: 100,
    currency: 'SEK',
    itemsOwned: [],
    appliedDiscountCodes: [],
    availablePaymentMethods: [
      {
        provider: 'KLARNA',
        methods: []
      },
      {
        provider: 'STRIPE',
        methods: ['CARD', 'SWISH']
      },
      {
        provider: 'BILLOGRAM',
        methods: []
      },
      {
        provider: 'SESAMY',
        methods: []
      },
      {
        provider: 'VIPPS',
        methods: []
      },
      {
        provider: 'DUMMY',
        methods: ['FREE', 'TEST']
      }
    ],
    country: 'SE',
    language: 'en',
    createdAt: '2024-10-24T12:00:59.835Z',
    updatedAt: '2024-10-24T12:00:59.835Z',
    checkoutUrl: 'https://checkout.sesamy.dev/checkouts/a4b11ff4-eae6-4281-8202-6a5033548772',
    redirectUrl: 'http://localhost:5173/'
  };

  const countries = getCountriesOptions(checkout.language); // TODO: grab this from lang preferences (see Base.svelte)

  let email = $state('');
  let phoneNumber = $state('');
  let country = $state(checkout.country);
  let loading = $state(false);
  let errors = $state<{ [key: string]: any }>();

  const validate = () => {
    const tempErrors = [];

    if (!isValidEmail(email)) {
      tempErrors.push(['email', 'invalid_email']);
    }

    if (!phoneNumber) {
      tempErrors.push(['phoneNumber', 'phone_number_required']);
    }

    errors = tempErrors.length
      ? tempErrors.reduce(
          (acc, [key, value]) => ({
            ...acc,
            [key]: value
          }),
          {}
        )
      : undefined;
  };

  const goToCheckout = () => {
    validate();
    if (errors) return;

    alert('Go to checkout');
  };

  const paymentMethods = checkout.availablePaymentMethods
    .filter(({ provider }) => !['DUMMY', 'SESAMY', 'BILLOGRAM'].includes(provider))
    .reduce(
      (acc, { provider, methods }) => [...acc, ...(methods.length ? methods : [provider])],
      [] as string[]
    )
    .map((paymentMethod) => paymentMethod.toLocaleLowerCase());

  // TODO: add these programatically
  paymentMethods.push('google-pay');
  paymentMethods.push('apple-pay');
</script>

<InputGroup>
  <Input
    onkeyup={() => (errors = undefined)}
    bind:value={email}
    compact
    placeholder={t('email')}
    hasError={errors?.email}
  />
  <Select options={countries} bind:value={country} compact placeholder={t('country')} />
  <Input
    onkeyup={() => (errors = undefined)}
    bind:value={phoneNumber}
    compact
    placeholder={t('phone_number')}
    hasError={errors?.phoneNumber}
  />
</InputGroup>

<div class="grid grid-cols-2 w-full gap-2 auto-rows-fr">
  {#each paymentMethods as paymentMethod, i (paymentMethod)}
    <SelectionGroup>
      <Selection checked={!i} id={paymentMethod} name="payment-method">
        <Icon multiColor name={paymentMethod as IconName} />
        {#if ['card', 'google-pay', 'apple-pay'].includes(paymentMethod)}
          <Row class="gap-1">
            <PaymentMethod size="sm" name="visa" />
            <PaymentMethod size="sm" name="amex" />
            <PaymentMethod size="sm" name="mastercard" />
          </Row>
        {/if}
      </Selection>
    </SelectionGroup>
  {/each}
</div>

<Button {loading} disabled={loading} class="mt-2 w-full shadow-md" onclick={goToCheckout}>
  {t('pay_now')}
</Button>

<pre class="text-xs">
  {JSON.stringify(checkout, null, 2)}
</pre>
