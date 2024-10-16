<script lang="ts">
  import type { Snippet } from 'svelte';
  import Row from './Row.svelte';

  type Props = {
    id: string;
    name: string;
    checked?: boolean;
    children: Snippet;
    [key: string]: any;
  };

  let { id, name, checked, children, onchange, ...rest }: Props = $props();
</script>

<label class="p-4 row-left gap-4 w-full relative" for={id} {...rest}>
  <input {onchange} type="radio" class="hidden peer" {checked} {name} {id} />
  <div
    class="w-4 h-4 rounded-full transition-all bg-white border border-[#E7E7EC] relative peer-checked:border-primary peer-checked:bg-primary"
  >
    <div
      class="content-[''] absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full"
    ></div>
  </div>
  <Row class="flex-1 !justify-between" left up>
    {@render children()}
  </Row>
</label>
