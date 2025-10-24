<script lang="ts">
  import type { SesamyAPI } from '@sesamy/sesamy-js';
  import type { TranslationFunction } from '../i18n';

  type Props = {
    api: SesamyAPI;
    t: TranslationFunction;
    type: 'EMAIL' | 'ACCOUNT' | 'LOGOUT' | 'LINK';
    href?: string;
    target?: string;
    text?: string;
  };

  let { api, t, type, href, target = '_self', text }: Props = $props();

  const logout = async (api: SesamyAPI) => {
    try {
      await api.auth.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
</script>

<div class="border-b border-[color:--s-login-popup-border-color] text-sm font-bold">
  {#if type === 'EMAIL'}
    {#await api.auth.getUser() then user}
      <div class="p-4 text-base">
        <span class="line-clamp-1 break-all font-normal">{user?.email}</span>
      </div>
    {/await}
  {:else if type === 'ACCOUNT'}
    {#await api.generateLink({ target: 'account' }) then accountLink}
      <a
        class="block w-full text-left px-4 py-3 hover:bg-gray-100/50"
        href={accountLink}
        target="_blank"
      >
        {text || t('my_account')}
      </a>
    {/await}
  {:else if type === 'LOGOUT'}
    <button
      class="block w-full text-left px-4 py-3 hover:bg-gray-100/50"
      onclick={() => logout(api)}>{text || t('logout')}</button
    >
  {:else if type === 'LINK' && href && text}
    <a {href} {target} class="block w-full text-left px-4 py-3 hover:bg-gray-100/50">{text}</a>
  {/if}
</div>
