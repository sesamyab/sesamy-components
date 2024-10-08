<script lang="ts">
  // @ts-ignore
  import libstyles from './app.css?inline';
  import { getApi } from './api';

  const apiPromise = getApi();

  let sesamyDesignTokens = `
    * {
      --sesamy-main-color: #E71104;
      --sesamy-bg-color: #F6DFDC;
    }
  `;

  let style = '<sty' + 'le>' + libstyles + sesamyDesignTokens + '</style>';
</script>

{#await apiPromise then api}
  <slot {api}></slot>
{:catch error}
  <p style="color: red">{error.message}</p>
{/await}

{@html style}
