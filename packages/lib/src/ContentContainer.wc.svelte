<svelte:options customElement={{ tag: 'sesamy-content-container', shadow: 'open' }} />

<script lang="ts">
  import ApiBase from './ApiBase.svelte';
</script>

<ApiBase let:api>
  <h1>Inside</h1>
  <div>
    Version: {api.getVersion()}
  </div>
</ApiBase>
