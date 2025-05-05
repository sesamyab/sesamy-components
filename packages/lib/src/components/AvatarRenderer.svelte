<script lang="ts">
  import { twMerge } from 'tailwind-merge';

  export let src = '';
  export let alt = 'Avatar';
  export let size = 'md';
  export let loading = false;
</script>

<span
  class={twMerge(
    'relative block group rounded-full overflow-hidden border-2 bg-[color:--s-login-button-background-color] text-[color:--s-login-button-text-color] border-[color:--s-login-button-border-color]',
    size === 'sm' && 'w-8 h-8',
    size === 'md' && 'w-12 h-12',
    size === 'lg' && 'w-16 h-16'
  )}
>
  {#if loading}
    <span class="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-3/4 h-3/4">
      <svg
        class="animate-spin w-full h-full"
        viewBox="0 0 125 125"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 62.5C0 28 28 0 62.5 0v18.8c-24.2 0-43.8 19.6-43.8 43.8H0z"
          class="fill-current"
        />
      </svg>
    </span>
  {:else if src}
    <img
      {src}
      {alt}
      class="w-full h-full object-cover group-hover:opacity-80 transition-opacity duration-100"
    />
  {:else}
    <span class="row absolute top-0 left-0 w-full h-full">
      {alt.charAt(0).toUpperCase()}
    </span>
  {/if}
</span>
