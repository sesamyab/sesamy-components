// File: packages/lib/src/stories/Paywall.stories.ts

import { html } from "lit-html";
import type { Meta, StoryObj } from "@storybook/web-components";
import { Paywall } from "@sesamy/sesamy-components";

// Import the component to ensure it's registered
import "../../../../dist/lib/sesamy-components.es.js";

interface PaywallProps {
  // Add any props here if the component accepts any
}

const meta: Meta<PaywallProps> = {
  title: "Components/Paywall",
  tags: ["autodocs"],
  component: "sesamy-paywall",
  render: (args) => html` <sesamy-paywall></sesamy-paywall> `,
  argTypes: {
    // Add any interactive props here if needed
  },
};

export default meta;
type Story = StoryObj<PaywallProps>;

export const Default: Story = {
  args: {
    // Add any default props here if needed
  },
};

export const MobileView: Story = {
  args: {
    // Add any props for mobile view if needed
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
};

export const TabletView: Story = {
  args: {
    // Add any props for tablet view if needed
  },
  parameters: {
    viewport: {
      defaultViewport: "tablet",
    },
  },
};
