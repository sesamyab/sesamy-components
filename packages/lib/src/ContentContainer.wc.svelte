<svelte:options customElement={{ tag: 'sesamy-content-container-beta', shadow: 'open' }} />

<script lang="ts">
  import { type SesamyAPI, type Entitlement } from '@sesamy/sesamy-js';
  import Base from './Base.svelte';
  import type { ContentContainerProps } from './types';
  let {
    'item-src': itemSrc = '',
    'publisher-content-id': publisherContentId,
    pass = '',
    'access-level': accessLevel = 'entitlement',
    'lock-mode': lockMode = 'embed',
    'locked-content-selector': lockedContentSelector
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

  function emitUnlockEvent() {
    const event = new CustomEvent('sesamyUnlocked', {
      detail: {
        publisherContentId,
        itemSrc
      },
      bubbles: true,
      composed: true
    });

    dispatchEvent(event);
  }

  async function getContent(api: SesamyAPI) {
    const content = $host().querySelector('div[slot="content"]');
    switch (lockMode) {
      case 'encode':
        return atob(content?.innerHTML || '');
      case 'event':
        emitUnlockEvent();
        return '';
      case 'proxy':
      // @deprecated: use 'proxy' instead
      case 'signedUrl':
        return api.content.unlock($host(), lockedContentSelector);
      case 'embed':
      default:
        return content?.innerHTML || '';
    }
  }
</script>

<Base let:api applyStyles={false}>
  {#await checkAccess(api) then entitlement}
    {#if entitlement}
      <slot name="content">
        {#await getContent(api) then content}
          {@html content}
        {/await}
      </slot>
    {:else}
      <slot name="preview"></slot>
    {/if}
  {/await}
</Base>
