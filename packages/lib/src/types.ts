import type { SesamyAPI } from '@sesamy/sesamy-js';
import type { HTMLButtonAttributes } from 'svelte/elements';

// NOTE: (important!)
// These types are what we expose to the end user of our web-components
export type Variant = 'primary' | 'secondary' | 'tertiary';
export type Size = 'sm' | 'md' | 'lg';
export type LoginVariant = 'text' | 'picture' | 'link';

export interface LoginProps {
  ['button-text']?: string;
  loading?: boolean;
  loggedIn?: boolean;
  userAvatar?: string;
  lang?: string;
  variant?: LoginVariant;
  onLogin?: (event: CustomEvent) => void;
}

export type PaywallProps = HTMLElement & {
  template?: 'ARTICLE' | 'BOXES';
  ['settings-url']: string;
  ['item-src']?: string;
  price?: string;
  currency?: string;
  ['redirect-url']?: string;
  ['utm-source']?: string;
  ['utm-medium']?: string;
  ['utm-campaign']?: string;
  ['utm-term']?: string;
  ['utm-content']?: string;
  pass?: string;
};

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary';

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
export type LockMode = 'embed' | 'encode' | 'signedUrl' | 'event' | 'proxy';

export type ContentContainerProps = HTMLElement & {
  'item-src'?: string;
  pass?: string;
  'access-level'?: AccessLevel;
  'publisher-content-id'?: string;
  'lock-mode'?: LockMode;
  'locked-content-selector'?: string;
};
