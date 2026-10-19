import { defineConfig } from 'vite';

// Builds dist/lib/phone-lib.js: libphonenumber-js as a standalone ES module that the phone
// input imports at runtime. Runs after vite.lib.config.ts, so it must not empty dist/lib.
// Not built in lib mode, which leaves es output unminified.
export default defineConfig({
  build: {
    outDir: 'dist/lib',
    emptyOutDir: false,
    copyPublicDir: false,
    minify: 'esbuild',
    rollupOptions: {
      input: 'packages/lib/phone-lib.ts',
      preserveEntrySignatures: 'strict',
      output: { format: 'es', entryFileNames: 'phone-lib.js' }
    }
  }
});
