<svelte:options customElement="sesamy-login" />

<script lang="ts">
  import type { SesamyAPI } from '@sesamy/sesamy-js';
  import type { Profile } from '@sesamy/sdk';
  import Base from './Base.svelte';
  import type { LoginProps } from './types';
  import Button from './components/Button.svelte';
  import { twMerge } from 'tailwind-merge';
  import LoginMenuItemRenderer from './components/LoginMenuItemRenderer.svelte';
  import AvatarRenderer from './components/AvatarRenderer.svelte';

  let { loading, loggedIn, class: classes = '' }: LoginProps & { class?: string } = $props();

  let disabled = $state(false);
  let showPopupMenu = $state(false);
  let user = $state<Profile | null>(null);
  let accountLink = $state<string | null>(null);

  const login = async (api: SesamyAPI) => {
    disabled = true;
    try {
      await api.auth.login();
    } catch (error) {
      disabled = false;
      console.error('Login failed:', error);
    }
  };

  const checkLoggedIn = async (api: SesamyAPI) => {
    try {
      loggedIn = await api.auth.isAuthenticated();
      if (loggedIn) {
        user = await api.auth.getUser();
        accountLink = await api.generateLink({ target: 'account' });
      }
    } catch (error) {
      console.error('Error checking login status:', error);
    }
  };

  const handleClickOutside = (e: Event) => {
    const target = e.target as Node;
    const popupMenu = $host().querySelector('[slot="popup-menu"]');

    // Check if the click is on this component or within the popup menu
    if (
      target !== $host() &&
      !$host().contains(target) &&
      target !== popupMenu &&
      !(popupMenu && popupMenu.contains(target))
    ) {
      showPopupMenu = false;
    }
  };
  document.addEventListener('pointerdown', handleClickOutside);
</script>

<Base let:api let:t>
  {#await checkLoggedIn(api)}
    <AvatarRenderer loading={true} size="sm" />
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
            <AvatarRenderer src={user?.picture} {loading} size="sm" />
          </slot>
        </button>
        <div
          class={twMerge(
            'absolute top-full mt-1.5 right-0 bg-[--s-login-popup-bgcolor] text-[--s-login-popup-textcolor] border-[color:--s-login-popup-border-color] border-[length:--s-login-popup-border-width] rounded-[--s-login-popup-border-radius] w-[--s-login-popup-width] z-[--s-login-popup-zindex] hidden',
            showPopupMenu && 'block'
          )}
          role="menu"
        >
          <slot name="popup-menu">
            <LoginMenuItemRenderer {api} {t} type="EMAIL" />
            <LoginMenuItemRenderer {api} {t} type="ACCOUNT" />
            <LoginMenuItemRenderer {api} {t} type="LOGOUT" />
          </slot>
        </div>
      </div>
    {:else}
      <Button
        class={twMerge(
          '!font-[--s-login-button-font-weight] row gap-1.5 bg-[color:--s-login-button-background-color] text-[color:--s-login-button-text-color] border-[color:--s-login-button-border-color] border-[length:--s-login-button-border-width] rounded-[--s-login-button-border-radius]',
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
