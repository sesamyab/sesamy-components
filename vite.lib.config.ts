import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { sveltePreprocess } from 'svelte-preprocess';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  build: {
    lib: {
      entry: 'packages/lib/index.ts',
      name: '@sesamy/sesamy-components',
      fileName: (format) => `sesamy-components.${format}.js`,
      formats: ['es', 'umd']
    },
    outDir: 'dist/lib',
    rollupOptions: {
      external: ['svelte', '@sesamy/sesamy-js'],
      output: {
        globals: {
          svelte: 'Svelte'
        }
      }
    }
  },
  plugins: [
    svelte({
      preprocess: sveltePreprocess(),
      compilerOptions: {
        customElement: true
      },
      include: ['packages/lib/**/*.wc.svelte']
    }),
    svelte({
      preprocess: sveltePreprocess(),
      compilerOptions: {
        customElement: false
      },
      exclude: ['**/*.wc.svelte']
    }),
    viteStaticCopy({
      targets: [
        {
          src: 'packages/lib/src/sesamy-components.d.ts',
          dest: ''
        }
      ]
    })
  ],

  resolve: {
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.svelte', '.wc.svelte']
  }
});
