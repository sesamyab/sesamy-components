<svelte:options customElement="sesamy-login" />

<script lang="ts">
  import type { SesamyAPI } from '@sesamy/sesamy-js';
  import Avatar from './Avatar.wc.svelte';
  import Base from './Base.svelte';
  import type { LoginProps } from './types';
  import Button from './components/Button.svelte';

  let {
    loading,
    loggedIn,
    userAvatar,
    'button-text': buttonText,
    class: classes = ''
  }: LoginProps & { class?: string } = $props();

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
        userAvatar = user?.picture || '';
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
    {#if loading}
      <Avatar {loading} onclick={() => logout(api)} size="sm"></Avatar>
    {:else if loggedIn}
      <Avatar {loading} onclick={() => logout(api)} size="sm"></Avatar>
    {:else}
      <Button class={classes} variant="secondary" {disabled} onclick={() => login(api)} size="sm">
        {buttonText || t('login')}
      </Button>
    {/if}
  {/await}
</Base>
