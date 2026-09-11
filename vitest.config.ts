import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { sveltePreprocess } from 'svelte-preprocess';

const resolve = {
  conditions: ['browser'],
  extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.svelte', '.wc.svelte']
};

export default defineConfig({
  test: {
    projects: [
      {
        // Compile every component as a plain Svelte component, including the
        // *.wc.svelte ones: these tests mount them directly rather than through
        // the custom element registry.
        plugins: [
          svelte({
            preprocess: sveltePreprocess(),
            compilerOptions: { customElement: false }
          })
        ],
        resolve,
        test: {
          name: 'unit',
          environment: 'jsdom',
          include: ['packages/lib/**/*.test.ts'],
          exclude: ['packages/lib/**/*.wc.test.ts'],
          globals: false
        }
      },
      {
        // Compile *.wc.svelte into real custom elements, so a test can exercise
        // a component the way a publisher page does: `document.createElement`,
        // light DOM children, `$host()`. Components without
        // `<svelte:options customElement>` are unaffected by the flag.
        plugins: [
          svelte({
            preprocess: sveltePreprocess(),
            compilerOptions: { customElement: true }
          })
        ],
        resolve,
        test: {
          name: 'custom-elements',
          environment: 'jsdom',
          include: ['packages/lib/**/*.wc.test.ts'],
          globals: false
        }
      }
    ]
  }
});
