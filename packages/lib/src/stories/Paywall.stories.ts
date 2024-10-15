import { html } from 'lit-html';
import type { Meta, StoryObj } from '@storybook/web-components';
import { Paywall } from '@sesamy/sesamy-components';

interface PaywallProps {
  'settings-url': string;
}

const meta: Meta<PaywallProps> = {
  title: 'Components/Paywall',
  tags: ['autodocs'],
  component: 'sesamy-paywall',
  render: (args) =>
    html` <div
      style="display: flex; gap: 10px; padding: 10px; --sesamy-main-color: 249,86.4%,68.2%;"
    >
      <sesamy-paywall settings-url=${args['settings-url']}></sesamy-paywall>
      <div></div>
    </div>`,
  argTypes: {
    'settings-url': {
      control: 'text',
      defaultValue: 'https://api.sesamy.dev/paywall/paywalls/kvartal/1idkV75XtXSVQAXtTp2dL'
    }
  }
};

export default meta;
type Story = StoryObj<PaywallProps>;

export const Default: Story = {
  args: {
    'settings-url': 'https://api.sesamy.dev/paywall/paywalls/kvartal/1idkV75XtXSVQAXtTp2dL'
  }
};

export const MobileView: Story = {
  args: {
    'settings-url': 'https://api.sesamy.dev/paywall/paywalls/kvartal/1idkV75XtXSVQAXtTp2dL'
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    }
  }
};

export const TabletView: Story = {
  args: {
    'settings-url': 'https://api.sesamy.dev/paywall/paywalls/kvartal/1idkV75XtXSVQAXtTp2dL'
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet'
    }
  }
};
