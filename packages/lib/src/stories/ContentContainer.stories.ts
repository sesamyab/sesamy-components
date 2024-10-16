import { html } from 'lit-html';
import type { Meta, StoryObj } from '@storybook/web-components';
import { ifDefined } from 'lit/directives/if-defined.js';
import type { ButtonProps } from '../types';

const meta: Meta<ButtonProps & { buttonText: string }> = {
  title: 'Components/ContentContainer',
  tags: ['autodocs'],
  component: 'sesamy-content-container',
  render: (args) =>
    html`<div>
      <sesamy-login></sesamy-login>
      <sesamy-content-container item-src="https://sesamy-js.sesamy.dev/article.html">
        <div slot="preview">This is a preview of locked content</div>
        <div slot="content">This is the locked content</div>
      </sesamy-content-container>
    </div>`,
  argTypes: {}
};

export default meta;

type Story = StoryObj<ButtonProps & { buttonText: string }>;

export const Default: Story = {
  parameters: {
    layout: 'centered'
  },
  args: {},
  render: (args) =>
    html`<div style="color: red;">
      <sesamy-login></sesamy-login>
      <sesamy-content-container item-src="https://sesamy-js.sesamy.dev/article.html">
        <div slot="preview">This is a preview of locked content</div>
        <div slot="content">This is the locked content</div>
      </sesamy-content-container>
    </div>`
};

export const EncodedContent: Story = {
  parameters: {
    layout: 'centered'
  },
  args: {},
  render: (args) =>
    html` <div style="color: red;">
      <sesamy-login></sesamy-login>
      <sesamy-content-container
        item-src="https://sesamy-js.sesamy.dev/article.html"
        lock-mode="encode"
      >
        <div slot="preview">This is a preview of locked content</div>
        <div slot="content">VGhpcyBpcyB0aGUgZW5jb2RlZCBsb2NrZWQgY29udGVudA==</div>
      </sesamy-content-container>
    </div>`
};
