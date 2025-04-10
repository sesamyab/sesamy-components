<svelte:options customElement="sesamy-login-menu-item" />

<script lang="ts">
  import Base from './Base.svelte';
  import LoginMenuItem from './components/LoginMenuItem.svelte';

  type Props = {
    type: 'EMAIL' | 'ACCOUNT' | 'LOGOUT' | 'LINK';
    href?: string;
    text?: string;
  };

  let { text, href }: Props = $props();
</script>

<Base let:api let:t>
  <LoginMenuItem type="EMAIL" {api} {t} {text} {href} />
</Base>
