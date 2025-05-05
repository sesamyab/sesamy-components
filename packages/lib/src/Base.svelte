<script lang="ts">
  // @ts-ignore
  import libstyles from './app.css?inline';
  import { getApi } from './api';
  import initTranslator from './i18n';

  let { lang, applyStyles = true }: { lang?: string; applyStyles?: boolean } = $props();
  const htmlLocale = document.querySelector('html')?.getAttribute('lang');
  const htmlLang = htmlLocale?.split('-')[0];

  const apiPromise = getApi();

  const translator = initTranslator(lang || htmlLang || 'en');

  let sesamyDesignTokens = `
    :host {
      display: contents;
      font-family: var(--s-font-family);
      -webkit-font-smoothing: antialiased;
      color: black;
      text-align: left;

      --s-primary-color: var(--sesamy-primary-color, #000000);
      --s-font-family: var(--sesamy-font-family, Helvetica);

      --s-login-button-color: var(--sesamy-login-button-color, #000000);
      --s-login-button-text-color: var(--sesamy-login-button-color, var(--sesamy-login-button-text-color, #000000));
      --s-login-button-border-color: var(--sesamy-login-button-color, var(--sesamy-login-button-border-color, #000000));
      --s-login-button-background-color: var(--sesamy-login-button-background-color, transparent);
      --s-login-button-border-width: var(--sesamy-login-button-border-width, 1px);
      --s-login-button-border-radius: var(--sesamy-login-button-border-radius, 0.375rem);
      --s-login-button-font-weight: var(--sesamy-login-button-font-weight, 700);
      --s-login-avatar-bgcolor: var(--sesamy-login-avatar-bgcolor, var(--s-login-button-color));
      --s-login-avatar-textcolor: var(--sesamy-login-avatar-textcolor, #ffffff);

      --s-login-popup-width: var(--sesamy-login-popup-width, 18rem);
      --s-login-popup-bgcolor: var(--sesamy-login-popup-bgcolor, #ffffff);
      --s-login-popup-textcolor: var(--sesamy-login-popup-textcolor, #000000);
      --s-login-popup-border-color: var(--sesamy-login-popup-border-color, #e5e7eb);
      --s-login-popup-border-width: var(--sesamy-login-popup-border-width, 1px);
      --s-login-popup-border-radius: var(--sesamy-login-popup-border-radius, 0.125rem);
      --s-login-popup-zindex: var(--sesamy-login-popup-zindex, 10);
    }
  `;

  let style = applyStyles ? '<sty' + 'le>' + libstyles + sesamyDesignTokens + '</style>' : '';
</script>

{#await apiPromise then api}
  <slot {api} t={translator}></slot>
{:catch error}
  <p style="color: red">{error.message}</p>
{/await}

{@html style}
