<script lang="ts">
  // @ts-ignore
  import libstyles from './app.css?inline';
  import { getApi } from './api';

  const apiPromise = getApi();

  let sesamyDesignTokens = `
    * {
      --s-main-color: var(--sesamy-main-color, #E71104);
      --s-bg-color: var(--sesamy-bg-color, #F6DFDC);
      --s-font-family: var(--sesamy-font-family, Helvetica);
    }

    .base {
      font-family: var(--s-font-family);
      -webkit-font-smoothing: antialiased;
      
    }
  `;

  let style = '<sty' + 'le>' + libstyles + sesamyDesignTokens + '</style>';
</script>

<div class="base">
  {#await apiPromise then api}
    <slot {api}></slot>
  {:catch error}
    <p style="color: red">{error.message}</p>
  {/await}
</div>

{@html style}
