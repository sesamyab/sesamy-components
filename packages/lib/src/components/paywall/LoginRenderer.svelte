<script lang="ts">
  import type { SesamyAPI } from '@sesamy/sesamy-js';
  import emailSpellChecker from '@zootools/email-spell-checker';
  import type { TranslationFunction } from '../../i18n';
  import Column from '../Column.svelte';
  import { twMerge } from 'tailwind-merge';
  import type { Paywall } from '../../types/Paywall';
  import Button from '../Button.svelte';
  import Input from '../Input.svelte';
  import InputGroup from '../InputGroup.svelte';
  import Icon from '../Icon.svelte';
  import { hexToHsl } from '../../utils/color';

  type Props = {
    api: SesamyAPI;
    t: TranslationFunction;
    paywall: Paywall;
  };

  let { api, t, paywall }: Props = $props();

  let {
    headline,
    mainColor,
    logoUrl,
    vendorId,
    settings: { useDefaultLogo, styling, loginFields }
  } = paywall;

  let suggestionTimeout: any;
  let emailSuggestion = $state('');
  let email = $state('');
  let firstName = $state('');
  let lastName = $state('');

  const paywallBgColor = styling?.backgroundColor || '#FFFFFF';
  const darkMode = styling?.showBackground && hexToHsl(paywallBgColor)[2] < 50;
  const paywallTextColor = darkMode ? '#FFFFFF' : '#000000';

  let sesamyPaywallDesignTokens = `
    :host * {
      --s-primary-color: var(--sesamy-paywall-primary-color, ${mainColor});
      --s-paywall-bg-color: var(--sesamy-paywall-bg-color, ${paywallBgColor});
      --s-paywall-text-color: var(--sesamy-paywall-text-color, ${paywallTextColor});
      --s-paywall-border-radius: var(--sesamy-paywall-border-radius, 0.5rem);
      --s-paywall-border-radius-desktop: var(--sesamy-paywall-border-radius-desktop, calc(var(--s-paywall-border-radius) * 3));
    }
  `;

  let style = '<sty' + 'le>' + sesamyPaywallDesignTokens + '</style>';

  const provideSuggestion = () => {
    clearTimeout(suggestionTimeout);

    suggestionTimeout = setTimeout(() => {
      emailSuggestion =
        emailSpellChecker.run({
          email
        })?.full || '';
    }, 400);
  };

  const login = async (event: SubmitEvent, api: SesamyAPI) => {
    event.preventDefault();

    try {
      await api.auth.login({
        authorizationParams: {
          login_hint: email,
          metadata: loginFields?.name ? { firstName, lastName } : undefined
        },
        appState: { source: 'registration-wall' }
      });
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
</script>

{#await api.auth.isAuthenticated() then isAuthenticated}
  {#if !isAuthenticated}
    <div class="@container">
      <form onsubmit={(e) => login(e, api)}>
        <Column
          class={twMerge(
            'w-full rounded-[var(--s-paywall-border-radius)] @xl:rounded-[var(--s-paywall-border-radius-desktop)]',
            styling?.showBackground &&
              'bg-[var(--s-paywall-bg-color)] text-[var(--s-paywall-text-color)]',
            styling?.showBackground && styling?.dropShadow && 'shadow-md @xl:shadow-lg',
            darkMode && 'dark'
          )}
        >
          <Column
            class={twMerge(
              'gap-2 @md:gap-4 pt-0 w-full max-w-[800px]',
              styling?.showBackground && 'px-2.5 py-4 @sm:p-8 @sm:pb-10 @3xl:p-16 @3xl:pt-10'
            )}
            up
            left
          >
            <Column left class="w-full gap-6">
              {#if useDefaultLogo}
                <img class="h-7" src={logoUrl} alt={`${t('logo_of')} ${vendorId}`} />
              {/if}
              <Column left class="gap-3">
                <div class="w-full text-2xl @md:text-3xl leading-tight font-bold">
                  {headline}
                </div>
                <svelte:element this={'slot'} name="below-headline" />
              </Column>
            </Column>

            <InputGroup>
              <Input
                onkeyup={provideSuggestion}
                bind:value={email}
                compact
                placeholder={t('email')}
              />
              {#if emailSuggestion}
                <button
                  type="button"
                  class="text-sm gap-1 row"
                  onclick={() => {
                    email = emailSuggestion;
                    emailSuggestion = '';
                  }}
                >
                  <Icon class="text-primary text-xl" name="info" />
                  <span>
                    {t('did_you_mean')}{' '}
                    <span class="text-primary">{emailSuggestion}</span>?
                  </span>
                </button>
              {/if}

              {#if loginFields?.name}
                <Input bind:value={firstName} compact placeholder={t('first_name')} />
                <Input bind:value={lastName} compact placeholder={t('last_name')} />
              {/if}
            </InputGroup>

            <Button type="submit" class="w-full shadow-md">{t('continue')}</Button>
          </Column>
        </Column>
      </form>
    </div>

    {@html style}
  {/if}
{/await}
