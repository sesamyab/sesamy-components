<svelte:options customElement={{ extend: deferMountUntilParsed }} />

<script lang="ts">
  import { deferMountUntilParsed } from './defer-mount';
  import { onDestroy } from 'svelte';
  import type { SesamyAPI } from '@sesamy/sesamy-js';
  import { getApi, whenApiReady } from './api';

  // Undecided until the first answer, which renders neither slot.
  let loggedIn = $state<boolean | null>(null);

  const destroyed = new AbortController();
  onDestroy(() => destroyed.abort());

  const answer = async (api: SesamyAPI) => {
    let authenticated = false;
    try {
      authenticated = !!(await api.auth.isAuthenticated());
    } catch (error) {
      console.error('Error checking login status:', error);
    }
    if (!destroyed.signal.aborted) loggedIn = authenticated;
  };

  getApi().then(answer, (error) => {
    console.error('Error checking login status:', error);
    if (destroyed.signal.aborted) return;
    // Treated as signed out while sesamy-js is unavailable, then answered for
    // real if it becomes ready after all.
    loggedIn = false;
    void whenApiReady(destroyed.signal).then(answer);
  });
</script>

{#if loggedIn === true}
  <slot name="logged-in"></slot>
{:else if loggedIn === false}
  <slot name="not-logged-in"></slot>
{/if}
