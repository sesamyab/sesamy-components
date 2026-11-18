import { version } from '../../package.json';
import { registerElements } from './src/register';

// A call, not a side-effect import: package.json declares `sideEffects: false`,
// which would let our own build drop a bare `import './src/register'`. This does
// not protect a consumer's bundler, which may still drop a bare
// `import '@sesamy/sesamy-components'` under that same flag, as it could before
// registration moved here.
registerElements();

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
export {
  TrackEventName,
  enableInteractions,
  disableInteractions,
  resetInteractions,
  interactionsEnabled,
  type ArticleState,
  type TrackEventProperties,
  type ViewArticleProperties,
  type AddToCartProperties,
  type ContentUnlockedProperties
} from './src/tracking';
export const sesamyComponentsVersion = version;
