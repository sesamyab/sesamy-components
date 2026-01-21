<svelte:options customElement={{ tag: 'sesamy-content-container', shadow: 'open' }} />

<script lang="ts">
  import type { SesamyAPI } from '@sesamy/sesamy-js';
  import Base from './Base.svelte';
  import type { ContentContainerProps } from './types';

  let {
    'item-src': itemSrc = '',
    'publisher-content-id': publisherContentIdProp,
    'lock-mode': lockMode = 'embed',
    'locked-content-selector': lockedContentSelector
  }: ContentContainerProps = $props();

  // Store the content slot element in memory
  let storedContentElement: Element | null = null;

  function extractAndStoreContent() {
    const host = $host();
    if (!host || storedContentElement) return;

    const contentSlot = host.querySelector('[slot="content"]');
    if (contentSlot) {
      // Clone and store the content
      storedContentElement = contentSlot.cloneNode(true) as Element;
      // Remove from DOM
      contentSlot.remove();
    }
  }

  // Extract content on component initialization
  $effect(() => {
    extractAndStoreContent();
  });

  async function checkAccess(api: SesamyAPI) {
    const content = api.content.get($host());
    if (!content) {
      api.log(`No content found for host`);
      return false;
    } else if (content.accessLevel === 'public') {
      api.log(`Content is public`);
      return true;
    }
    api.log(`Checking access`);

    return api.content.hasAccess($host());
  }

  function emitUnlockEvent(api: SesamyAPI) {
    const publisherContentId = publisherContentIdProp || api.content.get($host())?.id || '';

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

  async function injectContent(contentHtml: string) {
    if (!contentHtml) return;

    const host = $host();
    if (!host) return;

    const lockedContentNode = document.createElement('div');
    lockedContentNode.setAttribute('position', 'relative');

    // Copy classes from the web component
    const componentClasses = host.getAttribute('class');
    if (componentClasses) {
      lockedContentNode.setAttribute('class', componentClasses);
    }

    lockedContentNode.innerHTML = contentHtml;

    // Handle scripts
    const scripts = lockedContentNode.querySelectorAll('script');
    const scriptContents: string[] = [];

    scripts.forEach((script) => {
      try {
        if (script.src) {
          const newScript = document.createElement('script');
          newScript.src = script.src;
          document.head.appendChild(newScript);
        } else {
          scriptContents.push(script.textContent || '');
        }
        script.parentNode?.removeChild(script);
      } catch (err) {
        console.error('Failed to process script:', err, script);
      }
    });

    // Insert in light DOM
    host.parentElement?.insertBefore(lockedContentNode, host);

    // Execute inline scripts
    scriptContents.forEach((code) => {
      try {
        const script = document.createElement('script');
        script.textContent = code;
        document.head.appendChild(script);
        document.head.removeChild(script);
      } catch (err) {
        console.error('Failed to execute inline script:', err, code);
      }
    });
  }

  async function fetchContent(api: SesamyAPI): Promise<string> {
    switch (lockMode) {
      case 'encode':
        const base64 = storedContentElement?.innerHTML || '';
        // Convert base64 to UTF-8 string
        try {
          return new TextDecoder().decode(Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)));
        } catch (e) {
          console.error('Error decoding content:', e);
          return '';
        }
      case 'event':
        emitUnlockEvent(api);
        return '';
      case 'proxy':
      case 'signedUrl':
        return api.content.unlock($host().parentElement!, lockedContentSelector);
      case 'embed':
        return storedContentElement?.innerHTML || '';
      default:
        console.error('Invalid lock mode');
        return '';
    }
  }

  async function unlockAndRenderContent(api: SesamyAPI) {
    try {
      const contentHtml = await fetchContent(api);
      await injectContent(contentHtml);
    } catch (err) {
      console.error('Error unlocking content:', err);
    }
  }
</script>

<Base let:api applyStyles={false}>
  {#await checkAccess(api)}
    <!-- Show the preview until we know if the user has access -->
    <slot name="preview"></slot>
  {:then entitlement}
    {#if entitlement}
      {#await unlockAndRenderContent(api)}
        <slot name="preview"></slot>
      {:then}
        <!-- Once the content is unlocked it will be displayed outside the shadow DOM. -->
      {/await}
    {:else}
      <slot name="preview"></slot>
    {/if}
  {/await}
</Base>
