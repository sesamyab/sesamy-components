<svelte:options customElement="sesamy-login-menu-item" />

<script lang="ts">
  import type { SesamyAPI } from '@sesamy/sesamy-js';
  import type { TranslationFunction } from 'src/i18n';

  type Props = {
    type: 'EMAIL' | 'ACCOUNT' | 'LOGOUT' | 'LINK';
    api: SesamyAPI;
    t: TranslationFunction;
    loading?: boolean;
    href?: string;
    text?: string;
  };
  let { api, t, type, loading, href, text }: Props = $props();

  const logout = async (api: SesamyAPI) => {
    loading = true;
    try {
      await api.auth.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
</script>

{#if type === 'EMAIL'}
  {#await api.auth.getUser() then user}
    <li class="p-4 border-b border-[color:--s-login-popup-border-color] text-base">
      <span class="line-clamp-1 break-all">{user?.email}</span>
    </li>
  {/await}
{:else if type === 'ACCOUNT'}
  <li class="border-b border-[color:--s-login-popup-border-color] text-sm font-bold">
    <a
      class="block w-full text-left px-4 py-3 hover:bg-gray-100/50"
      href={'https://sesamy.com'}
      target="_blank"
    >
      {text || t('my_account')}
    </a>
  </li>
{:else if type === 'LOGOUT'}
  <li class="text-sm font-bold">
    <button
      class="block w-full text-left px-4 py-3 hover:bg-gray-100/50"
      onclick={() => logout(api)}>{text || t('logout')}</button
    >
  </li>
{:else if type === 'LINK' && href && text}
  <li class="text-sm font-bold">
    <button
      class="block w-full text-left px-4 py-3 hover:bg-gray-100/50"
      onclick={() => {
        window.location.href = href;
      }}>{text}</button
    >
  </li>
{/if}
