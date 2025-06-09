<script lang="ts">
  import { getCountriesOptions } from '../../utils/countries';
  import Button from '../../Button.wc.svelte';
  import type { TranslationFunction } from '../../i18n';
  import Input from '../Input.svelte';
  import InputGroup from '../InputGroup.svelte';
  import Select from '../Select.svelte';
  import type { Checkout, SesamyAPI } from '@sesamy/sesamy-js';
  import Selection from './Selection.svelte';
  import SelectionGroup from './SelectionGroup.svelte';
  import PaymentMethod from '../PaymentMethod.svelte';
  import Icon from '../Icon.svelte';
  import Row from '../Row.svelte';
  import { isValidEmail } from '../../utils/email';
  import Error from '../Error.svelte';
  import Column from '../Column.svelte';
  import { isSupportingApplePay, isSupportingGooglePay } from '../../utils/browser-support';
  import emailSpellChecker from '@zootools/email-spell-checker';
  import Accordion from '../Accordion.svelte';
  import { goToCheckout, type PaymentMethodType } from '../../utils/checkout';
  import PaymentMethodLogo from '../PaymentMethodLogo.svelte';

  type Props = {
    api: SesamyAPI;
    t: TranslationFunction;
    checkout: Checkout;
  };

  let { api, t, checkout }: Props = $props();

  const countries = getCountriesOptions(checkout.language).filter((country) => {
    // Filter out countries that are not allowed or blocked by the items in the checkout
    return checkout.items.every((item) => {
      return (
        !item.geoRestrictions ||
        (item.geoRestrictions.type === 'ALLOW' &&
          item.geoRestrictions.countries.includes(country.value)) ||
        (item.geoRestrictions.type === 'BLOCK' &&
          !item.geoRestrictions.countries.includes(country.value))
      );
    });
  }); // TODO: grab this from lang preferences (see Base.svelte)

  let email = $state('');
  let firstName = $state('');
  let lastName = $state('');
  let phoneNumber = $state('');
  let country = $state(checkout.country || 'SE'); // Must provide a fallback value since `Checkout.country` is optional
  let loading = $state(false);
  let errors = $state<{ [key: string]: any }>();
  let paymentMethod = $state<PaymentMethodType>();
  let emailSuggestion = $state('');
  let suggestionTimeout: any;

  $effect(() => {
    (async () => {
      const user = await api.auth.getUser();
      if (!email) {
        email = user?.email || '';
      }
    })();
  });

  const validate = () => {
    const tempErrors = [];

    if (!isValidEmail(email)) {
      tempErrors.push(['email', 'invalid_email']);
    }

    if (
      checkout?.fieldSettings?.phone?.enabled &&
      checkout?.fieldSettings?.phone?.required &&
      !phoneNumber
    ) {
      tempErrors.push(['phoneNumber', 'phone_number_required']);
    }

    if (
      checkout?.fieldSettings?.name?.enabled &&
      checkout?.fieldSettings?.name?.required &&
      !firstName
    ) {
      tempErrors.push(['firstName', 'first_name_required']);
    }

    if (
      checkout?.fieldSettings?.name?.enabled &&
      checkout?.fieldSettings?.name?.required &&
      !lastName
    ) {
      tempErrors.push(['lastName', 'last_name_required']);
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

  const selectPaymentMethod = (option: PaymentMethodType) => (paymentMethod = option);
  const provideSuggestion = () => {
    errors = undefined;
    clearTimeout(suggestionTimeout);

    suggestionTimeout = setTimeout(() => {
      emailSuggestion =
        emailSpellChecker.run({
          email
        })?.full || '';
    }, 400);
  };

  const onSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    validate();
    if (errors) return;
    if (!paymentMethod) return;
    loading = true;

    try {
      const isWallet = ['GOOGLE-PAY', 'APPLE-PAY'].includes(paymentMethod.method);

      await api.checkouts.update(checkout.id, {
        paymentData: {
          provider: paymentMethod.provider,
          // Need to set CARD for Google Pay and Apple Pay
          method: isWallet ? 'CARD' : paymentMethod.method
        },
        email
      });

      goToCheckout(checkout, paymentMethod);
      return;
    } catch (err: any) {
      if (err?.message?.includes('User already owns item')) {
        errors = { general: 'user_already_owns_item' };
      } else {
        console.error(err);
        errors = { general: 'something_went_wrong' };
      }
      loading = false;
      return;
    }
  };

  const paymentMethods = checkout.availablePaymentMethods
    .filter(({ provider }) => !['DUMMY', 'SESAMY', 'BILLOGRAM'].includes(provider))
    .reduce(
      (acc, { provider, methods }) => [
        ...acc,
        ...(methods?.length
          ? methods.map((method) => ({
              provider,
              method
            }))
          : [])
      ],
      [] as PaymentMethodType[]
    );

  isSupportingGooglePay() && paymentMethods.push({ provider: 'STRIPE', method: 'GOOGLE-PAY' });
  isSupportingApplePay() && paymentMethods.push({ provider: 'STRIPE', method: 'APPLE-PAY' });

  paymentMethods.length && selectPaymentMethod(paymentMethods[0]);
</script>

<form class="contents" onsubmit={onSubmit}>
  <InputGroup>
    <Input
      onkeyup={provideSuggestion}
      bind:value={email}
      name="email"
      compact
      placeholder={t('email')}
      hasError={errors?.email}
    />
    <Accordion isOpen={!!emailSuggestion}>
      <Row
        onclick={() => {
          email = emailSuggestion;
          emailSuggestion = '';
        }}
        class="bg-primary/10 gap-4 px-2 py-3 !justify-between active:bg-primary/10 text-sm border-x border-gray-200 text-gray-500 hover:cursor-pointer hover:bg-primary/15 transition-colors duration-75"
      >
        <Row class="gap-2">
          <Icon class="text-primary text-xl" name="info" />
          <div>
            {t('did_you_mean')}
            <span class="text-primary">{emailSuggestion}</span>?
          </div>
        </Row>
        <div class="text-center whitespace-nowrap">
          {t('click_to_update')}
        </div>
      </Row>
    </Accordion>
    <Select
      options={countries}
      bind:value={country}
      name="country"
      compact
      placeholder={t('country')}
    />
    {#if checkout?.fieldSettings?.phone?.enabled}
      <Input
        onkeyup={() => (errors = undefined)}
        bind:value={phoneNumber}
        name="tel"
        compact
        placeholder={t('phone_number')}
        hasError={errors?.phoneNumber}
      />
    {/if}
    {#if checkout?.fieldSettings?.name?.enabled}
      <Input
        onkeyup={() => (errors = undefined)}
        bind:value={firstName}
        name="first-name"
        compact
        placeholder={t('first_name')}
        hasError={errors?.firstName}
      />
      <Input
        onkeyup={() => (errors = undefined)}
        bind:value={lastName}
        name="last-name"
        compact
        placeholder={t('last_name')}
        hasError={errors?.lastName}
      />
    {/if}
  </InputGroup>

  <div class="grid grid-cols-2 w-full gap-2 auto-rows-fr">
    {#each paymentMethods as paymentMethod, i (`${paymentMethod.provider}-${paymentMethod.method}`)}
      {@const { provider, method } = paymentMethod}
      <SelectionGroup>
        <Selection
          checked={!i}
          id={`${provider}-${method}`}
          name="payment-method"
          onchange={() => selectPaymentMethod(paymentMethod)}
        >
          <Row class="w-full !justify-between">
            {#if method === 'CARD'}
              <Icon name="card" class="text-2xl" />
            {:else}
              <div>
                <PaymentMethodLogo {method} width="auto" height="25" />
              </div>
            {/if}
            {#if method && ['CARD', 'GOOGLE-PAY', 'APPLE-PAY'].includes(method)}
              <div class="gap-1 hidden @xl:row-left">
                <PaymentMethod size="sm" name="visa" />
                <PaymentMethod size="sm" name="amex" />
                <PaymentMethod size="sm" name="mastercard" />
              </div>
            {/if}
          </Row>
        </Selection>
      </SelectionGroup>
    {/each}
  </div>

  <Button {loading} disabled={loading} class="mt-2 w-full shadow-md" type="submit">
    {t('pay_now')}
  </Button>
</form>

{#if errors}
  <Column left>
    {#each Object.values(errors) as error}
      <Error text={t(error)} />
    {/each}
  </Column>
{/if}
