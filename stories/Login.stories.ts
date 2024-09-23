// File: packages/lib/src/stories/Login.stories.ts
import { html } from "lit-html";
import type { Meta, StoryObj } from "@storybook/web-components";
import { Login } from "@sesamy/sesamy-components";

type LoginProps = {
  buttonText?: string;
  onLogin?: (event: CustomEvent) => void;
};

const meta: Meta<LoginProps> = {
  title: "Components/Login",
  tags: ["autodocs"],
  component: "sesamy-login",
  render: (args) => html`
    <sesamy-login
      .buttonText=${args.buttonText}
      @login=${args.onLogin}
    ></sesamy-login>
  `,
  argTypes: {
    buttonText: { control: "text" },
    onLogin: { action: "login" },
  },
};

export default meta;

type Story = StoryObj<LoginProps>;

export const Default: Story = {
  args: {
    buttonText: "Log In",
  },
};

export const CustomText: Story = {
  args: {
    buttonText: "Sign In Now",
  },
};
