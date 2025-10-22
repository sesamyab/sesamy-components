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
  import { twMerge } from 'tailwind-merge';
  import BirthDateInput from '../BirthDateInput.svelte';
  import { PAYMENT_METHODS_SORT_ORDER } from '../../constants/payment-methods';

  type Props = {
    api: SesamyAPI;
    t: TranslationFunction;
    checkout: Checkout;
    onResetCheckout: () => void;
  };

  let { api, t, checkout, onResetCheckout }: Props = $props();

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
  let birthYear = $state('');
  let birthMonth = $state('');
  let birthDay = $state('');
  let loading = $state(false);
  let errors = $state<{ [key: string]: any }>();
  let paymentMethod = $state<PaymentMethodType>();
  let emailSuggestion = $state('');
  let suggestionTimeout: any;
  let gotReferral = $state(false);
  let referralEmail = $state('');

  $effect(() => {
    if (!countries.map((c) => c.value).includes(country)) {
      country = countries[0]?.value; // Fallback to the first country if the geo country is not allowed
    }
  });

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

    if (gotReferral && !isValidEmail(referralEmail)) {
      tempErrors.push(['referralEmail', 'referral_email_required']);
    }

    // Validate date of birth
    const currentYear = new Date().getFullYear();
    const year = parseInt(birthYear);
    const month = parseInt(birthMonth);
    const day = parseInt(birthDay);
    if (birthYear && (isNaN(year) || year < 1900 || year > currentYear)) {
      tempErrors.push(['birthYear', 'invalid_birth_year']);
    }
    if (birthMonth && (isNaN(month) || month < 1 || month > 12)) {
      tempErrors.push(['birthMonth', 'invalid_birth_month']);
    }
    if (birthDay && (isNaN(day) || day < 1 || day > 31)) {
      tempErrors.push(['birthDay', 'invalid_birth_day']);
    }
    if (checkout.fieldSettings?.birthdate?.enabled && checkout.fieldSettings?.birthdate?.required) {
      if (!birthYear || !birthMonth || !birthDay) {
        tempErrors.push(['birthDate', 'birthdate_required']);
      }
    }

    errors = tempErrors.length
      ? tempErrors.reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
      : undefined;
  };

  const selectPaymentMethod = (option: PaymentMethodType) => (paymentMethod = option);
  const provideSuggestion = () => {
    errors = undefined;
    clearTimeout(suggestionTimeout);

    suggestionTimeout = setTimeout(() => {
      emailSuggestion = emailSpellChecker.run({ email })?.full || '';
    }, 400);
  };

  const onSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    validate();
    if (errors || !paymentMethod) {
      return;
    }

    api.events.emit('sesamyPaywallCheckoutRedirect', {
      checkoutId: checkout.id,
      country,
      paymentMethod
    });

    loading = true;

    try {
      const isWallet = ['GOOGLE-PAY', 'APPLE-PAY'].includes(paymentMethod.method);

      const birthDate =
        birthYear && birthMonth && birthDay
          ? `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`
          : undefined;

      await api.checkouts.update(checkout.id, {
        paymentData: {
          provider: paymentMethod.provider,
          // Need to set CARD for Google Pay and Apple Pay
          method: isWallet ? 'CARD' : paymentMethod.method
        },
        country,
        email,
        phoneNumber: phoneNumber || undefined,
        givenName: firstName || undefined,
        familyName: lastName || undefined,
        birthDate,
        referralEmail: gotReferral ? referralEmail : undefined
      });

      goToCheckout(checkout, paymentMethod);
      loading = false;
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

  const paymentMethods = checkout.availablePaymentMethods.reduce(
    (acc, { provider, methods }) => [
      ...acc,
      ...(methods?.length ? methods.map((method) => ({ provider, method })) : [])
    ],
    [] as PaymentMethodType[]
  );

  // Add wallet payment methods if supported by browser
  if (isSupportingGooglePay()) {
    paymentMethods.push({ provider: 'STRIPE', method: 'GOOGLE-PAY' });
  }
  if (isSupportingApplePay()) {
    paymentMethods.push({ provider: 'STRIPE', method: 'APPLE-PAY' });
  }

  // Remove KLARNA_PRIVATE if both STRIPE_KLARNA and KLARNA_PRIVATE are present
  const hasStripeKlarna = paymentMethods.some((pm) => pm.method === 'STRIPE_KLARNA');
  const hasKlarnaPrivate = paymentMethods.some((pm) => pm.method === 'KLARNA_PRIVATE');
  if (hasStripeKlarna && hasKlarnaPrivate) {
    const klarnaPrivateIndex = paymentMethods.findIndex((pm) => pm.method === 'KLARNA_PRIVATE');
    if (klarnaPrivateIndex !== -1) {
      paymentMethods.splice(klarnaPrivateIndex, 1);
    }
  }

  // Filter and sort payment methods according to PAYMENT_METHODS_SORT_ORDER
  const sortedPaymentMethods = PAYMENT_METHODS_SORT_ORDER.map((method) =>
    paymentMethods.find((pm) => pm.method === method)
  ).filter((pm) => pm !== undefined) as PaymentMethodType[];

  sortedPaymentMethods.length && selectPaymentMethod(sortedPaymentMethods[0]);
</script>

<form class="contents" onsubmit={onSubmit}>
  <Column up left class="gap-2 w-full">
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
        autocomplete="country"
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

    {#if checkout?.fieldSettings?.birthdate?.enabled}
      <BirthDateInput
        {t}
        bind:year={birthYear}
        bind:month={birthMonth}
        bind:day={birthDay}
        hasError={errors?.birthYear || errors?.birthMonth || errors?.birthDay || errors?.birthDate}
        onYearChange={() => (errors = undefined)}
        onMonthChange={() => (errors = undefined)}
        onDayChange={() => (errors = undefined)}
      />
    {/if}

    {#if checkout?.fieldSettings?.referral?.enabled}
      <div class="w-full">
        <div
          class={twMerge(
            'bg-white rounded-md border border-gray-200 dark:bg-black/25 dark:border-gray-700',
            gotReferral && 'rounded-b-none'
          )}
        >
          <Selection
            id="got-referred"
            name="got-referred"
            type="checkbox"
            checked={gotReferral}
            onchange={(e: Event) => {
              const target = e.target as HTMLInputElement;
              gotReferral = target.checked;
            }}
          >
            <span class="text-sm">{t('got_referred')}</span>
          </Selection>
        </div>

        <Accordion isOpen={gotReferral}>
          <Input
            bind:value={referralEmail}
            name="referral-email"
            compact
            placeholder={t('referral_email')}
            class="rounded-t-none -mt-px"
            hasError={errors?.referralEmail}
            onkeyup={() => (errors = undefined)}
          />
        </Accordion>
      </div>
    {/if}
  </Column>

  <div class="grid grid-cols-2 w-full gap-2 auto-rows-fr">
    {#each sortedPaymentMethods as paymentMethod, i (`${paymentMethod.provider}-${paymentMethod.method}`)}
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
                <PaymentMethodLogo {method} width="auto" height="25" darkModeSupport={true} />
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

  <Button
    {loading}
    disabled={loading}
    class="mt-2 w-full shadow-md bg-[var(--s-paywall-btn-bg-color)] text-[var(--s-paywall-btn-text-color)]"
    type="submit"
  >
    {t('pay_now')}
  </Button>
  <button
    type="button"
    onclick={onResetCheckout}
    class="text-sm font-bold mx-auto hover:underline p-1 row gap-1"
  >
    <Icon name="chevron-left" class="text-[8px]" />
    <span>{t('go_back')}</span>
  </button>
</form>

{#if errors}
  <Column left>
    {#each Object.values(errors) as error}
      <Error text={t(error)} />
    {/each}
  </Column>
{/if}
