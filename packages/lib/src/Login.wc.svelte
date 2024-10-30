<svelte:options customElement="sesamy-login" />

<script lang="ts">
  import Avatar from './Avatar.wc.svelte';
  import Base from './Base.svelte';
  import type { LoginProps } from './types';
  import Button from './components/Button.svelte';
  import { checkLoggedIn, login, logout } from './utils/authentication';

  let { loading, loggedIn, 'button-text': buttonText }: LoginProps = $props();

  let disabled = $state(false);
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
      <Button variant="secondary" {disabled} onclick={() => login(api)} size="sm">
        {buttonText || t('login')}
      </Button>
    {/if}
  {/await}
</Base>
