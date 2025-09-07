<script lang="ts">
  import Icon from '../Icon.svelte';
  import type { TranslationFunction } from 'src/i18n';

  type Props = {
    description: string;
    readMoreLink?: string;
    readMoreText?: string;
    t: TranslationFunction;
    class?: string;
  };

  let { description, readMoreLink, readMoreText, t, class: className = '' }: Props = $props();
</script>

<div class="markdown-container {className}">
  {@html description}
  {#if readMoreLink}
    <a href={readMoreLink} class="inline-link with-icon">
      <span>{readMoreText || t('read_more')}</span>
      <Icon name="arrow-up-right-from-square" />
    </a>
  {/if}
</div>
