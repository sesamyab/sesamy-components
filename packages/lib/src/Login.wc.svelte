<svelte:options customElement="sesamy-login" />

<script lang="ts">
  import type { Profile, SesamyAPI } from '@sesamy/sesamy-js';
  import Avatar from './Avatar.wc.svelte';
  import Base from './Base.svelte';
  import type { LoginProps } from './types';
  import Button from './components/Button.svelte';
  import { twMerge } from 'tailwind-merge';

  let {
    loading,
    loggedIn,
    userAvatar,
    class: classes = ''
  }: LoginProps & { class?: string } = $props();

  let disabled = $state(false);
  let showPopupMenu = $state(false);
  let user = $state<Profile | null>(null);
  let accountLink = $state<string | null>(null);

  const login = async (api: SesamyAPI) => {
    disabled = true;
    try {
      await api.auth.loginWithRedirect();
    } catch (error) {
      disabled = false;
      console.error('Login failed:', error);
    }
  };

  const logout = async (api: SesamyAPI) => {
    loading = true;
    try {
      await api.auth.logout();
      loggedIn = false;
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const checkLoggedIn = async (api: SesamyAPI) => {
    try {
      loggedIn = await api.auth.isAuthenticated();
      if (loggedIn) {
        user = await api.auth.getUser();
        userAvatar = user?.picture || '';
        accountLink = await api.generateLink({ target: 'account' });
      }
    } catch (error) {
      console.error('Error checking login status:', error);
    }
  };
</script>

<Base let:api let:t>
  {#await checkLoggedIn(api)}
    <Avatar loading={true} size="sm"></Avatar>
  {:then _}
    {#if loggedIn}
      <div class="relative">
        <button
          class="block"
          onclick={() => (showPopupMenu = !showPopupMenu)}
          disabled={loading}
          aria-haspopup="true"
          aria-expanded={showPopupMenu}
        >
          <slot name="avatar">
            <Avatar src={userAvatar} {loading} size="sm"></Avatar>
          </slot>
        </button>
        {#if showPopupMenu}
          <div
            class="absolute top-full mt-1.5 right-0 bg-white border border-gray-200 rounded-sm w-72"
            role="menu"
          >
            <slot name="popup-menu">
              <ul>
                <li class="p-4 border-b border-gray-200 text-base">
                  <span class="line-clamp-1 break-all">{user?.email}</span>
                </li>
                <li class="border-b border-gray-200 text-sm font-bold">
                  <a
                    class="block w-full text-left px-4 py-3 hover:bg-gray-100/50"
                    href={accountLink}
                    target="_blank"
                  >
                    {t('my_account')}
                  </a>
                </li>
                <li class="text-sm font-bold">
                  <button
                    class="block w-full text-left px-4 py-3 hover:bg-gray-100/50"
                    onclick={() => logout(api)}>{t('logout')}</button
                  >
                </li>
              </ul>
            </slot>
          </div>
        {/if}
      </div>
    {:else}
      <Button
        class={twMerge(
          'font-bold row gap-1.5 text-[color:--s-login-button-color] border-[color:--s-login-button-color] border-[length:--s-login-button-border-width]',
          classes
        )}
        variant="secondary"
        {disabled}
        onclick={() => login(api)}
        size="sm"
      >
        <slot name="button-text-prefix"></slot>
        <slot name="button-text">
          {t('login')}
        </slot>
        <slot name="button-text-suffix"></slot>
      </Button>
    {/if}
  {/await}
</Base>
