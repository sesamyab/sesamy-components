import { version } from '../../package.json';

export { default as Login } from './src/Login.wc.svelte';
export { default as Paywall } from './src/Paywall.wc.svelte';
export { default as Avatar } from './src/Avatar.wc.svelte';
export { default as ContentContainer } from './src/ContentContainer.wc.svelte';
export { default as Visibility } from './src/Visibility.wc.svelte';
export { default as LoginMenuItem } from './src/LoginMenuItem.wc.svelte';
export {
  SesamyEventName,
  type SesamyElementEventMap,
  type SesamyLoginSuccessDetail,
  type SesamyLoginErrorDetail,
  type SesamyLogoutDetail,
  type SesamyPaywallShownDetail,
  type SesamyPaywallShownReason,
  type SesamyPaywallDismissedDetail,
  type SesamyAccessGrantedDetail,
  type SesamyContentUnlockedDetail
} from './src/events';
export const sesamyComponentsVersion = version;
