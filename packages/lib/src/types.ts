import type { HTMLButtonAttributes } from 'svelte/elements';

// NOTE: (important!)
// These types are what we expose to the end user of our web-components
export type Variant = 'primary' | 'secondary' | 'tertiary';
export type Size = 'sm' | 'md' | 'lg';

export type LoginProps = {
  ['button-text']?: string;
  lang?: string;
  variant?: Variant;
};

export type PaywallProps = {
  template: 'ARTICLE' | 'BOXES';
  ['settings-url']: string;
  ['redirect-url']: string;
  ['utm-source']: string;
  ['utm-medium']: string;
  ['utm-campaign']: string;
  ['utm-term']: string;
  ['utm-content']: string;
};

export type ButtonProps = HTMLButtonAttributes & {
  variant?: Variant;
  size?: Size;
  part?: string;
  onclick?: () => void;
  href?: string;
};
