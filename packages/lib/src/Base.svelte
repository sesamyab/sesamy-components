<script lang="ts">
  import { getApi } from "./api";

  const apiPromise = getApi({
    clientId: "demo",
    environment: "dev",
  });
</script>

{#await apiPromise}
  <p>Loading sesamy-js...</p>
{:then api}
  <slot {api}></slot>
{:catch error}
  <p style="color: red">{error.message}</p>
{/await}

<style>
</style>
