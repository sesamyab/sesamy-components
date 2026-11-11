import { html } from 'lit-html';
import type { Meta, StoryObj } from '@storybook/web-components';
import { createFakeSesamy, installFakeSesamy } from './fake-sesamy';
import { publicOfferPaywall } from './fixtures/public-offer-paywall';

interface PaywallProps {
  'settings-url': string;
  'item-src'?: string;
}

const meta: Meta<PaywallProps> = {
  title: 'Components/Paywall',
  tags: ['autodocs', 'visual:check', 'story'],
  component: 'sesamy-paywall',
  render: (args) =>
    html` <div style="gap: 10px; padding: 10px; --sesamy-primary-color: 249 86.4% 68.2%;">
      <sesamy-paywall
        settings-url=${args['settings-url']}
        item-src=${args['item-src']}
        price="99"
        currency="SEK"
      ></sesamy-paywall>
    </div>`,
  argTypes: {
    'settings-url': {
      control: 'text',
      defaultValue: 'https://api.sesamy.dev/paywall/paywalls/acme/OxHlsEHTUGs1tpF6EoRy8'
    }
  }
};

export default meta;
type Story = StoryObj<PaywallProps>;

export const Article: Story = {
  args: {
    'settings-url': 'https://api.sesamy.dev/paywall/paywalls/acme/OxHlsEHTUGs1tpF6EoRy8',
    'item-src': 'https://acme.sesamy.dev/test-article'
  }
};

export const Login: Story = {
  args: {
    'settings-url': 'https://api.sesamy.dev/paywall/paywalls/acme/yn1wE5pJQgIXIfoQrLBqb'
  }
};

export const Boxes: Story = {
  args: {
    'settings-url': 'https://api.sesamy.dev/paywall/paywalls/acme/Zt9jY_Ioc4SS6YG9hRkqp'
  }
};

export const BoxesVariant: Story = {
  args: {
    'settings-url': 'https://api.sesamy.dev/paywall/paywalls/acme/FoPaafEt51445TsbYXTEu'
  }
};

export const Slots: Story = {
  args: {
    'settings-url': 'https://api.sesamy.dev/paywall/paywalls/acme/OxHlsEHTUGs1tpF6EoRy8',
    'item-src': 'https://acme.sesamy.dev/test-article'
  },
  render: (args) => html`
    <div style="gap: 10px; padding: 10px; --sesamy-primary-color: 249 86.4% 68.2%;">
      <sesamy-paywall
        settings-url=${args['settings-url']}
        item-src=${args['item-src']}
        price="99"
        currency="SEK"
      >
        <span slot="login-button-text">Custom <b>Login Button Text</b> Slot</span>
        <span slot="headline">Custom <b>Headline</b> Slot</span>
        <div slot="below-headline" style="background: #f0f0f0; padding: 8px;">
          Custom <b>Below Headline</b> Slot
        </div>
        <div slot="features" style="background: #f0f0f0; padding: 8px;">
          Custom <b>Features</b> Slot
        </div>
      </sesamy-paywall>
    </div>
  `
};

/**
 * An offer page: a public article with the paywall inside it, under unified
 * content access. Everyone has access to a public article, so the paywall must
 * still show its plans here (regression: it rendered empty from 2.31 until 2.34.1).
 * sesamy-js is faked, so the story needs no network and renders the same every time.
 */
export const PublicPageUnifiedAccess: Story = {
  args: {
    'settings-url': 'pw_public_offer'
  },
  decorators: [
    (story) => {
      installFakeSesamy(
        createFakeSesamy({
          metadata: {
            id: 'offer-page',
            url: 'https://acme.sesamy.dev/offer',
            legacyContentAccess: false,
            accessLevel: 'public'
          },
          hasAccess: true,
          paywall: publicOfferPaywall
        })
      );
      return story();
    }
  ],
  render: (args) =>
    html` <div style="gap: 10px; padding: 10px; --sesamy-primary-color: 249 86.4% 68.2%;">
      <sesamy-paywall settings-url=${args['settings-url']}></sesamy-paywall>
    </div>`
};
