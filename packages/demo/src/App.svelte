<script lang="ts">
  import '../../lib';
  import NavBar from './components/NavBar.svelte';
  import { init } from '@sesamy/sesamy-js';

  let template = $state('ARTICLE');

  init({
    clientId: 'test-fokus',
    environment: 'dev',
    api: {
      namespace: 'sesamy'
    },
    content: {
      article: {
        article: { selector: 'sesamy-article' },
        image: { selector: 'img', attribute: 'src' },
        title: { selector: 'h1', attribute: 'textContent' },
        excerpt: { selector: 'p', attribute: 'textContent' },
        price: { selector: 'sesamy-article', attribute: 'price' },
        currency: { selector: 'sesamy-article', attribute: 'currency' },
        url: { selector: 'sesamy-article', attribute: 'item-src' },
        id: { selector: 'sesamy-article', attribute: 'publisher-content-id' },
        pass: { selector: 'sesamy-article', attribute: 'pass' }
      }
    }
  });
</script>

<svelte:head>
  <meta property="sesamy:price" content="1337" />
  <meta property="sesamy:currency" content="SEK" />
  <meta property="sesamy:publisher-content-id" content="some-id" />
</svelte:head>

<NavBar />

<main>
  <aside></aside>
  <section>
    <sesamy-article
      item-src="https://stage.fokus.se/aktuellt/lorem-ipsum-dolor-sit-amet-consectetur/"
      pass="sid:a1tdI9vbB6AEPhICVGQqD"
      price="19"
      currency="SEK"
      publisher-content-id="some-id"
    >
      <h1>Sesamy Components Demo Page</h1>
      <div class="article-body">
        <sesamy-content-container-beta
          item-src="https://stage.fokus.se/aktuellt/lorem-ipsum-dolor-sit-amet-consectetur/"
          lock-mode="proxy"
        >
          <div slot="preview">
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc sed elit sollicitudin
              nisl condimentum suscipit vitae sed lacus. Nullam venenatis vestibulum eros vitae
              rutrum. Donec vel purus tempus metus vehicula fringilla.
            </p>
            <select value={template} onchange={({ target: { value } }: any) => (template = value)}>
              <option value="ARTICLE">Article</option>
              <option value="BOXES">Boxes</option>
            </select>
            <!-- https://portal-3p5j01f6y.vercel.sesamy.dev/test-fokus/paywalls/ONh_7gBRk8U_L060YMUr2 -->
            <sesamy-paywall-beta
              {template}
              settings-url="https://api.sesamy.dev/paywall/paywalls/test-fokus/ONh_7gBRk8U_L060YMUr2"
              item-src="https://stage.fokus.se/aktuellt/lorem-ipsum-dolor-sit-amet-consectetur/"
              redirect-url="https://sesamy.com"
            ></sesamy-paywall-beta>
          </div>
        </sesamy-content-container-beta>
      </div>
    </sesamy-article>
    <p>More text below the article</p>
    <p>
      Aenean accumsan ultrices aliquam. Morbi euismod non eros vel pellentesque. Sed sed molestie
      neque, eget fermentum ligula. Sed varius, libero vitae rutrum fringilla, nulla sem ultrices
      turpis, sed porta ligula elit eu ipsum. Quisque eu egestas est. Pellentesque ut varius elit,
      non luctus massa. Ut blandit velit at condimentum interdum.
    </p>
  </section>
  <aside style="min-width: 319px;">
    <!-- <sesamy-paywall-beta
      {template}
      settings-url="https://api.sesamy.dev/paywall/paywalls/test-fokus/ONh_7gBRk8U_L060YMUr2"
    ></sesamy-paywall-beta> -->
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
