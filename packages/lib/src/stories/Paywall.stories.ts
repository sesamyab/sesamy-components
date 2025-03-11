import { html } from 'lit-html';
import type { Meta, StoryObj } from '@storybook/web-components';
import { Paywall } from '@sesamy/sesamy-components';

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
