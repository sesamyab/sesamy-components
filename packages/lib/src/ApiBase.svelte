<script lang="ts">
  import { getApi } from './api';
  import initTransaltor from './i18n';

  let { lang }: { lang?: string } = $props();
  const htmlLang = document.querySelector('html')?.getAttribute('lang');

  const apiPromise = getApi();

  const translator = initTransaltor(lang || htmlLang || 'en');
</script>

{#await apiPromise then api}
  <slot {api} t={translator}></slot>
{:catch error}
  <p style="color: red">{error.message}</p>
{/await}
