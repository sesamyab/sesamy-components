// File: packages/lib/src/stories/Login.stories.ts
import { html } from 'lit-html';
import type { Meta, StoryObj } from '@storybook/web-components';
import { Login } from '@sesamy/sesamy-components';
import { ifDefined } from 'lit-html/directives/if-defined.js';

type LoginProps = {
  buttonText?: string;
  onLogin?: (event: CustomEvent) => void;
  lang?: string;
};

const meta: Meta<LoginProps> = {
  title: 'Components/Login',
  tags: ['autodocs', 'visual:check', 'story'],
  component: 'sesamy-login-beta',
  render: (args) => html`
    <sesamy-login-beta
      .buttonText=${args.buttonText}
      .outline=${ifDefined(args.lang)}
      @login=${args.onLogin}
    ></sesamy-login-beta>
  `,
  argTypes: {
    buttonText: { control: 'text' },
    onLogin: { action: 'login' },
    lang: { control: 'text' }
  }
};

export default meta;

type Story = StoryObj<LoginProps>;

export const Default: Story = {
  args: {
    buttonText: 'Log In'
  }
};

export const CustomText: Story = {
  args: {
    buttonText: 'Sign In Now'
  }
};
