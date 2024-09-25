import type { StorybookConfig } from "@storybook/web-components-vite";
import { mergeConfig } from "vite";
import path from "path";

const config: StorybookConfig = {
  stories: [
    "../packages/lib/src/**/*.mdx",
    "../packages/lib/src/**/*.stories.@(js|jsx|ts|tsx)",
  ],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-controls",
  ],
  framework: {
    name: "@storybook/web-components-vite",
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
  async viteFinal(config) {
    return mergeConfig(config, {
      resolve: {
        alias: {
          "@sesamy/sesamy-components": path.resolve(
            __dirname,
            "../dist/lib/sesamy-components.es.js",
          ),
        },
      },
    });
  },
};

export default config;
