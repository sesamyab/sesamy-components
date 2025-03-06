<script lang="ts">
  import '../../lib';
  import NavBar from './components/NavBar.svelte';
  import { init } from '@sesamy/sesamy-js';

  init({
    clientId: 'test-fokus',
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
  <meta
    property="sesamy:item-src"
    content="https://stage.fokus.se/aktuellt/lorem-ipsum-dolor-sit-amet-consectetur/"
  />
  <meta property="sesamy:pass" content="sid:a1tdI9vbB6AEPhICVGQqD" />
</svelte:head>

<NavBar />

<main>
  <aside></aside>
  <section>
    <sesamy-article publisher-content-id="1">
      <h1>Sesamy article with remote content</h1>
      <div class="article-body">
        <sesamy-content-container lock-mode="proxy" locked-content-selector="article">
          <div slot="preview">
            <p>This is the preview for an article locked with a pass.</p>
          </div>
        </sesamy-content-container>

        <sesamy-paywall
          settings-url="https://api.sesamy.dev/paywall/paywalls/test-fokus/ONh_7gBRk8U_L060YMUr2"
          redirect-url="https://sesamy.com"
        ></sesamy-paywall>
      </div>
    </sesamy-article>
  </section>
  <section>
    <sesamy-article publisher-content-id="2" access-level="logged-in">
      <h1>Sesamy article for logged in users</h1>
      <div class="article-body">
        <sesamy-content-container lock-mode="embed">
          <div slot="preview">
            <p>
              This article is locked for non-logged in users. Please log in to read the full
              article.
            </p>
          </div>
          <div slot="content">
            <p>
              This article is only available for logged in users. As you now are logged in you can
              read the full article
            </p>
          </div>
        </sesamy-content-container>

        <sesamy-paywall
          settings-url="https://api.sesamy.dev/paywall/paywalls/acme/yn1wE5pJQgIXIfoQrLBqb"
        >
        </sesamy-paywall>
      </div>
    </sesamy-article>
  </section>
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
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
