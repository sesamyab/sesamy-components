<svelte:options customElement={{ tag: 'sesamy-content-container', shadow: 'open' }} />

<script lang="ts">
  import type { SesamyAPI } from '@sesamy/sesamy-js';
  import Base from './Base.svelte';
  import type { ContentContainerProps } from './types';

  let {
    'item-src': itemSrc = '',
    'publisher-content-id': publisherContentIdProp,
    pass: passProp,
    'access-level': accessLevelProp,
    'lock-mode': lockMode = 'embed',
    'locked-content-selector': lockedContentSelector
  }: ContentContainerProps = $props();

  // Force component update when slots change
  let previewSlotVersion = $state(0);
  let contentSlotVersion = $state(0);
  // Current API instance from the latest access check
  let currentApi: SesamyAPI | null = null;

  // Function to handle slot changes
  function handleSlotChange(slotName: string, api: SesamyAPI) {
    console.log(`Slot "${slotName}" content changed`);
    if (slotName === 'preview') {
      previewSlotVersion++;
    } else if (slotName === 'content') {
      contentSlotVersion++;

      // If in encode mode and content slot changes, re-process content
      if (lockMode === 'encode') {
        unlockAndRenderContent(api);
      }
    }
  }

  // This function will be called when API is available
  function setupSlotChangeListeners(api: SesamyAPI) {
    // Store API reference for slot changes
    currentApi = api;

    const host = $host();
    if (!host) return;

    // Setup slotchange listeners for both slots
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          const slot = (mutation.target as HTMLElement).getAttribute?.('slot');
          if (slot === 'preview' || slot === 'content') {
            handleSlotChange(slot, api);
          } else if (
            (mutation.target as HTMLElement).querySelector?.('[slot="preview"], [slot="content"]')
          ) {
            // Check if any of the changed nodes contain slot elements
            const previewSlot = (mutation.target as HTMLElement).querySelector('[slot="preview"]');
            const contentSlot = (mutation.target as HTMLElement).querySelector('[slot="content"]');

            if (previewSlot) handleSlotChange('preview', api);
            if (contentSlot) handleSlotChange('content', api);
          }
        }
      }
    });

    // Observe the entire host and its children
    observer.observe(host, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return () => {
      observer.disconnect();
    };
  }

  async function checkAccess(api: SesamyAPI) {
    // Store API reference for slot change handling
    currentApi = api;

    // Set up slot change listeners when we first receive the API
    setupSlotChangeListeners(api);

    const articleUrl = itemSrc || api.content.get($host())?.url || '';
    const passes = passProp ? passProp.split(';') : api.content.get($host())?.pass?.split(';');
    const accessLevel = accessLevelProp || api.content.get($host())?.accessLevel || 'entitlement';

    api.log(
      `Checking access for ${articleUrl} with passes: ${JSON.stringify(passes)}, articleUrl: ${articleUrl} and access level: ${accessLevel}`
    );

    switch (accessLevel) {
      case 'public':
        return true;
      case 'logged-in':
        return api.auth.isAuthenticated();
      case 'entitlement':
      default:
        return api.entitlements.hasAccess(articleUrl, passes);
    }
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
    const content = $host().querySelector('div[slot="content"]');

    switch (lockMode) {
      case 'encode':
        const base64 = content?.innerHTML || '';
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
        return '';
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
  {#key previewSlotVersion + contentSlotVersion}
    {#await checkAccess(api)}
      <!-- Show the preview until we know if the user has access -->
      <slot name="preview"></slot>
    {:then entitlement}
      {#if entitlement}
        {#if lockMode === 'embed'}
          <slot name="content"></slot>
        {:else}
          {#await unlockAndRenderContent(api)}
            <slot name="preview"></slot>
          {:then}
            <!-- Once the content is unlocked it will displayed outside the shadow DOM. -->
          {/await}
        {/if}
      {:else}
        <slot name="preview"></slot>
      {/if}
    {/await}
  {/key}
</Base>
