import '@sesamy/sesamy-components';
import { html } from 'lit-html';
import type { Meta, StoryObj } from '@storybook/web-components';

type LoginProps = {
  onLogin?: (event: CustomEvent) => void;
};

const meta: Meta<LoginProps> = {
  title: 'Components/Login',
  tags: ['autodocs', 'visual:check', 'story'],
  component: 'sesamy-login',
  render: (args) => html` <sesamy-login @login=${args.onLogin}></sesamy-login> `,
  argTypes: {
    onLogin: { action: 'login' }
  }
};

export default meta;

type Story = StoryObj<LoginProps>;

export const Default: Story = {
  args: {}
};

export const CustomText: Story = {
  render: (args) => html`
    <sesamy-login @login=${args.onLogin}>
      <span slot="button-text">Sign In Now</span>
    </sesamy-login>
  `,
  args: {}
};
