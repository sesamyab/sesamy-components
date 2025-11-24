import { html } from 'lit-html';
import type { Meta, StoryObj } from '@storybook/web-components';
import type { ContentContainerProps } from '../types';

const meta: Meta<ContentContainerProps> = {
  title: 'Components/ContentContainer',
  tags: ['autodocs', 'visual:check', 'story'],
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
        <div slot="preview">This is visible for unauthenticated users</div>
        <div slot="content">This is visible for authenticated users</div>
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
      <sesamy-article item-src="https://sesamy-js.sesamy.dev/article.html">
        <sesamy-content-container access-level="public">
          <div slot="preview">This is should not be visible</div>
          <div slot="content">This is visible all users</div>
        </sesamy-content-container>
      </sesamy-article>
    </div>`
};

export const ContentEvents: Story = {
  parameters: {
    layout: 'centered'
  },
  args: {},
  render: (args) =>
    html` <div>
      <script>
        window.addEventListener('sesamyUnlocked', (event) => {
          const container = document.getElementById('event-container');
          container.innerHTML =
            'Event emitted with item-src: ' +
            event.detail.itemSrc +
            ' and publisher-content-id: ' +
            event.detail.publisherContentId;
        });
      </script>
      <sesamy-login></sesamy-login>
      <sesamy-content-container
        access-level="logged-in"
        item-src="https://example.com/article"
        publisher-content-id="1234"
        lock-mode="event"
      >
        <div slot="preview">This is visible to unauthenticated users</div>
      </sesamy-content-container>
      <div id="event-container"></div>
    </div>`
};
