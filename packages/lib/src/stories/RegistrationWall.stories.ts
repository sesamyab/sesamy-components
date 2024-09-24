import { html } from "lit-html";
import type { Meta, StoryObj } from "@storybook/web-components";

// Import the component to ensure it's registered
import "../../../../dist/lib/sesamy-components.es.js";

type RegistrationWallProps = {
  title: string;
  description: string;
  buttonColor: string;
};

const meta: Meta<RegistrationWallProps> = {
  title: "Components/RegistrationWall",
  tags: ["autodocs"],
  component: "sesamy-registration-wall",
  render: (args) =>
    html`
      <sesamy-registration-wall>
        ${args.title ? html`<h1 slot="title">${args.title}</h1>` : ""}
        ${args.description
          ? html`<p slot="description">${args.description}</p>`
          : ""}
      </sesamy-registration-wall>
      <style>
        ::part(continueButton) {
          background-color: ${args.buttonColor};
        }
      </style>
    `,
  argTypes: {
    title: {
      control: "text", // This adds a text input control for the title
      defaultValue: "Default Title", // Default value for the title
      description: "Title text for the registration wall",
    },
    buttonColor: {
      control: "color",
      defaultValue: "#007bff",
      description: "Sets the background color of the continue button",
    },
  },
};

export default meta;

type Story = StoryObj<RegistrationWallProps>;

export const Default: Story = {
  args: {
    buttonColor: "#007bff",
  },
};

export const Slots: Story = {
  args: {
    title: "Another Custom Title",
    description: "This is a custom description for the registration wall",
  },
};
