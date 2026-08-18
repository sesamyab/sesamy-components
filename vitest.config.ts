import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { sveltePreprocess } from 'svelte-preprocess';

export default defineConfig({
  // Compile every component as a plain Svelte component here, including the *.wc.svelte
  // ones: tests mount them directly rather than through the custom element registry.
  plugins: [
    svelte({
      preprocess: sveltePreprocess(),
      compilerOptions: { customElement: false }
    })
  ],
  resolve: {
    conditions: ['browser'],
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.svelte', '.wc.svelte']
  },
  test: {
    environment: 'jsdom',
    include: ['packages/lib/**/*.test.ts'],
    globals: false
  }
});
