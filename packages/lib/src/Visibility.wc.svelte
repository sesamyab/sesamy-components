<svelte:options customElement="sesamy-visibility" />

<script lang="ts">
  import type { SesamyAPI } from '@sesamy/sesamy-js';
  import { getApi } from './api';

  const apiPromise = getApi();

  const checkLoggedIn = async () => {
    try {
      const api: SesamyAPI = await apiPromise;
      return api.auth.isAuthenticated();
    } catch (error) {
      console.error('Error checking login status:', error);
    }
  };
</script>

{#await checkLoggedIn() then loggedIn}
  {#if loggedIn}
    <slot name="logged-in"></slot>
  {:else}
    <slot name="not-logged-in"></slot>
  {/if}
{/await}
