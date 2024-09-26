<svelte:options customElement="sesamy-avatar" />

<script lang="ts">
  import Base from "./Base.svelte";

  export let src = "";
  export let alt = "Avatar";
  export let size = "md";
  export let loading = false;

  const sizeClasses: Record<string, string> = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const spinnerSizes: Record<string, string> = {
    sm: "w-10 h-10",
    md: "w-14 h-14",
    lg: "w-18 h-18",
  };

  export let onclick = () => {};
</script>

<Base>
  {#if loading}
    <svg
      class={`absolute ${sizeClasses[size]}`}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="50"
        cy="50"
        r="45"
        stroke-width="10"
        stroke="#3B82F6"
        fill="none"
        stroke-dasharray="283"
        stroke-dashoffset="283"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 50 50"
          to="360 50 50"
          dur="1s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="stroke-dashoffset"
          values="283;0"
          dur="1s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  {/if}
  <button
    type="button"
    class={`relative inline-block ${sizeClasses[size]} rounded-full overflow-hidden bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
    {onclick}
    onkeydown={(e) => e.key === "Enter" && onclick}
    aria-label={alt}
  >
    {#if src}
      <img {src} {alt} class="w-full h-full object-cover" />
    {:else}
      <div class="flex items-center justify-center w-full h-full text-gray-500">
        {alt.charAt(0).toUpperCase()}
      </div>
    {/if}
  </button>
</Base>
