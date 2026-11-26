<script lang="ts">
  // Express checkout demo: the ACME article paywall on dev with
  // `express-checkout` on. See the PR for the real-device steps. Wallet
  // buttons only show over HTTPS on a domain registered with Stripe, in a
  // browser with a wallet set up, never in a headless browser.
  import '../../lib';
  import { init, type Config } from '@sesamy/sesamy-js';
  import { createAuth0Plugin } from '@sesamy/sesamy-js/auth0-plugin';
  import { onMount } from 'svelte';

  // The Stripe platform publishable key, test mode only. Never committed:
  // from the VITE_STRIPE_PUBLISHABLE_KEY environment variable, or `?pk=`.
  const candidate =
    new URLSearchParams(window.location.search).get('pk') ||
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
    '';
  const publishableKey = candidate.startsWith('pk_test_') ? candidate : '';
  const refusedKey = !!candidate && !publishableKey;

  const config: Config = {
    clientId: 'acme',
    vendorId: 'acme',
    environment: 'dev',
    api: { namespace: 'sesamy' },
    content: [
      {
        type: 'article',
        selectors: {
          article: { selector: 'sesamy-article' },
          title: { selector: 'h1', attribute: 'textContent' },
          price: { selector: 'sesamy-article', attribute: 'price' },
          currency: { selector: 'sesamy-article', attribute: 'currency' },
          url: { selector: 'sesamy-article', attribute: 'item-src' },
          id: { selector: 'sesamy-article', attribute: 'publisher-content-id' },
          pass: { selector: 'sesamy-article', attribute: 'pass' }
        }
      }
    ]
  };

  init(config, { authPlugin: createAuth0Plugin() });

  let log = $state<string[]>([]);
  onMount(() => {
    const events = [
      'sesamyUnlocked',
      'sesamyEntitlementsChanged',
      'sesamyJsAuthenticated',
      'sesamyJsLogout'
    ];
    const handler = (event: Event) =>
      (log = [...log, `${new Date().toLocaleTimeString()} ${event.type}`]);
    events.forEach((name) => window.addEventListener(name, handler));
    return () => events.forEach((name) => window.removeEventListener(name, handler));
  });
</script>

<nav>
  <strong>Express checkout demo (ACME on dev, Stripe test mode)</strong>
  <sesamy-login></sesamy-login>
</nav>

<main>
  {#if !publishableKey}
    <p class="notice">
      {#if refusedKey}
        Only a Stripe <code>pk_test_</code> key is accepted here.
      {:else}
        No Stripe publishable key. Open this page with <code>?pk=pk_test_…</code> or start the dev
        server with <code>VITE_STRIPE_PUBLISHABLE_KEY</code> set. Without it the paywall stays on the
        normal checkout.
      {/if}
    </p>
  {/if}

  <sesamy-article
    publisher-content-id="express-demo-1"
    item-src="https://acme.sesamy.dev/express-checkout-demo"
    price="13.37"
    currency="SEK"
    pass="https://sesamy.dev/digital"
  >
    <h1>An ACME article you can buy with Apple Pay or Google Pay</h1>
    <sesamy-content-container>
      <div slot="preview">
        <p>
          This is the preview. Sign in, pick ACME Premium or the single article, and pay with the
          wallet button. The article unlocks here, without leaving the page.
        </p>
      </div>
      <div slot="content">
        <p>This is the full article. The purchase unlocked it in place.</p>
      </div>
    </sesamy-content-container>

    <!-- ACME's ARTICLE paywall on dev: ACME Premium monthly and yearly, plus the single article. -->
    <sesamy-paywall
      settings-url="https://api.sesamy.dev/paywall/paywalls/acme/OxHlsEHTUGs1tpF6EoRy8"
      express-checkout
      stripe-publishable-key={publishableKey}
    ></sesamy-paywall>
  </sesamy-article>

  <section>
    <h2>Events</h2>
    <ul>
      {#each log as line}
        <li><code>{line}</code></li>
      {/each}
    </ul>
  </section>
</main>

<style>
  nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1em;
    padding: 1em;
    background: lightgray;
  }

  main {
    margin: 0 auto;
    max-width: 800px;
    padding: 16px;
  }

  .notice {
    padding: 1em;
    border: 1px solid #d97706;
    background: #fffbeb;
    margin-bottom: 1em;
  }

  h1 {
    font-size: 2em;
    margin: 0.5em 0;
  }

  h2 {
    font-size: 1.2em;
    margin-top: 2em;
  }

  p {
    font-size: 1.1em;
    line-height: 1.5;
    padding: 0 0 1em;
  }
</style>
