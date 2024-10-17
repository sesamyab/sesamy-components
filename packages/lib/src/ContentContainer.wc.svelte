<svelte:options customElement={{ tag: 'sesamy-content-container', shadow: 'open' }} />

<script lang="ts">
  import type { SesamyAPI } from '@sesamy/sesamy-js';
  import Base from './Base.svelte';
  import type { ContentContainerProps } from './types';
  let {
    'item-src': itemSrc = '',
    pass = '',
    'access-level': accessLevel = 'entitlement',
    'lock-mode': lockMode = 'embed'
  }: ContentContainerProps = $props();

  async function checkAccess(api: SesamyAPI) {
    switch (accessLevel) {
      case 'public':
        return true;
      case 'logged-in':
        return api.auth.isAuthenticated();
      case 'entitlement':
      default:
        return api.entitlements.hasAccess(itemSrc, pass.split(','));
    }
  }

  function getContent() {
    const content = $host().querySelector('div[slot="content"]');
    switch (lockMode) {
      case 'encode':
        return atob(content?.innerHTML || '');
      case 'event':
        // TODO: Trigger event
        return '';
      case 'signedUrl':
        return 'Remote content';
      case 'embed':
      default:
        return content?.innerHTML || '';
    }
  }
</script>

<Base let:api applyStyles={false}>
  {#await checkAccess(api) then hasAccess}
    {#if hasAccess}
      {@html getContent()}
    {:else}
      <slot name="preview"></slot>
    {/if}
  {/await}
</Base>
