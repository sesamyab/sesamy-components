import Avatar from './Avatar.wc.svelte';
import Button from './Button.wc.svelte';
import ContentContainer from './ContentContainer.wc.svelte';
import Login from './Login.wc.svelte';
import LoginMenuItem from './LoginMenuItem.wc.svelte';
import Paywall from './Paywall.wc.svelte';
import Visibility from './Visibility.wc.svelte';
import { defineCustomElement } from './define';

/** Every element the bundle provides, by tag. The tags are public API. */
export const elements = {
  'sesamy-avatar': Avatar,
  'sesamy-button': Button,
  'sesamy-content-container': ContentContainer,
  'sesamy-login': Login,
  'sesamy-login-menu-item': LoginMenuItem,
  'sesamy-paywall': Paywall,
  'sesamy-visibility': Visibility
} as const;

/**
 * Defines every element that isn't defined yet. Safe to call any number of
 * times, including from a second copy of the bundle on the same page.
 */
export function registerElements(): void {
  for (const [tag, component] of Object.entries(elements)) {
    // `element` is set when the component is compiled as a custom element,
    // which the library build always does.
    if (component.element) defineCustomElement(tag, component.element);
  }
}
