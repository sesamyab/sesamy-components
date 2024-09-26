<svelte:options customElement="sesamy-button" />

<script lang="ts">
  export let outline = true;
  export let loading = false;
  export let disabled = false;
  export let onclick = () => {};
  export let href = "";
</script>

{#if href && !disabled && !loading}
  <a {href} class="button" class:outline {onclick}><slot /></a>
{:else}
  <button
    class="button bg-yellow-500"
    class:outline
    class:disabled
    {disabled}
    {onclick}
  >
    {#if loading}
      <span class="loader"></span>
    {/if}
    <slot />
  </button>
{/if}

<style>
  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 6px 16px;
    font-size: 14px;
    font-weight: normal;
    line-height: 1.5;
    text-align: center;
    white-space: nowrap;
    vertical-align: middle;
    cursor: pointer;
    user-select: none;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    transition: all 0.2s ease-in-out;
  }

  .button:not(.outline) {
    color: #ffffff;
    background-color: #374151;
    border-color: #374151;
  }

  .button:not(.outline):hover:not(.disabled) {
    background-color: #4b5563;
    border-color: #4b5563;
  }

  .button.outline {
    color: #d1d5db;
    background-color: transparent;
    border-color: #d1d5db;
  }

  .button.outline:hover:not(.disabled) {
    background-color: rgba(243, 244, 246, 0.1);
  }

  .button.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .loader {
    display: inline-block;
    width: 1em;
    height: 1em;
    margin-right: 0.5em;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spin 0.75s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
