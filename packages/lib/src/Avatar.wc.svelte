<svelte:options customElement={{ shadow: 'open' }} />

<script lang="ts">
  import Base from './Base.svelte';
  import AvatarRenderer from './components/AvatarRenderer.svelte';

  type Props = {
    src?: string;
    alt?: string;
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
  };

  let props: Props = $props();
</script>

<Base>
  <AvatarRenderer {...props} />
</Base>
