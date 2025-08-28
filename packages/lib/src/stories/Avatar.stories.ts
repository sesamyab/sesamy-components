import '@sesamy/sesamy-components';
import { html } from 'lit-html';
import type { Meta, StoryObj } from '@storybook/web-components';
import { ifDefined } from 'lit/directives/if-defined.js';

type AvatarProps = {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
};

const meta: Meta<AvatarProps> = {
  title: 'Components/Avatar',
  tags: ['autodocs', 'visual:check', 'story'],
  component: 'sesamy-avatar',
  render: (args) => html`
    <sesamy-avatar
      src=${ifDefined(args.src)}
      alt=${ifDefined(args.alt)}
      size=${ifDefined(args.size)}
      ?loading=${args.loading}
      @click=${() => console.info('Avatar clicked')}
    ></sesamy-avatar>
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
      <sesamy-avatar size="lg">Large</sesamy-avatar>
      <sesamy-avatar size="md">Medium</sesamy-avatar>
      <sesamy-avatar size="sm">Small</sesamy-avatar>
    </div>
  `
};
