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
      color: black;
      text-align: left;

      --s-primary-color: var(--sesamy-primary-color, '#000000');
      --s-font-family: var(--sesamy-font-family, Helvetica);

      --s-login-button-color: var(--sesamy-login-button-color, #000000);
      --s-login-button-border-width: var(--sesamy-login-button-border-width, 1px);
      --s-login-avatar-bgcolor: var(--sesamy-login-avatar-bgcolor, var(--s-login-button-color));
      --s-login-avatar-textcolor: var(--sesamy-login-avatar-textcolor, #ffffff);
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
