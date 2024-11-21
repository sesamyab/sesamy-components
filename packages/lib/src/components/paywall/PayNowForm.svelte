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
  import { isSupportingApplePay, isSupportingGooglePay } from '../../utils/browser-support';
  import type { SesamyAPI } from '@sesamy/sesamy-js';
  import emailSpellChecker from '@zootools/email-spell-checker';
  import Accordion from '../Accordion.svelte';

  // TODO: can we these dynamic (.com if built for prod, .dev if ran on local/preview)
  const CHECKOUT_URL = 'https://checkout3.sesamy.dev';

  type Props = {
    api: SesamyAPI;
    t: TranslationFunction;
    checkout: Checkout & {
      // TODO: this should be set on Checkout type in sesamy-js
      settings?: {
        name?: {
          enabled: boolean;
          required: boolean;
        };
        phone?: {
          enabled: boolean;
          required: boolean;
        };
      };
    };
  };

  type PaymentMethod = {
    provider: string;
    method?: string;
    icon: IconName;
  };

  let { api, t, checkout }: Props = $props();

  const countries = getCountriesOptions(checkout.language); // TODO: grab this from lang preferences (see Base.svelte)

  let email = $state('');
  let firstName = $state('');
  let lastName = $state('');
  let phoneNumber = $state('');
  let country = $state(checkout.country || 'SE'); // Must provide a fallback value since `Checkout.country` is optional
  let loading = $state(false);
  let errors = $state<{ [key: string]: any }>();
  let paymentMethod = $state<PaymentMethod>();
  let emailSuggestion = $state('');
  let suggestionTimeout: any;

  const validate = () => {
    const tempErrors = [];

    if (!isValidEmail(email)) {
      tempErrors.push(['email', 'invalid_email']);
    }

    if (checkout?.settings?.phone?.enabled && checkout?.settings?.phone?.required && !phoneNumber) {
      tempErrors.push(['phoneNumber', 'phone_number_required']);
    }

    if (checkout?.settings?.name?.enabled && checkout?.settings?.name?.required && !firstName) {
      tempErrors.push(['firstName', 'first_name_required']);
    }

    if (checkout?.settings?.name?.enabled && checkout?.settings?.name?.required && !lastName) {
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

  const selectPaymentMethod = (option: PaymentMethod) => (paymentMethod = option);
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

  const goToCheckout = async (e: SubmitEvent) => {
    e.preventDefault();
    validate();
    if (errors) return;
    if (!paymentMethod) return;
    loading = true;

    try {
      await api.checkouts.update(checkout.id, {
        paymentData: {
          provider: paymentMethod.provider, // TODO: update sesamy-js when this prop is included (and no red squiggly)
          method: paymentMethod.method
        },
        email
      });

      const checkoutURL = new URL(CHECKOUT_URL);

      checkoutURL.pathname = checkout.id;
      checkoutURL.searchParams.set('norecreate', 'true');
      checkoutURL.searchParams.set('lang', checkout.language);
      checkoutURL.searchParams.set('redirect-url', checkout.redirectUrl);

      window.location.href = checkoutURL.href;
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
              method,
              icon: method.toLocaleLowerCase() as IconName
            }))
          : [])
      ],
      [] as PaymentMethod[]
    );

  isSupportingGooglePay() &&
    paymentMethods.push({ provider: 'STRIPE', method: 'GOOGLE-PAY', icon: 'google-pay' });

  isSupportingApplePay() &&
    paymentMethods.push({ provider: 'STRIPE', method: 'APPLE-PAY', icon: 'apple-pay' });

  paymentMethods.length && selectPaymentMethod(paymentMethods[0]);
</script>

<form class="contents" onsubmit={goToCheckout}>
  <InputGroup>
    <Input
      onkeyup={provideSuggestion}
      bind:value={email}
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
    <Select options={countries} bind:value={country} compact placeholder={t('country')} />
    {#if checkout?.settings?.phone?.enabled}
      <Input
        onkeyup={() => (errors = undefined)}
        bind:value={phoneNumber}
        compact
        placeholder={t('phone_number')}
        hasError={errors?.phoneNumber}
      />
    {/if}
    {#if checkout?.settings?.name?.enabled}
      <Input
        onkeyup={() => (errors = undefined)}
        bind:value={firstName}
        compact
        placeholder={t('first_name')}
        hasError={errors?.firstName}
      />
    {/if}
    {#if checkout?.settings?.name?.enabled}
      <Input
        onkeyup={() => (errors = undefined)}
        bind:value={lastName}
        compact
        placeholder={t('last_name')}
        hasError={errors?.lastName}
      />
    {/if}
  </InputGroup>

  <div class="grid grid-cols-2 w-full gap-2 auto-rows-fr">
    {#each paymentMethods as paymentMethod, i (`${paymentMethod.provider}-${paymentMethod.method}`)}
      {@const { provider, method, icon } = paymentMethod}
      <SelectionGroup>
        <Selection
          checked={!i}
          id={`${provider}-${method}`}
          name="payment-method"
          onchange={() => selectPaymentMethod(paymentMethod)}
        >
          <Row class="w-16" left>
            <Icon class="text-3xl" multiColor name={icon} />
          </Row>
          {#if method && ['CARD', 'GOOGLE-PAY', 'APPLE-PAY'].includes(method)}
            <div class="gap-1 hidden @xl:row-left">
              <PaymentMethod size="sm" name="visa" />
              <PaymentMethod size="sm" name="amex" />
              <PaymentMethod size="sm" name="mastercard" />
            </div>
          {/if}
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
