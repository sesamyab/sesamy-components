<script lang="ts">
  // @ts-ignore
  import libstyles from './app.css?inline';
  import { getApi } from './api';
  import initTransaltor from './i18n';

  let { lang }: { lang?: string } = $props();
  const htmlLang = document.querySelector('html')?.getAttribute('lang');

  const apiPromise = getApi();

  const translator = initTransaltor(lang || htmlLang || 'en');

  let sesamyDesignTokens = `
    * {
      --s-main-color: var(--sesamy-main-color, #E71104);
      --s-popular-color: var(--sesamy-popular-color, #ff5557);
      --s-bg-color: var(--sesamy-bg-color, #F6DFDC);
      --s-font-family: var(--sesamy-font-family, Helvetica);
    }

    .base {
      font-family: var(--s-font-family);
      -webkit-font-smoothing: antialiased;
      color: black;
      text-align: left;
    }
  `;

  let style = '<sty' + 'le>' + libstyles + sesamyDesignTokens + '</style>';
</script>

<div class="base">
  {#await apiPromise then api}
    <slot {api} t={translator}></slot>
  {:catch error}
    <p style="color: red">{error.message}</p>
  {/await}
</div>

{@html style}
