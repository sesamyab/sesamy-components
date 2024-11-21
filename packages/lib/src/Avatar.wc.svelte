<svelte:options customElement="sesamy-avatar-beta" />

<script lang="ts">
  import { twMerge } from 'tailwind-merge';
  import Base from './Base.svelte';
  import Row from './components/Row.svelte';

  export let src = '';
  export let alt = 'Avatar';
  export let size = 'md';
  export let loading = false;

  export let onclick = () => {};
</script>

<Base>
  <Row class="relative inline-block">
    <button
      type="button"
      class={twMerge(
        'relative inline-block rounded-full overflow-hidden bg-purple-500',
        size === 'sm' && 'w-8 h-8',
        size === 'md' && 'w-12 h-12',
        size === 'lg' && 'w-16 h-16'
      )}
      {onclick}
      onkeydown={(e) => e.key === 'Enter' && onclick}
      aria-label={alt}
    >
      {#if loading}
        <div class="absolute left-[50%] -translate-x-[50%] top-[50%] -translate-y-[50%]">
          <svg
            class={twMerge(
              'animate-spin',
              size === 'sm' && 'w-7 h-7',
              size === 'md' && 'w-10 h-10',
              size === 'lg' && 'w-14 h-14'
            )}
            viewBox="0 0 125 125"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 62.5C0 28 28 0 62.5 0v18.8c-24.2 0-43.8 19.6-43.8 43.8H0z"
              style="fill:white;"
            />
          </svg>
        </div>
      {:else if src}
        <img {src} {alt} class="w-full h-full object-cover" />
      {:else}
        <Row class="absolute top-0 left-0 w-full h-full text-white">
          {alt.charAt(0).toUpperCase()}
        </Row>
      {/if}
    </button>
  </Row>
</Base>
