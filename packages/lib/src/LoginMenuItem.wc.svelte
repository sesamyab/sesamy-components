<svelte:options customElement={{ shadow: 'open' }} />

<script lang="ts">
  import Base from './Base.svelte';
  import LoginMenuItemRenderer from './components/LoginMenuItemRenderer.svelte';

  type Props = {
    type: 'EMAIL' | 'ACCOUNT' | 'LOGOUT' | 'LINK';
    href?: string;
    target?: string;
    text?: string;
  };

  let props: Props = $props();
</script>

<Base let:api let:t>
  <LoginMenuItemRenderer {api} {t} {...props} />
</Base>
