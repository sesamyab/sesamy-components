<script lang="ts">
  // @ts-ignore
  import libstyles from './app.css?inline';
  import { getApi } from './api';
  import cs from './locales/cs/default.json';
  import en from './locales/en/default.json';
  import fi from './locales/fi/default.json';
  import it from './locales/it/default.json';
  import nb from './locales/nb/default.json';
  import pl from './locales/pl/default.json';
  import sv from './locales/sv/default.json';

  const apiPromise = getApi();

  let translator = {
    cs,
    en,
    fi,
    it,
    nb,
    pl,
    sv
  };

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

  // Prio order of localization
  // 1. explicit lang property on component
  // 2. html-tag lang
  // 3. english fallback

  let style = '<sty' + 'le>' + libstyles + sesamyDesignTokens + '</style>';
</script>

<div class="base">
  {#await apiPromise then api}
    <slot {api} t={translator.sv}></slot>
  {:catch error}
    <p style="color: red">{error.message}</p>
  {/await}
</div>

{@html style}
