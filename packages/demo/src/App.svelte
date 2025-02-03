<script lang="ts">
  import '../../lib';
  import NavBar from './components/NavBar.svelte';
  import { init } from '@sesamy/sesamy-js';

  init({
    clientId: 'kvartal',
    environment: 'dev',
    api: {
      namespace: 'sesamy'
    }
  });
</script>

<NavBar />

<main>
  <aside></aside>
  <section>
    <article>
      <h1>Sesamy article with remote content</h1>
      <div class="article-body">
        <sesamy-content-container
          item-src="https://stage.fokus.se/aktuellt/lorem-ipsum-dolor-sit-amet-consectetur/"
          lock-mode="proxy"
          locked-content-selector="article"
        >
          <div slot="preview">
            <p>
              Apples trådlösa hörlurar AirPods har kommit i en hel rad olika varianter och utgåvor
              sedan de först lanserades i september 2016. Den tidlösa designen tilltalar många, men
              smakar det så kostar det. <br />Den som vill lägga vantarna på ett par nya AirPods i
              dag behöver vara beredd att punga upp åtminstone 1 800 kronor, och de nyare modellerna
              ligger på nästan dubbelt så mycket.
            </p>
          </div>
        </sesamy-content-container>

        <sesamy-paywall
          settings-url="https://api.sesamy.dev/paywall/paywalls/kvartal/gzWoe_jBIGTLDpgS-K2dV"
        ></sesamy-paywall>
      </div>
    </article>
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
