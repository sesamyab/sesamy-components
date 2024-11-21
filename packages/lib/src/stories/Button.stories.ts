import '@sesamy/sesamy-components';
import { html } from 'lit-html';
import type { Meta, StoryObj } from '@storybook/web-components';
import { ifDefined } from 'lit/directives/if-defined.js';
import type { ButtonProps } from '../types';

const meta: Meta<ButtonProps & { loading: boolean; disabled: boolean; buttonText: string }> = {
  title: 'Components/Button',
  tags: ['autodocs'],
  component: 'sesamy-button-beta',
  render: (args) => html`
    <sesamy-button-beta
      variant="primary"
      .disabled=${ifDefined(args.disabled)}
      .loading=${ifDefined(args.loading)}
      .variant=${ifDefined(args.variant)}
      .size=${ifDefined(args.size)}
      @click=${args.onclick}
      >${args.buttonText}</sesamy-button-beta
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

type Story = StoryObj<ButtonProps & { loading: boolean; disabled: boolean; buttonText: string }>;

export const Default: Story = {
  parameters: {
    layout: 'centered'
  },
  args: {
    buttonText: 'Default',
    disabled: false,
    loading: false,
    variant: 'primary'
  }
};

export const variants: Story = {
  parameters: {
    layout: 'centered'
  },
  render: () => html`
    <div style="gap: 10px; padding: 10px;">
      <sesamy-button-beta variant="primary">Primary</sesamy-button-beta>
      <sesamy-button-beta variant="secondary">Secondary</sesamy-button-beta>
      <sesamy-button-beta variant="tertiary">Tertiary</sesamy-button-beta>
    </div>
  `
};

export const sizes: Story = {
  parameters: {
    layout: 'centered'
  },
  render: () => html`
    <div style="gap: 10px; padding: 10px;">
      <sesamy-button-beta size="lg">Large</sesamy-button-beta>
      <sesamy-button-beta size="md">Medium</sesamy-button-beta>
      <sesamy-button-beta size="sm">Small</sesamy-button-beta>
    </div>
  `
};

export const disabled: Story = {
  parameters: {
    layout: 'centered'
  },
  render: () => html`
    <div style="gap: 10px; padding: 10px;">
      <sesamy-button-beta disabled variant="primary">Primary</sesamy-button-beta>
      <sesamy-button-beta disabled variant="secondary">Secondary</sesamy-button-beta>
      <sesamy-button-beta disabled variant="tertiary">Tertiary</sesamy-button-beta>
    </div>
  `
};

export const Loading: Story = {
  parameters: {
    layout: 'centered'
  },
  render: () => html`
    <div style="gap: 10px; padding: 10px;">
      <sesamy-button-beta loading variant="primary">Primary</sesamy-button-beta>
      <sesamy-button-beta loading variant="secondary">Secondary</sesamy-button-beta>
      <sesamy-button-beta loading variant="tertiary">Tertiary</sesamy-button-beta>
    </div>
  `
};

export const color: Story = {
  parameters: {
    layout: 'centered'
  },
  render: () => html`
    <div style="gap: 10px; padding: 10px; --sesamy-primary-color: 357, 95.9%, 48.2%;">
      <sesamy-button-beta variant="primary">Primary</sesamy-button-beta>
      <sesamy-button-beta variant="secondary">Secondary</sesamy-button-beta>
      <sesamy-button-beta variant="tertiary">Tertiary</sesamy-button-beta>
    </div>
  `
};
