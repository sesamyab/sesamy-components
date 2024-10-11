import type { HTMLButtonAttributes } from 'svelte/elements';

export interface LoginProps {
  buttonText?: string;
  loading?: boolean;
  loggedIn?: boolean;
  userAvatar?: string;
  lang?: string;
  onLogin?: (event: CustomEvent) => void;
}

export interface PaywallProps extends HTMLElement {
  ['settings-url']: string;
  template: 'ARTICLE' | 'BOXES';
}

export type ButtonProps = HTMLButtonAttributes & {
  loading: boolean;
  disabled: boolean;
  size: 'sm' | 'md' | 'lg';
  variant: 'text' | 'contained' | 'outlined';
  onclick: () => {};
  href: string;
};
