<script lang="ts">
  import Row from './Row.svelte';
  import Icon from './Icon.svelte';

  type Props = {
    text: string;
  };
  let { text }: Props = $props();
</script>

<Row
  role="alert"
  left
  class="w-full gap-2 rounded-md border border-red-500 bg-red-500/10 p-3 text-sm leading-tight font-bold text-red-500 !flex-nowrap"
>
  <Icon name="info" class="shrink-0 text-2xl -translate-y-px" />
  <span>{text}</span>
</Row>
