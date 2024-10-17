import { html } from 'lit-html';
import type { Meta, StoryObj } from '@storybook/web-components';
import type { ContentContainerProps } from '../types';

const meta: Meta<ContentContainerProps> = {
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

type Story = StoryObj<ContentContainerProps & { buttonText: string }>;

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
    html` <div>
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

export const AuthenticatedUsers: Story = {
  parameters: {
    layout: 'centered'
  },
  args: {},
  render: (args) =>
    html` <div>
      <sesamy-login></sesamy-login>
      <sesamy-content-container access-level="logged-in">
        <div slot="preview">This is visisble for unauthenticated users</div>
        <div slot="content">This is visisble for authenticated users</div>
      </sesamy-content-container>
    </div>`
};

export const PublicContent: Story = {
  parameters: {
    layout: 'centered'
  },
  args: {},
  render: (args) =>
    html` <div>
      <sesamy-login></sesamy-login>
      <sesamy-content-container access-level="public">
        <div slot="preview">This is should not be visible</div>
        <div slot="content">This is visisble all users</div>
      </sesamy-content-container>
    </div>`
};
