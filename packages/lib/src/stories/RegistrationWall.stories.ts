// File: src/stories/RegistrationWall.stories.ts

import { html } from "lit-html";
import { action } from "@storybook/addon-actions";
import type { Meta, StoryObj } from "@storybook/web-components";

// Ensure the web component is registered
import "../RegistrationWall.wc.svelte";

interface RegistrationWallProps {
  // Add props here if your component accepts any
}

const meta: Meta<RegistrationWallProps> = {
  title: "Components/RegistrationWall",
  tags: ["autodocs"],
  component: "sesamy-registration-wall",
  render: (args) => html`
    <sesamy-registration-wall
      @continue=${action("continue")}
      @socialLogin=${action("socialLogin")}
      @workSchoolLogin=${action("workSchoolLogin")}
      @subscriptionOptions=${action("subscriptionOptions")}
    ></sesamy-registration-wall>
  `,
  argTypes: {
    // Add interactive props here if needed
  },
};

export default meta;
type Story = StoryObj<RegistrationWallProps>;

export const Default: Story = {
  args: {
    // Add any default props here if needed
  },
};

export const WithPrefilledEmail: Story = {
  args: {
    // Add any default props here if needed
  },
  render: (args) => html`
    <sesamy-registration-wall
      @continue=${action("continue")}
      @socialLogin=${action("socialLogin")}
      @workSchoolLogin=${action("workSchoolLogin")}
      @subscriptionOptions=${action("subscriptionOptions")}
    ></sesamy-registration-wall>
    <script>
      setTimeout(() => {
        const wall = document.querySelector("sesamy-registration-wall");
        const emailInput = wall.shadowRoot.querySelector('input[type="email"]');
        emailInput.value = "user@example.com";
        emailInput.dispatchEvent(new Event("input"));
      }, 100);
    </script>
  `,
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
