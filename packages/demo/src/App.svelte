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

<NavBar />

<main>
  <aside></aside>
  <section>
    <article>
      <h1>Sesamy Components Demo Page</h1>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc sed elit sollicitudin nisl
        condimentum suscipit vitae sed lacus. Nullam venenatis vestibulum eros vitae rutrum. Donec
        vel purus tempus metus vehicula fringilla.
      </p>
      <select value={template} onchange={({ target: { value } }: any) => (template = value)}>
        <option value="ARTICLE">Article</option>
        <option value="BOXES">Boxes</option>
      </select>
      <!-- https://portal-3p5j01f6y.vercel.sesamy.dev/test-fokus/paywalls/ONh_7gBRk8U_L060YMUr2 -->
      <sesamy-paywall
        {template}
        settings-url="https://api.sesamy.dev/paywall/paywalls/test-fokus/ONh_7gBRk8U_L060YMUr2"
      ></sesamy-paywall>

      <p>
        Aenean accumsan ultrices aliquam. Morbi euismod non eros vel pellentesque. Sed sed molestie
        neque, eget fermentum ligula. Sed varius, libero vitae rutrum fringilla, nulla sem ultrices
        turpis, sed porta ligula elit eu ipsum. Quisque eu egestas est. Pellentesque ut varius elit,
        non luctus massa. Ut blandit velit at condimentum interdum.
      </p>
    </article>
  </section>
  <aside style="min-width: 319px;">
    <sesamy-paywall
      {template}
      settings-url="https://api.sesamy.dev/paywall/paywalls/test-fokus/ONh_7gBRk8U_L060YMUr2"
    ></sesamy-paywall>
  </aside>
</main>

<style>
  main {
    display: flex;
    flex-direction: row;
  }

  aside {
    flex: 1;
    padding: 24px;
  }

  section {
    margin: 0 auto;
    max-width: 800px;
    padding: 40px;
    background: rgb(243 244 246);
    box-shadow: 0px 0px 24px rgba(0, 0, 0, 0.25);
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
