import { html } from 'lit-html';
import type { Meta, StoryObj } from '@storybook/web-components';
import { ifDefined } from 'lit/directives/if-defined.js';
import { Button } from '@sesamy/sesamy-components';

type ButtonProps = {
  buttonText?: string;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'outlined' | 'contained' | 'text';
  onClick?: () => void;
};

const meta: Meta<ButtonProps> = {
  title: 'Components/Button',
  tags: ['autodocs'],
  component: 'sesamy-button',
  render: (args) => html`
    <sesamy-button
      variant="primary"
      .disabled=${ifDefined(args.disabled)}
      .loading=${ifDefined(args.loading)}
      .variant=${ifDefined(args.variant)}
      @click=${args.onClick}
      >${args.buttonText}</sesamy-button
    >
  `,
  argTypes: {
    buttonText: { control: 'text' },
    variant: { control: { type: 'select' }, options: ['text', 'outlined', 'contained'] },
    disabled: { control: 'boolean', defaultValue: false },
    loading: { control: 'boolean', defaultValue: false },
    onClick: { action: 'clicked' }
  }
};

export default meta;

type Story = StoryObj<ButtonProps>;

export const Default: Story = {
  args: {
    buttonText: 'Default',
    disabled: false,
    loading: false,
    variant: 'contained'
  }
};

export const Contained: Story = {
  args: {
    buttonText: 'Primary Button',
    variant: 'contained'
  }
};

export const Disabled: Story = {
  args: {
    buttonText: 'Disabled Button',
    disabled: true
  }
};

export const Loading: Story = {
  args: {
    buttonText: 'Loading Button',
    loading: true
  }
};
