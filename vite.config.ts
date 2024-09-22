import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import dts from "vite-plugin-dts";
import sveltePreprocess from "svelte-preprocess";
import path from "path";

export default defineConfig({
  build: {
    lib: {
      entry: "packages/lib/index.ts",
      name: "@sesamy/sesamy-components",
      fileName: (format) => `sesamy-components.${format}.js`,
      formats: ["es", "umd"],
    },
    outDir: "dist/lib",
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
      outDir: "dist/lib",
      rollupTypes: true,
      compilerOptions: {
        baseUrl: "packages/lib",
        paths: {
          "*": ["*", "*.svelte", "*.wc.svelte"],
        },
      },
      beforeWriteFile: (filePath, content) => {
        if (filePath.endsWith("index.d.ts")) {
          // Modify the content to include explicit type definitions
          content = `
import { SvelteComponent } from 'svelte';

export class Login extends SvelteComponent {
  $$prop_def: {
    buttonText?: string;
    onLogin?: (event: CustomEvent) => void;
  }
}

export class Paywall extends SvelteComponent {
  // Add Paywall properties here
}

${content}
          `;
        }
        return { filePath, content };
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
    alias: {
      "@sesamy/sesamy-components": path.resolve(
        __dirname,
        "packages/lib/src/sesamy-components.d.ts",
      ),
    },
  },
});
