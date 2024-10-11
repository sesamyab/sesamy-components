import { html } from "lit-html";
import type { Meta, StoryObj } from "@storybook/web-components";
import { ifDefined } from "lit/directives/if-defined.js";
import { Button } from "@sesamy/sesamy-components";

type ButtonProps = {
  buttonText?: string;
  disabled?: boolean;
  loading?: boolean;
  outline?: boolean;
  variant?: "default" | "primary" | "success" | "neutral" | "warning" | "danger";
  onClick?: () => void;
};

const meta: Meta<ButtonProps> = {
  title: "Components/Button",
  tags: ["autodocs"],
  component: "sesamy-button",
  render: (args) => html`
    <sesamy-button
      variant="primary"
      .disabled=${ifDefined(args.disabled)}
      .loading=${ifDefined(args.loading)}
      .outline=${ifDefined(args.outline)}
      .variant=${ifDefined(args.variant)}
      @click=${args.onClick}
      >${args.buttonText}</sesamy-button
    >
  `,
  argTypes: {
    buttonText: { control: "text" },
    variant: { control: { type: "select" }, options: ["default", "primary", "success", "neutral", "warning", "danger"] },
    disabled: { control: "boolean", defaultValue: false },
    loading: { control: "boolean", defaultValue: false },
    outline: { control: "boolean", defaultValue: true },
    onClick: { action: "clicked" },
  },
};

export default meta;

type Story = StoryObj<ButtonProps>;

export const Default: Story = {
  args: {
    buttonText: "Default",
    outline: true,
    disabled: false,
    loading: false,
  },
};

export const Primary: Story = {
  args: {
    buttonText: "Primary Button",
    variant: "primary",
  },
};

export const Disabled: Story = {
  args: {
    buttonText: "Disabled Button",
    disabled: true,
  },
};

export const Loading: Story = {
  args: {
    buttonText: "Loading Button",
    loading: true,
  },
};
