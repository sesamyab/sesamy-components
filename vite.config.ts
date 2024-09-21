import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import pkg from "./package.json";
import dts from "vite-plugin-dts";
import sveltePreprocess from "svelte-preprocess";

const bundleComponents = process.env.BUNDLE_COMPONENTS ?? true;

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    minify: true,
    lib: {
      entry: "packages/lib/index.ts",
      formats: bundleComponents ? ["es", "umd"] : ["es"],
      name: pkg.name.replace(/-./g, (char) => char[1].toUpperCase()),
      fileName: (format) =>
        ({
          es: `${pkg.name}.js`,
          esm: `${pkg.name}.min.js`,
          umd: `${pkg.name}.umd.js`,
        }[format]),
    },
    rollupOptions: {
      output: bundleComponents
        ? {}
        : {
            inlineDynamicImports: false,
            chunkFileNames: "[name].js",
            manualChunks: { svelte: ["svelte"] },
          },
    },
  },
  plugins: [
    svelte({
      exclude: /\.wc\.svelte$/,
      preprocess: sveltePreprocess(),
      compilerOptions: {
        customElement: false,
      },
    }),
    svelte({
      include: /\.wc\.svelte$/,
      preprocess: sveltePreprocess(),
      compilerOptions: {
        customElement: true,
      },
    }),
    dts({
      include: [
        "packages/lib/**/*.ts",
        "packages/lib/**/*.svelte",
        "packages/lib/**/*.wc.svelte",
        "packages/lib/index.ts",
      ],
      beforeWriteFile: (filePath, content) => ({
        filePath: filePath.replace("src/", "/@sesamy"),
        content,
      }),
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

// Minify ES function remains the same
function minifyEs() {
  // ... (keep your existing minifyEs function)
}
