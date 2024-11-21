<svelte:options customElement={{ tag: 'sesamy-content-container-beta', shadow: 'open' }} />

<script lang="ts">
  import type { SesamyAPI, Entitlement } from '@sesamy/sesamy-js';
  import Base from './Base.svelte';
  import type { ContentContainerProps } from './types';
  let {
    'item-src': itemSrc = '',
    'publisher-content-id': publisherContentId,
    'access-url': accessUrl = '',
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

  // TODO: This should be moved to sesamy-js
  async function getRemoteContent(api: SesamyAPI, entitlement: boolean | Entitlement) {
    if (!accessUrl) {
      return '';
    }

    const access =
      typeof entitlement === 'object' ? await api.entitlements.access(entitlement.id) : undefined;

    const url = new URL(accessUrl);
    const headers = new Headers({
      accept: 'text/html'
    });

    if (access?.token) {
      headers.set('authorization', `Bearer ${access.token}`);
    }
    if (access?.url) {
      headers.set('x-sesamy-signed-url', access.url);
    }

    const response = await fetch(url, { headers });
    const content = await response.text();

    // Parse content and look for the div[slot="content"] on the <sesamy-content-container-beta> tag
    const parser = new DOMParser();
    const contentSlot = parser
      .parseFromString(content, 'text/html')
      .querySelector(
        `sesamy-content-container-beta[access-url='${accessUrl}'], sesamy-content-container-beta[item-src='${itemSrc}'], sesamy-content-container-beta[pass='${pass}']`
      )
      ?.querySelector("div[slot='content']");

    return contentSlot?.innerHTML || '';
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

  async function getContent(api: SesamyAPI, entitlement: boolean | Entitlement) {
    const content = $host().querySelector('div[slot="content"]');
    switch (lockMode) {
      case 'encode':
        return atob(content?.innerHTML || '');
      case 'event':
        emitUnlockEvent();
        return '';
      case 'signedUrl':
        return getRemoteContent(api, entitlement);
      case 'embed':
      default:
        return content?.innerHTML || '';
    }
  }
</script>

<Base let:api applyStyles={false}>
  {#await checkAccess(api) then entitlement}
    {#if entitlement}
      {#await getContent(api, entitlement) then content}
        {@html content}
      {/await}
    {:else}
      <slot name="preview"></slot>
    {/if}
  {/await}
</Base>
