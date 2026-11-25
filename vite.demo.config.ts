import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const demoRoot = resolve(__dirname, 'packages/demo');

// https://vitejs.dev/config/
export default defineConfig({
  root: './packages/demo/',
  resolve: {
    dedupe: ['svelte']
  },
  server: {
    // Wallet buttons need HTTPS on a domain registered with Stripe, so the
    // express checkout demo is reached through a tunnel to this server:
    // DEMO_ALLOWED_HOSTS=my-tunnel.example.com yarn dev
    allowedHosts: process.env.DEMO_ALLOWED_HOSTS?.split(',').map((host) => host.trim())
  },
  build: {
    outDir: '../../dist',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        main: resolve(demoRoot, 'index.html'),
        expressCheckout: resolve(demoRoot, 'express-checkout.html')
      }
    }
  },
  plugins: [
    svelte({
      exclude: /\.wc\.svelte$/ as any,
      hot: false
    }),
    svelte({
      include: /\.wc\.svelte$/ as any,
      hot: false,
      compilerOptions: {
        customElement: true
      }
    }),
    {
      name: 'add-webcomponent',
      transformIndexHtml(html) {
        // Inject the library bundle to register web components
        return html.replace(
          '</head>',
          `<script type="module" crossorigin src="/lib/sesamy-components.es.js"></script>
          </head>`
        );
      }
    }
  ]
});
