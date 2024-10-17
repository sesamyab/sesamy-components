import type { HTMLButtonAttributes } from 'svelte/elements';

export interface LoginProps {
  buttonText?: string;
  loading?: boolean;
  loggedIn?: boolean;
  userAvatar?: string;
  lang?: string;
  variant?: Variant;
  onLogin?: (event: CustomEvent) => void;
}

export type PaywallProps = HTMLElement & {
  ['settings-url']: string;
  template: 'ARTICLE' | 'BOXES';
};

export type Variant = 'primary' | 'secondary' | 'tertiary';
export type Size = 'sm' | 'md' | 'lg';

export type ButtonProps = HTMLButtonAttributes & {
  loading?: boolean;
  variant?: Variant;
  disabled?: boolean;
  size?: Size;
  part?: string;
  onclick?: () => void;
  href?: string;
};
