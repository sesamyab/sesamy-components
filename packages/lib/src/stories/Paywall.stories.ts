import { html } from 'lit-html';
import type { Meta, StoryObj } from '@storybook/web-components';
import { Paywall } from '@sesamy/sesamy-components';

interface PaywallProps {
  'settings-url': string;
  template: 'ARTICLE' | 'BOXES';
  'item-src'?: string;
}

const meta: Meta<PaywallProps> = {
  title: 'Components/Paywall',
  tags: ['autodocs', 'visual:check', 'story'],
  component: 'sesamy-paywall',
  render: (args) =>
    html` <div style="gap: 10px; padding: 10px; --sesamy-primary-color: 249 86.4% 68.2%;">
      <sesamy-paywall
        template=${args['template']}
        settings-url=${args['settings-url']}
        item-src=${args['item-src']}
        price="99"
        currency="SEK"
      ></sesamy-paywall>
    </div>`,
  argTypes: {
    'settings-url': {
      control: 'text',
      defaultValue: 'https://api.sesamy.dev/paywall/paywalls/test-fokus/ONh_7gBRk8U_L060YMUr2'
    },
    template: {
      control: {
        type: 'select'
      },
      options: ['ARTICLE', 'BOXES'],
      defaultValue: 'ARTICLE'
    }
  }
};

export default meta;
type Story = StoryObj<PaywallProps>;

export const Default: Story = {
  args: {
    'settings-url': 'https://api.sesamy.dev/paywall/paywalls/test-fokus/ONh_7gBRk8U_L060YMUr2',
    'item-src': 'https://stage.fokus.se/aktuellt/lorem-ipsum-dolor-sit-amet-consectetur/',
    template: 'ARTICLE'
  }
};

export const TemplateBoxes: Story = {
  args: {
    'settings-url': 'https://api.sesamy.dev/paywall/paywalls/test-fokus/ONh_7gBRk8U_L060YMUr2',
    template: 'BOXES'
  }
};

export const MobileView: Story = {
  args: {
    'settings-url': 'https://api.sesamy.dev/paywall/paywalls/test-fokus/ONh_7gBRk8U_L060YMUr2',
    template: 'ARTICLE'
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    }
  }
};

export const TabletView: Story = {
  args: {
    'settings-url': 'https://api.sesamy.dev/paywall/paywalls/test-fokus/ONh_7gBRk8U_L060YMUr2',
    template: 'ARTICLE'
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet'
    }
  }
};
