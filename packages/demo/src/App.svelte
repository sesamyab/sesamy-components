<script lang="ts">
  import '../../lib';
  import NavBar from './components/NavBar.svelte';
  import { init } from '@sesamy/sesamy-js';

  let template = $state('ARTICLE');

  init({
    clientId: 'demo',
    environment: 'dev',
    api: {
      namespace: 'sesamy'
    }
  });
</script>

<svelte:head>
  <meta property="sesamy:price" content="1337" />
  <meta property="sesamy:currency" content="SEK" />
  <meta property="sesamy:publisher-content-id" content="some-id" />
  <meta property="sesamy:item-src" content="some-id" />
</svelte:head>

<main>
  <NavBar />
  <section class="content bg-gray-100">
    <select value={template} onchange={({ target: { value } }: any) => (template = value)}>
      <option value="ARTICLE">Article</option>
      <option value="BOXES">Boxes</option>
    </select>

    <div style="width: 800px;">
      <sesamy-paywall
        {template}
        settings-url="https://api.sesamy.dev/paywall/paywalls/test-fokus/ONh_7gBRk8U_L060YMUr2"
      ></sesamy-paywall>
    </div>

    <article>
      <h1>Sesamy Components Demo Page</h1>

      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc sed elit sollicitudin nisl
        condimentum suscipit vitae sed lacus. Nullam venenatis vestibulum eros vitae rutrum. Donec
        vel purus tempus metus vehicula fringilla. Donec id tempus libero. Morbi feugiat ante vel
        dignissim mollis. Phasellus vehicula, metus at condimentum molestie, nibh lectus ullamcorper
        lectus, quis tempus neque risus nec felis. Sed quis quam et leo vulputate luctus. Sed
        aliquet lobortis tincidunt. Nam mollis ligula ac mattis sagittis. Phasellus condimentum,
        sapien sit amet maximus fermentum, lacus risus sodales mi, luctus tincidunt leo massa nec
        lectus. Phasellus mattis eu nunc ac eleifend. Proin lobortis tortor non mauris vulputate
        ullamcorper. Cras commodo risus quis augue varius posuere.
      </p>
      <p>
        Aenean accumsan ultrices aliquam. Morbi euismod non eros vel pellentesque. Sed sed molestie
        neque, eget fermentum ligula. Sed varius, libero vitae rutrum fringilla, nulla sem ultrices
        turpis, sed porta ligula elit eu ipsum. Quisque eu egestas est. Pellentesque ut varius elit,
        non luctus massa. Ut blandit velit at condimentum interdum.
      </p>
    </article>
  </section>
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    height: 100vh;
    font-family: sans-serif;
  }

  .content {
    flex: 1;
    padding: 20px;
  }

  article {
    max-width: 800px;
    margin: 0 auto;
  }

  h1 {
    font-size: 2em;
    margin-bottom: 0.5em;
  }

  p {
    font-size: 1.2em;
    line-height: 1.5;
  }
</style>
