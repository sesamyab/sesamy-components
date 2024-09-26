import { html } from "lit-html";
import type { Meta, StoryObj } from "@storybook/web-components";
import { ifDefined } from "lit/directives/if-defined.js";
import { Avatar } from "@sesamy/sesamy-components";

type AvatarProps = {
  src?: string;
  alt?: string;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

const meta: Meta<AvatarProps> = {
  title: "Components/Avatar",
  tags: ["autodocs"],
  component: "sesamy-avatar",
  render: (args) => html`
    <sesamy-avatar
      src=${ifDefined(args.src)}
      alt=${ifDefined(args.alt)}
      size=${ifDefined(args.size)}
      @click=${() => console.log("Avatar clicked")}
    ></sesamy-avatar>
  `,
  argTypes: {
    src: { control: "text" },
    alt: { control: "text" },
    size: {
      control: { type: "select" },
      options: ["sm", "md", "lg"],
    },
    loading: { control: "boolean", defaultValue: false },
  },
};

export default meta;

type Story = StoryObj<AvatarProps>;

export const Default: Story = {
  args: {
    src: "",
    alt: "Default Avatar",
    size: "md",
  },
};

export const WithImage: Story = {
  args: {
    src: "https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e5357079588e00bb27e9058_peep-46.png",
    alt: "User Avatar",
    size: "md",
  },
};

export const Small: Story = {
  args: {
    src: "",
    alt: "Small Avatar",
    size: "sm",
  },
};

export const Large: Story = {
  args: {
    src: "",
    alt: "Large Avatar",
    size: "lg",
  },
};

export const Loading: Story = {
  args: {
    src: "",
    alt: "Loading Avatar",
    size: "md",
    loading: true,
  },
};
