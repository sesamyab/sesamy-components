<svelte:options customElement={{ tag: 'sesamy-content-container', shadow: 'open' }} />

<script lang="ts">
  import Base from './Base.svelte';
  import type { ContentContainerProps } from './types';

  let {
    'item-src': itemSrc = '',
    pass = '',
    'lock-mode': lockMode = 'embed'
  }: ContentContainerProps = $props();

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
  {#await api.entitlements.hasAccess(itemSrc, pass.split(',')) then hasAccess}
    {#if hasAccess}
      {getContent()}
    {:else}
      <slot name="preview"></slot>
    {/if}
  {/await}
</Base>
