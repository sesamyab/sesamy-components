<script lang="ts">
  import libstyles from './app.css?inline';
  import { onDestroy } from 'svelte';
  import type { SesamyAPI } from '@sesamy/sesamy-js';
  import { getApi, whenApiReady } from './api';
  import initTranslator, { type TranslationFunction } from './i18n';

  let { lang, applyStyles = true }: { lang?: string; applyStyles?: boolean } = $props();

  // Pending until sesamy-js is ready, then ready for the rest of the page view.
  // `unavailable` is not final: it is what the reader sees between giving up on
  // sesamy-js and sesamy-js becoming ready after all.
  let ready = $state.raw<{ api: SesamyAPI; t: TranslationFunction } | null>(null);
  let unavailable = $state.raw<{ error: unknown } | null>(null);

  const destroyed = new AbortController();
  onDestroy(() => destroyed.abort());

  function becomeReady(api: SesamyAPI) {
    if (destroyed.signal.aborted || ready) return;
    try {
      // Use explicit lang prop if set, otherwise get language from sesamy.content.getLanguage()
      const t = initTranslator(lang || api.content.getLanguage());
      ready = { api, t };
    } catch (error) {
      giveUp(error);
    }
  }

  function giveUp(error: unknown) {
    if (destroyed.signal.aborted || unavailable) return;
    reportUnavailable(error);
    unavailable = { error };
  }

  getApi().then(becomeReady, (error) => {
    giveUp(error);
    // A late READY must not leave the page without its components: the
    // paywall, the login button, the content gate. Once sesamy-js is ready
    // they start exactly as they would have on time, so the gate still asks
    // for access before it reveals anything.
    void whenApiReady(destroyed.signal).then(becomeReady);
  });

  let sesamyDesignTokens = `
    :host {
      display: contents;
      font-family: var(--s-font-family);
      -webkit-font-smoothing: antialiased;
      color: black;
      text-align: left;

      --s-primary-color: var(--sesamy-primary-color, #000000);
      --s-font-family: var(--sesamy-font-family, Helvetica);
      --s-base-font-size: var(--sesamy-base-font-size, 16px);

      --s-login-button-color: var(--sesamy-login-button-color, #000000);
      --s-login-button-text-color: var(--sesamy-login-button-color, var(--sesamy-login-button-text-color, var(--s-login-button-default-text-color, #000000)));
      --s-login-button-text-size: var(--sesamy-login-button-text-size, var(--s-login-button-default-text-size, calc(0.875 * var(--s-base-font-size, 16px))));
      --s-login-button-border-color: var(--sesamy-login-button-color, var(--sesamy-login-button-border-color, #000000));
      --s-login-button-background-color: var(--sesamy-login-button-background-color, transparent);
      --s-login-button-border-width: var(--sesamy-login-button-border-width, 1px);
      --s-login-button-border-radius: var(--sesamy-login-button-border-radius, calc(0.375 * var(--s-base-font-size, 16px)));
      --s-login-button-font-weight: var(--sesamy-login-button-font-weight, 700);
      --s-login-avatar-bgcolor: var(--sesamy-login-avatar-bgcolor, var(--s-login-button-color));
      --s-login-avatar-textcolor: var(--sesamy-login-avatar-textcolor, #ffffff);

      --s-login-popup-width: var(--sesamy-login-popup-width, calc(18 * var(--s-base-font-size, 16px)));
      --s-login-popup-bgcolor: var(--sesamy-login-popup-bgcolor, #ffffff);
      --s-login-popup-textcolor: var(--sesamy-login-popup-textcolor, #000000);
      --s-login-popup-border-color: var(--sesamy-login-popup-border-color, #e5e7eb);
      --s-login-popup-border-width: var(--sesamy-login-popup-border-width, 1px);
      --s-login-popup-border-radius: var(--sesamy-login-popup-border-radius, calc(0.125 * var(--s-base-font-size, 16px)));
      --s-login-popup-zindex: var(--sesamy-login-popup-zindex, 10);
    }
  `;

  let style = applyStyles ? '<sty' + 'le>' + libstyles + sesamyDesignTokens + '</style>' : '';

  let reported = false;
  function reportUnavailable(error: unknown) {
    if (reported) return;
    reported = true;
    console.error('[sesamy-components] sesamy-js is unavailable:', error);
  }
</script>

{#if ready}
  <slot api={ready.api} t={ready.t}></slot>
{:else if unavailable}
  <!-- sesamy-js is not usable (yet). This renders on a live publisher page, so
       it must not paint an error message into the article; components that have
       something sensible to show when there is no api (a content container's
       teaser) fill the `error` slot, everyone else renders nothing. The reason
       goes to the console, where it is diagnosable without defacing the page. -->
  <slot name="error" error={unavailable.error}></slot>
{/if}

{@html style}
