import { html } from 'lit-html';
import type { Meta, StoryObj } from '@storybook/web-components';

// Import the component to ensure it's registered
import '../../../../dist/lib/sesamy-components.es.js';

type RegistrationWallProps = {
  title: string;
  description: string;
  buttonColor: string;
  maxWidth: string;
  fontFamily: string;
};

const meta: Meta<RegistrationWallProps> = {
  title: 'Components/RegistrationWall',
  tags: ['autodocs'],
  component: 'sesamy-registration-wall',
  render: (args) => html`
    <sesamy-registration-wall>
      ${args.title ? html`<h1 slot="title">${args.title}</h1>` : ''}
      ${args.description ? html`<p slot="description">${args.description}</p>` : ''}
    </sesamy-registration-wall>
    <style>
      sesamy-registration-wall::part(continueButton) {
        background-color: ${args.buttonColor};
      }
    </style>
  `,
  argTypes: {
    title: {
      control: 'text',
      defaultValue: 'Default Title',
      description: 'Title text for the registration wall'
    },
    buttonColor: {
      control: 'color',
      defaultValue: '#007bff',
      description: 'Sets the background color of the continue button'
    },
    maxWidth: {
      control: { type: 'text' },
      description: 'Sets the max-width of the component',
      table: {
        category: 'CSS Variables',
        defaultValue: { summary: '500px' }
      }
    },
    fontFamily: {
      control: { type: 'text' },
      description: 'Sets the font family of the component',
      table: {
        category: 'CSS Variables',
        defaultValue: { summary: 'Arial, sans-serif' }
      }
    }
  }
};

export default meta;

type Story = StoryObj<RegistrationWallProps>;

export const Default: Story = {
  args: {
    buttonColor: '#007bff',
    maxWidth: '500px',
    fontFamily: 'Arial, sans-serif'
  },
  decorators: [
    (story, { args }) => html`
      <style>
        sesamy-registration-wall {
          --max-width: ${args.maxWidth};
          --font-family: ${args.fontFamily};
        }
      </style>
      ${story()}
    `
  ]
};

export const Slots: Story = {
  args: {
    title: 'Another Custom Title',
    description: 'This is a custom description for the registration wall',
    maxWidth: '600px',
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
  },
  decorators: [
    (story, { args }) => html`
      <style>
        sesamy-registration-wall {
          --max-width: ${args.maxWidth};
          --font-family: ${args.fontFamily};
        }
      </style>
      ${story()}
    `
  ]
};
