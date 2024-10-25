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
  import Error from '../Error.svelte';
  import Column from '../Column.svelte';

  // TODO: can we these dynamic (.com if built for prod, .dev if ran on local/preview)
  const API_URL = 'https://api.sesamy.dev';
  const CHECKOUT_URL = 'https://checkout3.sesamy.dev';

  type Props = {
    t: TranslationFunction;
    checkout: Checkout;
  };

  type PaymentMethod = {
    provider: string;
    method?: string;
    icon: IconName;
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
  let paymentMethod = $state<PaymentMethod>();

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

  const selectPaymentMethod = (option: PaymentMethod) => (paymentMethod = option);

  const goToCheckout = async () => {
    validate();
    if (errors) return;
    if (!paymentMethod) return;
    loading = true;

    try {
      await fetch(`${API_URL}/checkout/${checkout.id}/paymentMethod`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: paymentMethod.provider,
          method: paymentMethod.method
        })
      });

      const checkoutURL = new URL(CHECKOUT_URL);

      checkoutURL.searchParams.set('norecreate', 'true');
      checkoutURL.searchParams.set('lang', checkout.language);
      checkoutURL.searchParams.set('redirect-url', checkout.redirectUrl);

      const path = [checkout.vendorId, checkout.id]; // TODO: need `vendorId`
      if (paymentMethod.method === 'GOOGLE-PAY' || paymentMethod.method === 'APPLE-PAY') {
        path.push('summary');
        checkoutURL.searchParams.set('paymentMethod', paymentMethod.method);
      } else if (paymentMethod.method === 'CARD') {
        path.push('card');
      } else {
        path.push('summary');
      }

      checkoutURL.pathname = path.join('/');
      window.location.href = checkoutURL.href;
      return;
    } catch (err) {
      console.error(err);
      errors = { general: 'something_went_wrong' };
      loading = false;
      return;
    }
  };

  const paymentMethods = checkout.availablePaymentMethods
    .filter(({ provider }) => !['DUMMY', 'SESAMY', 'BILLOGRAM'].includes(provider))
    .reduce(
      (acc, { provider, methods }) => [
        ...acc,
        ...(methods.length
          ? methods.map((method) => ({
              provider,
              method,
              icon: method.toLocaleLowerCase() as IconName
            }))
          : [{ provider, method: undefined, icon: provider.toLocaleLowerCase() as IconName }])
      ],
      [] as PaymentMethod[]
    )
    .filter(({ method }) => method !== 'SWISH');

  /Chrome/.test(navigator?.userAgent) &&
    !/Edge|OPR/.test(navigator?.userAgent) &&
    paymentMethods.push({ provider: 'STRIPE', method: 'GOOGLE-PAY', icon: 'google-pay' });

  window?.ApplePaySession &&
    paymentMethods.push({ provider: 'STRIPE', method: 'APPLE-PAY', icon: 'apple-pay' });

  paymentMethods.length && selectPaymentMethod(paymentMethods[0]);
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
  {#each paymentMethods as paymentMethod, i (`${paymentMethod.provider}-${paymentMethod.method}`)}
    {@const { provider, method, icon } = paymentMethod}
    <SelectionGroup>
      <Selection
        checked={!i}
        id={method}
        name="payment-method"
        onchange={() => selectPaymentMethod(paymentMethod)}
      >
        <Row class="w-16" left>
          <Icon class="text-3xl" multiColor name={icon} />
        </Row>
        {#if method && ['CARD', 'GOOGLE-PAY', 'APPLE-PAY'].includes(method)}
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

{#if errors}
  <Column left>
    {#each Object.values(errors) as error}
      <Error text={t(error)} />
    {/each}
  </Column>
{/if}
