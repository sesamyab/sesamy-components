import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// https://vitejs.dev/config/
export default defineConfig({
  root: './packages/demo/',
  resolve: {
    dedupe: ['svelte']
  },
  build: {
    outDir: '../../dist',
    emptyOutDir: false
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
