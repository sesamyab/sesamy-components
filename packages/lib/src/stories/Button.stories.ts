import '@sesamy/sesamy-components';
import { html } from 'lit-html';
import type { Meta, StoryObj } from '@storybook/web-components';
import { ifDefined } from 'lit/directives/if-defined.js';
import type { ButtonProps } from '../types';

const meta: Meta<ButtonProps & { buttonText: string }> = {
  title: 'Components/Button',
  tags: ['autodocs', 'visual:check', 'story'],
  component: 'sesamy-button',
  render: (args) => html`
    <sesamy-button
      variant="primary"
      .disabled=${ifDefined(args.disabled)}
      .loading=${ifDefined(args.loading)}
      .variant=${ifDefined(args.variant)}
      .size=${ifDefined(args.size)}
      @click=${args.onclick}
      >${args.buttonText}</sesamy-button
    >
  `,
  argTypes: {
    buttonText: { control: 'text' },
    variant: { control: { type: 'select' }, options: ['primary', 'secondary', 'tertiary'] },
    disabled: { control: 'boolean', defaultValue: false },
    loading: { control: 'boolean', defaultValue: false },
    size: { control: { type: 'select' }, options: ['sm', 'md', 'lg'] },
    onclick: { action: 'clicked' }
  }
};

export default meta;

type Story = StoryObj<ButtonProps & { buttonText: string }>;

export const Default: Story = {
  parameters: {
    layout: 'centered'
  },
  args: {
    buttonText: 'Default',
    disabled: false,
    loading: false,
    variant: 'primary'
  },
  tags: []
};

export const variants: Story = {
  parameters: {
    layout: 'centered'
  },
  render: () => html`
    <div style="display: flex; gap: 10px; padding: 10px;">
      <sesamy-button variant="primary">Primary</sesamy-button>
      <sesamy-button variant="secondary">Secondary</sesamy-button>
      <sesamy-button variant="tertiary">Tertiary</sesamy-button>
    </div>
  `
};

export const sizes: Story = {
  parameters: {
    layout: 'centered'
  },
  render: () => html`
    <div style="display: flex; gap: 10px; padding: 10px;">
      <sesamy-button size="lg">Large</sesamy-button>
      <sesamy-button size="md">Medium</sesamy-button>
      <sesamy-button size="sm">Small</sesamy-button>
    </div>
  `
};

export const disabled: Story = {
  parameters: {
    layout: 'centered'
  },
  render: () => html`
    <div style="display: flex; gap: 10px; padding: 10px;">
      <sesamy-button disabled variant="primary">Primary</sesamy-button>
      <sesamy-button disabled variant="secondary">Secondary</sesamy-button>
      <sesamy-button disabled variant="tertiary">Tertiary</sesamy-button>
    </div>
  `
};

export const Loading: Story = {
  parameters: {
    layout: 'centered'
  },
  render: () => html`
    <div style="display: flex; gap: 10px; padding: 10px;">
      <sesamy-button loading variant="primary">Primary</sesamy-button>
      <sesamy-button loading variant="secondary">Secondary</sesamy-button>
      <sesamy-button loading variant="tertiary">Tertiary</sesamy-button>
    </div>
  `
};

export const color: Story = {
  parameters: {
    layout: 'centered'
  },
  render: () => html`
    <div
      style="display: flex; gap: 10px; padding: 10px; --sesamy-primary-color: 357, 95.9%, 48.2%;"
    >
      <sesamy-button variant="primary">Primary</sesamy-button>
      <sesamy-button variant="secondary">Secondary</sesamy-button>
      <sesamy-button variant="tertiary">Tertiary</sesamy-button>
    </div>
  `
};
