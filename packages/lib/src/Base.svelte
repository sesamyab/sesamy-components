<script lang="ts">
  // @ts-ignore
  import libstyles from "./app.css?inline";
  import { getApi } from "./api";

  const apiPromise = getApi();

  let style = "<sty" + "le>" + libstyles + "</style>";
</script>

{#await apiPromise then api}
  <slot {api}></slot>
{:catch error}
  <p style="color: red">{error.message}</p>
{/await}

{@html style}
