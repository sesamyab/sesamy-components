import { html } from "lit-html";
import type { Meta, StoryObj } from "@storybook/web-components";
import { Hello } from "@sesamy/sesamy-components";

type HelloProps = {};

const meta: Meta<HelloProps> = {
  title: "Components/Hello",
  tags: ["autodocs"],
  component: "sesamy-hello",
  render: (args) => html` <sesamy-hello></sesamy-hello> `,
  argTypes: {},
};

export default meta;

type Story = StoryObj<HelloProps>;

export const Default: Story = {
  args: {},
};

export const CustomText: Story = {
  args: {},
};
