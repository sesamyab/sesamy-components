<script lang="ts">
  import type { SesamyAPI } from '@sesamy/sesamy-js';
  import type { Snippet } from 'svelte';

  type Props = {
    api: SesamyAPI;
    children: Snippet;
  };

  let { api, children }: Props = $props();

  const checkLoggedIn = async (api: SesamyAPI) => {
    try {
      const loggedIn = await api.auth.isAuthenticated();

      return loggedIn;
    } catch (error) {
      console.error('Error checking login status:', error);
    }
  };
</script>

{#await checkLoggedIn(api) then loggedIn}
  {#if !loggedIn}
    {@render children()}
  {/if}
{/await}
