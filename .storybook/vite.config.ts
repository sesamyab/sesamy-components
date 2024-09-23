import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@sesamy/sesamy-components": path.resolve(
        __dirname,
        "../dist/lib/sesamy-components.es.js",
      ),
    },
  },
});
