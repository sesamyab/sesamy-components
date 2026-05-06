<svelte:options customElement={{ tag: 'sesamy-content-container', shadow: 'open' }} />

<script lang="ts">
  import type { SesamyAPI } from '@sesamy/sesamy-js';
  import Base from './Base.svelte';
  import type { ContentContainerProps } from './types';
  import { dispatchSesamyEvent } from './events';

  let {
    'item-src': itemSrc = '',
    'publisher-content-id': publisherContentIdProp,
    'lock-mode': lockMode = 'embed',
    'locked-content-selector': lockedContentSelector
  }: ContentContainerProps = $props();

  // Stored only for non-embed modes (encode) that need to read the original
  // slot HTML as their source. Embed mode never extracts; the slot is left in
  // place and projected via <slot name="content">.
  let storedContentElement: Element | null = null;
  let unlockEmitted = false;

  function extractAndStoreContent() {
    const host = $host();
    if (!host || storedContentElement) return;

    const contentSlot = host.querySelector('[slot="content"]');
    if (contentSlot) {
      storedContentElement = contentSlot.cloneNode(true) as Element;
      contentSlot.remove();
    }
  }

  function removeContentSlot() {
    $host()?.querySelector('[slot="content"]')?.remove();
  }

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
    if (unlockEmitted) return;
    unlockEmitted = true;
    const host = $host();
    const publisherContentId = publisherContentIdProp || api.content.get(host)?.id || '';

    const event = new CustomEvent('sesamyUnlocked', {
      detail: {
        publisherContentId,
        itemSrc
      },
      bubbles: true,
      composed: true
    });

    dispatchEvent(event);

    const contentName = host.dataset?.dcaContentName ?? publisherContentId ?? '';

    dispatchSesamyEvent(host, 'sesamy:content-unlocked', {
      contentName
    });
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
    const inlineScripts: HTMLScriptElement[] = [];

    scripts.forEach((script) => {
      try {
        const newScript = document.createElement('script');
        // Preserve all attributes (type, async, defer, crossorigin, etc.)
        Array.from(script.attributes).forEach((attr) =>
          newScript.setAttribute(attr.name, attr.value)
        );
        if (script.src) {
          document.head.appendChild(newScript);
        } else {
          newScript.textContent = script.textContent;
          inlineScripts.push(newScript);
        }
        script.parentNode?.removeChild(script);
      } catch (err) {
        console.error('Failed to process script:', err, script);
      }
    });

    // Insert in light DOM
    host.parentElement?.insertBefore(lockedContentNode, host);

    // Execute inline scripts
    inlineScripts.forEach((script) => {
      try {
        document.head.appendChild(script);
        // Module scripts execute asynchronously; don't remove them so the browser
        // can finish loading imports. Non-module scripts execute synchronously on
        // append so they can be removed immediately after.
        if (script.type !== 'module') {
          document.head.removeChild(script);
        }
      } catch (err) {
        console.error('Failed to execute inline script:', err, script);
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
        // Embed leaves the DOM untouched; this branch is unreachable in the
        // entitled flow because the template projects <slot name="content">.
        return '';
      default:
        console.error('Invalid lock mode');
        return '';
    }
  }

  async function unlockAndRenderContent(api: SesamyAPI) {
    try {
      // Embed mode: content is already in the slot. Cloning+reinjecting via
      // innerHTML breaks ad iframes and any other stateful DOM injected by
      // publisher scripts, so we leave the DOM untouched and let the browser
      // project <slot name="content"> in the template.
      if (lockMode === 'embed') {
        emitUnlockEvent(api);
        return;
      }

      extractAndStoreContent();
      if (!$host()?.isConnected) return;
      const contentHtml = await fetchContent(api);
      if (!$host()?.isConnected) return;
      await injectContent(contentHtml);

      if (lockMode !== 'event') {
        emitUnlockEvent(api);
      }
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
        {#if lockMode === 'embed'}
          <!-- Embed: project the original slot content untouched so ads,
               iframes, and any DOM injected by publisher scripts keep working. -->
          <slot name="content"></slot>
        {/if}
        <!-- Other modes: content has been rendered outside the shadow DOM. -->
      {/await}
    {:else}
      {removeContentSlot()}
      <slot name="preview"></slot>
    {/if}
  {/await}
</Base>
