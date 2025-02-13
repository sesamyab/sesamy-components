<svelte:options customElement="sesamy-link" />

<script lang="ts">
  import { getApi } from './api';
  import initTranslator from './i18n';

  let { target, lang }: { target: 'login' | 'logout' | 'account'; lang?: string } = $props();

  const htmlLocale = document.querySelector('html')?.getAttribute('lang');
  const htmlLang = htmlLocale?.split('-')[0];
  const t = initTranslator(lang || htmlLang || 'en');

  const login = async () => {
    try {
      const api = await getApi();
      await api.auth.loginWithRedirect();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
  const logout = async () => {
    try {
      const api = await getApi();
      await api.auth.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  const goToAccount = async () => {
    try {
      const api = await getApi();
      const accountUrl = await api.generateLink({ target: 'account' });
      window.location.href = accountUrl;
    } catch (error) {
      console.error('Error getting account link:', error);
    }
  };
</script>

{#if target === 'login'}
  <sesamy-visibility>
    <span
      slot="not-logged-in"
      role="button"
      tabindex="0"
      onclick={login}
      onkeydown={(e: KeyboardEvent) => e.key === 'Enter' && login()}
      aria-label={t('login')}
    >
      <slot>{t('login')}</slot>
    </span>
  </sesamy-visibility>
{:else if target === 'logout'}
  <sesamy-visibility>
    <span
      slot="logged-in"
      role="button"
      tabindex="0"
      onclick={logout}
      onkeydown={(e: KeyboardEvent) => e.key === 'Enter' && logout()}
      aria-label={t('logout')}
    >
      <slot>{t('logout')}</slot>
    </span>
  </sesamy-visibility>
{:else if target === 'account'}
  <sesamy-visibility>
    <span
      slot="logged-in"
      role="button"
      tabindex="0"
      onclick={goToAccount}
      onkeydown={(e: KeyboardEvent) => e.key === 'Enter' && goToAccount()}
      aria-label={t('my_account')}
    >
      <slot>{t('my_account')}</slot>
    </span>
  </sesamy-visibility>
{/if}
