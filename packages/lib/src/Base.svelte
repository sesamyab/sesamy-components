<script lang="ts">
  // @ts-ignore
  import libstyles from './app.css?inline';
  import { getApi } from './api';
  import initTransaltor from './i18n';
  import { hexToHsl, hslArrayToCSS } from './utils/color';

  let { lang }: { lang?: string } = $props();
  const htmlLang = document.querySelector('html')?.getAttribute('lang');

  const apiPromise = getApi();

  const translator = initTransaltor(lang || htmlLang || 'en');

  let sesamyDesignTokens = `
    :host {
      font-family: var(--s-font-family);
      -webkit-font-smoothing: antialiased;
      color: black;
      text-align: left;

      --s-main-color: var(--sesamy-main-color, ${hslArrayToCSS(hexToHsl('#7D68F4'))});
      --s-font-family: var(--sesamy-font-family, Helvetica);
    }
  `;

  let style = '<sty' + 'le>' + libstyles + sesamyDesignTokens + '</style>';
</script>

{#await apiPromise then api}
  <slot {api} t={translator}></slot>
{:catch error}
  <p style="color: red">{error.message}</p>
{/await}

{@html style}
