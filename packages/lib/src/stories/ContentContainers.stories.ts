import '@sesamy/sesamy-components';
import { html } from 'lit-html';
import type { Meta, StoryObj } from '@storybook/web-components';
import { ifDefined } from 'lit/directives/if-defined.js';
import type { ButtonProps } from '../types';

const meta: Meta<ButtonProps & { buttonText: string }> = {
  title: 'Components/ContentContainer',
  tags: ['autodocs'],
  component: 'sesamy-content-container',
  render: (args) =>
    html` <div style="color: red;">
      <h1>Outside</h1>
      <sesamy-content-container>${args.buttonText}</sesamy-content-container>
    </div>`,
  argTypes: {}
};

export default meta;

type Story = StoryObj<ButtonProps & { buttonText: string }>;

export const Default: Story = {
  parameters: {
    layout: 'centered'
  },
  args: {}
};
