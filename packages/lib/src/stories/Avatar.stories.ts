import { html } from 'lit-html';
import type { Meta, StoryObj } from '@storybook/web-components';
import { ifDefined } from 'lit/directives/if-defined.js';
import { Avatar } from '@sesamy/sesamy-components';

type AvatarProps = {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
};

const meta: Meta<AvatarProps> = {
  title: 'Components/Avatar',
  tags: ['autodocs', 'visual:check', 'story'],
  component: 'sesamy-avatar-beta',
  render: (args) => html`
    <sesamy-avatar-beta
      src=${ifDefined(args.src)}
      alt=${ifDefined(args.alt)}
      size=${ifDefined(args.size)}
      ?loading=${args.loading}
      @click=${() => console.info('Avatar clicked')}
    ></sesamy-avatar-beta>
  `,
  argTypes: {
    src: { control: 'text' },
    alt: { control: 'text' },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg']
    },
    loading: { control: 'boolean' }
  }
};

export default meta;

type Story = StoryObj<AvatarProps>;

export const Default: Story = {
  args: {
    src: '',
    alt: 'Default Avatar',
    size: 'md',
    loading: false
  }
};

export const WithImage: Story = {
  args: {
    src: 'https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e5357079588e00bb27e9058_peep-46.png',
    alt: 'User Avatar',
    size: 'md',
    loading: false
  }
};

export const sizes: Story = {
  parameters: {
    layout: 'centered'
  },
  render: () => html`
    <div style="display: flex; gap: 10px; padding: 10px;">
      <sesamy-avatar-beta size="lg">Large</sesamy-avatar-beta>
      <sesamy-avatar-beta size="md">Medium</sesamy-avatar-beta>
      <sesamy-avatar-beta size="sm">Small</sesamy-avatar-beta>
    </div>
  `
};
