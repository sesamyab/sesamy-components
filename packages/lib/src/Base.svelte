<script lang="ts">
  import libstyles from "./app.css?inline";
  import { getApi } from "./api";

  const apiPromise = getApi({
    clientId: "demo",
    environment: "dev",
  });

  let style = "<sty" + "le>" + libstyles + "</style>";
</script>

{#await apiPromise}
  <p>Loading sesamy-js...</p>
{:then api}
  <slot {api}></slot>
{:catch error}
  <p style="color: red">{error.message}</p>
{/await}

{@html style}
