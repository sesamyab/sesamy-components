import type { HTMLButtonAttributes } from 'svelte/elements';

export type LoginVariant = 'text' | 'picture' | 'link';

export interface LoginProps {
  buttonText?: string;
  loading?: boolean;
  loggedIn?: boolean;
  userAvatar?: string;
  lang?: string;
  variant?: LoginVariant;
  onLogin?: (event: CustomEvent) => void;
}

export type PaywallProps = HTMLElement & {
  ['settings-url']: string;
  template: 'ARTICLE' | 'BOXES';
};

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary';
export type Size = 'sm' | 'md' | 'lg';

export type ButtonProps = HTMLButtonAttributes & {
  loading?: boolean;
  variant?: ButtonVariant;
  disabled?: boolean;
  size?: Size;
  part?: string;
  onclick?: () => void;
  href?: string;
};

export type AccessLevel = 'public' | 'logged-in' | 'entitlement';
export type LockMode = 'embed' | 'encode' | 'signedUrl' | 'event';

export type ContentContainerProps = HTMLElement & {
  'item-src'?: string;
  pass?: string;
  'access-level'?: AccessLevel;
  'access-url'?: string;
  'publisher-content-id'?: string;
  'lock-mode'?: LockMode;
};
