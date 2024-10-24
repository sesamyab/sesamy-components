<script lang="ts">
  import Row from './Row.svelte';

  type Props = {
    text: string;
  };
  let { text }: Props = $props();
</script>

<Row class="text-red-500 w-full">
  {text}
</Row>
