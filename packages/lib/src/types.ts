import type { HTMLButtonAttributes } from 'svelte/elements';

// NOTE: (important!)
// These types are what we expose to the end user of our web-components
export type Variant = 'primary' | 'secondary' | 'tertiary';
export type Size = 'sm' | 'md' | 'lg';

export interface LoginProps {
  loading?: boolean;
  loggedIn?: boolean;
  onLogin?: (event: CustomEvent) => void;
}

export type PaywallProps = {
  template?: 'ARTICLE' | 'BOXES' | 'EMAIL';
  ['settings-url']?: string;
  ['item-src']?: string;
  price?: string;
  currency?: string;
  ['redirect-url']?: string;
  ['redirect-label']?: string;
  ['utm-source']?: string;
  ['utm-medium']?: string;
  ['utm-campaign']?: string;
  ['utm-term']?: string;
  ['utm-content']?: string;
  pass?: string;
  // Express checkout (proof of concept): a signed-in reader pays the selected
  // option with Apple Pay or Google Pay in place, and the article unlocks
  // without a redirect. Off unless set; "false" also turns it off.
  ['express-checkout']?: string;
  // The Stripe platform publishable key Stripe.js loads with (`pk_test_…` on
  // dev). Required by `express-checkout` until the checkout API returns it.
  ['stripe-publishable-key']?: string;
};

export type PaywallElementProps = PaywallProps & {
  // A paywall id, a strategy id (`st_…`) or a paywall URL.
  paywall?: string;
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
