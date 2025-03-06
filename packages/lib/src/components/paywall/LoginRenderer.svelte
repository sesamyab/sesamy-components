<script lang="ts">
  import type { SesamyAPI } from '@sesamy/sesamy-js';
  import AppleLogo from '../../assets/AppleLogo.svelte';
  import FacebookLogo from '../../assets/FacebookLogo.svelte';
  import GoogleLogo from '../../assets/GoogleLogo.svelte';

  type Props = {
    api: SesamyAPI;
  };

  let { api }: Props = $props();

  const login = async (api: SesamyAPI) => {
    try {
      await api.auth.loginWithRedirect();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
</script>

<div
  class="max-w-[800px] mx-auto p-5 text-center bg-[#f8f8f5] border border-[#e9e9da] rounded-lg font-sans"
>
  <slot name="title">
    <h1 class="text-2xl font-bold mb-2.5">Skapa ett gratis konto eller logga in</h1>
  </slot>
  <slot name="description">
    <p class="text-sm mb-5 text-gray-600">Få tillgång till gratis artiklar och nyhetsbrev.</p>
  </slot>

  <div class="w-full">
    <input
      type="email"
      id="email"
      placeholder="Skriv in din epost"
      class="w-full p-2.5 mb-2.5 border border-gray-300 rounded-md box-border"
    />

    <button
      part="continueButton"
      class="w-full p-2.5 bg-[#4285f4] text-white border-none rounded-md cursor-pointer mb-2.5 text-sm"
      onclick={() => login(api)}>Fortsätt</button
    >

    <div
      class="my-4 text-center relative text-gray-500 before:content-[''] before:absolute before:top-1/2 before:left-0 before:w-[45%] before:h-px before:bg-gray-300 after:content-[''] after:absolute after:top-1/2 after:right-0 after:w-[45%] after:h-px after:bg-gray-300"
    >
      eller
    </div>

    <button
      onclick={() => login(api)}
      class="w-full p-2.5 bg-white text-black border border-gray-300 rounded-md cursor-pointer mb-2.5 text-sm flex justify-center items-center"
    >
      <span class="flex items-center justify-center">
        <GoogleLogo width="18" height="18" />
        <span class="ml-2">Fortsätt med Google</span>
      </span>
    </button>

    <button
      onclick={() => login(api)}
      class="w-full p-2.5 bg-white text-black border border-gray-300 rounded-md cursor-pointer mb-2.5 text-sm flex justify-center items-center"
    >
      <span class="flex items-center justify-center">
        <FacebookLogo width="18" height="18" />
        <span class="ml-2">Fortsätt med Facebook</span>
      </span>
    </button>

    <button
      onclick={() => login(api)}
      class="w-full p-2.5 bg-white text-black border border-gray-300 rounded-md cursor-pointer mb-2.5 text-sm flex justify-center items-center"
    >
      <span class="flex items-center justify-center">
        <AppleLogo width="18" height="18" />
        <span class="ml-2">Fortsätt med Apple</span>
      </span>
    </button>
  </div>

  <p class="text-xs mt-5 text-gray-500">
    Genom att logga in godkänner du våra <a href="#terms" class="text-[#4285f4] no-underline"
      >Vilkor</a
    >
  </p>
</div>
