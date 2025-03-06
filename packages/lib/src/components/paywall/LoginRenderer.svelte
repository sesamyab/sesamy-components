<script lang="ts">
  import type { SesamyAPI } from '@sesamy/sesamy-js';
  import emailSpellChecker from '@zootools/email-spell-checker';
  import type { TranslationFunction } from 'src/i18n';
  import Column from '../Column.svelte';
  import Row from '../Row.svelte';
  import { twMerge } from 'tailwind-merge';
  import type { Paywall } from 'src/types/Paywall';
  import Button from '../Button.svelte';
  import Input from '../Input.svelte';
  import Error from '../Error.svelte';
  import Accordion from '../Accordion.svelte';
  import Icon from '../Icon.svelte';

  type Props = {
    api: SesamyAPI;
    t: TranslationFunction;
    paywall: Paywall;
  };

  let { api, t, paywall }: Props = $props();

  let {
    headline,
    logoUrl,
    vendorId,
    settings: { useDefaultLogo }
  } = paywall;

  let suggestionTimeout: any;
  let emailSuggestion = $state('');
  let email = $state('');

  const provideSuggestion = () => {
    clearTimeout(suggestionTimeout);

    suggestionTimeout = setTimeout(() => {
      emailSuggestion =
        emailSpellChecker.run({
          email
        })?.full || '';
    }, 400);
  };

  const login = async (api: SesamyAPI) => {
    try {
      // TODO: Pass the email here which isn't supported in sesamy-js yet
      await api.auth.loginWithRedirect();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
</script>

<Column>
  <Row class="text-sm gap-1 font-bold w-full">
    <div>
      {t('already_subscribing')}
    </div>

    <sesamy-login
      class="p-0 border-none enabled:hover:bg-transparent hover:underline text-primary font-bold"
    ></sesamy-login>
  </Row>
  <div
    class="w-full h-px from-transparent bg-gradient-to-r to-transparent via-primary opacity-30"
  ></div>
  <div class={twMerge('w-full pt-2 @md:pt-4')}>
    {#if useDefaultLogo}
      <img class="h-7 mb-6" src={logoUrl} alt={`${t('logo_of')} ${vendorId}`} />
    {/if}
    <div class="text-2xl leading-tight @md:text-3xl font-bold max-w-[600px]">
      {headline}
    </div>
  </div>

  <Row>
    <Input onkeyup={provideSuggestion} bind:value={email} compact placeholder={t('email')} />
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
  </Row>
  <Row>
    <Button onclick={() => login(api)} class="mt-2 w-full shadow-md">{t('continue')}</Button>
  </Row>
</Column>
