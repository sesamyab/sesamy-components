<svelte:options customElement="sesamy-login" />

<script lang="ts">
  import type { SesamyAPI } from '@sesamy/sesamy-js';
  import Avatar from './Avatar.wc.svelte';
  import Base from './Base.svelte';
  import Button from './Button.wc.svelte';
  import type { LoginProps } from './types';

  let { loading, loggedIn, userAvatar }: LoginProps = $props();

  let disabled = $state(false);

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
        const user = await api.auth.getUser();
        userAvatar = user?.picture;
      }
    } catch (error) {
      console.error('Error checking login status:', error);
    }
  };
</script>

<Base let:api let:t>
  {#await checkLoggedIn(api) then _}
    {#if loading || loggedIn}
      <Avatar {loading} onclick={() => logout(api)} size="sm"></Avatar>
    {:else}
      <slot name="loginButton">
        <Button variant="secondary" part="loginButton" {disabled} onclick={() => login(api)}>
          {t('login')}
        </Button>
      </slot>
    {/if}
  {/await}
</Base>
