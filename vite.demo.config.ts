import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// https://vitejs.dev/config/
export default defineConfig({
  root: "./packages/demo/",
  resolve: {
    dedupe: ["svelte"],
  },
  build: {
    outDir: "../../dist",
    emptyOutDir: true,
  },
  plugins: [
    svelte({
      exclude: /\.wc\.svelte$/ as any,
      hot: false,
    }),
    svelte({
      include: /\.wc\.svelte$/ as any,
      hot: false,
      compilerOptions: {
        customElement: true,
      },
    }),
    {
      name: "add-webcomponent",
      transformIndexHtml(html) {
        // Return the modified HTML or the original one.
        // This ensures Vite doesn't touch specific links or script tags.
        return html.replace(
          "</head>",
          `<script type="module" crossorigin src="/lib/sesamy-components.es.js"></script>
          </head>`,
        );
      },
    },
  ],
});
