<script lang="ts">
  import '../../lib';
  import NavBar from './components/NavBar.svelte';
  import { init } from '@sesamy/sesamy-js';
  import { onMount } from 'svelte';

  init({
    clientId: 'acme',
    vendorId: 'acme',
    environment: 'dev',
    api: {
      namespace: 'sesamy'
    }
  });

  onMount(() => {
    // Listen for all custom events on the document
    const handler = (event: Event) => {
      console.log('Custom event:', event.type, event);
    };

    [
      'sesamyPaywallAccessChecked',
      'sesamyPaywallProductSelected',
      'sesamyPaywallCheckoutRedirect'
    ].forEach((eventName) => {
      window.addEventListener(eventName, handler as EventListener, true);
      console.log(`Listening for ${eventName} events`);
    });
  });
</script>

<NavBar />

<main>
  <section>
    <sesamy-article
      publisher-content-id="1"
      item-src="https://acme.sesamy.dev/test-article"
      price="13.37"
      pass="https://sesamy.dev/digital"
    >
      <h1>Sesamy article with remote content</h1>
      <div class="article-body">
        <sesamy-content-container>
          <div slot="preview">
            <p>This is the preview for an article locked with a pass.</p>
          </div>
          <div slot="content">
            <p>
              This is the full article. You can read it because you have a pass or have purchased
              access to it.
            </p>
          </div>
        </sesamy-content-container>

        <sesamy-paywall
          settings-url="https://api.sesamy.dev/paywall/paywalls/acme/OxHlsEHTUGs1tpF6EoRy8"
        ></sesamy-paywall>
      </div>
    </sesamy-article>
  </section>
  <section>
    <sesamy-article publisher-content-id="2">
      <h1>Sesamy article for logged in users</h1>
      <div class="article-body">
        <sesamy-content-container lock-mode="embed" access-level="logged-in">
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
          <div slot="below-headline">Provide your email address to get started</div>
        </sesamy-paywall>
      </div>
    </sesamy-article>
  </section>
  <section>
    <h1>BOXES paywall</h1>
    <sesamy-paywall
      settings-url="https://api.sesamy.dev/paywall/paywalls/acme/Zt9jY_Ioc4SS6YG9hRkqp"
    ></sesamy-paywall>
  </section>
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
  }

  section {
    margin: 0 auto;
    width: 100%;
    max-width: 1200px;
    padding: 40px;
  }

  h1 {
    font-size: 2em;
    margin-bottom: 0.5em;
  }

  p {
    font-size: 1.2em;
    line-height: 1.5;
    padding: 0 0 1em;
  }
</style>
