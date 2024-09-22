import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import dts from "vite-plugin-dts";
import sveltePreprocess from "svelte-preprocess";

export default defineConfig({
  build: {
    lib: {
      entry: "packages/lib/index.ts",
      name: "@sesamy/sesamy-components",
      fileName: (format) => `index.${format}.js`,
      formats: ["es", "umd"],
    },
    outDir: "dist",
    rollupOptions: {
      external: ["svelte"],
      output: {
        globals: {
          svelte: "Svelte",
        },
      },
    },
  },
  plugins: [
    svelte({
      preprocess: sveltePreprocess(),
      compilerOptions: {
        customElement: true,
      },
      include: ["packages/lib/**/*.wc.svelte"],
    }),
    svelte({
      preprocess: sveltePreprocess(),
      compilerOptions: {
        customElement: false,
      },
      exclude: ["**/*.wc.svelte"],
    }),
    dts({
      include: [
        "packages/lib/**/*.ts",
        "packages/lib/**/*.svelte",
        "packages/lib/**/*.wc.svelte",
      ],
      beforeWriteFile: (filePath, content) => ({
        filePath: filePath.replace("packages/lib/", ""),
        content,
      }),
      rollupTypes: true,
      outDir: "dist",
      compilerOptions: {
        baseUrl: "packages/lib",
        paths: {
          "*": ["*", "*.svelte", "*.wc.svelte"],
        },
      },
    }),
  ],
  resolve: {
    extensions: [
      ".mjs",
      ".js",
      ".ts",
      ".jsx",
      ".tsx",
      ".json",
      ".svelte",
      ".wc.svelte",
    ],
  },
});
