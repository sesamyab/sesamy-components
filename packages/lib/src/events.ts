export interface SesamyLoginSuccessDetail {
  userinfo: {
    sub: string;
    email?: string;
    name?: string;
    [key: string]: unknown;
  };
}

export interface SesamyLoginErrorDetail {
  error: {
    code: string;
    message: string;
    cause?: unknown;
  };
}

export type SesamyLogoutDetail = Record<string, never>;

export type SesamyPaywallShownReason =
  | 'unauthenticated'
  | 'no-entitlement'
  | 'consent-required'
  | (string & {});

export interface SesamyPaywallShownDetail {
  reason: SesamyPaywallShownReason;
}

export type SesamyPaywallDismissedDetail = Record<string, never>;

export interface SesamyAccessGrantedDetail {
  scopes: string[];
}

export interface SesamyContentUnlockedDetail {
  contentName: string;
}

export const SesamyEventName = {
  LOGIN_SUCCESS: 'sesamy:login-success',
  LOGIN_ERROR: 'sesamy:login-error',
  LOGOUT: 'sesamy:logout',
  PAYWALL_SHOWN: 'sesamy:paywall-shown',
  PAYWALL_DISMISSED: 'sesamy:paywall-dismissed',
  ACCESS_GRANTED: 'sesamy:access-granted',
  CONTENT_UNLOCKED: 'sesamy:content-unlocked'
} as const;

export type SesamyEventName = (typeof SesamyEventName)[keyof typeof SesamyEventName];

export interface SesamyElementEventMap {
  'sesamy:login-success': CustomEvent<SesamyLoginSuccessDetail>;
  'sesamy:login-error': CustomEvent<SesamyLoginErrorDetail>;
  'sesamy:logout': CustomEvent<SesamyLogoutDetail>;
  'sesamy:paywall-shown': CustomEvent<SesamyPaywallShownDetail>;
  'sesamy:paywall-dismissed': CustomEvent<SesamyPaywallDismissedDetail>;
  'sesamy:access-granted': CustomEvent<SesamyAccessGrantedDetail>;
  'sesamy:content-unlocked': CustomEvent<SesamyContentUnlockedDetail>;
}

type DetailOf<K extends keyof SesamyElementEventMap> =
  SesamyElementEventMap[K] extends CustomEvent<infer D> ? D : never;

declare global {
  interface HTMLElementEventMap extends SesamyElementEventMap {}
}

export function createSesamyEvent<K extends keyof SesamyElementEventMap>(
  type: K,
  detail: DetailOf<K>
): SesamyElementEventMap[K] {
  return new CustomEvent(type, {
    detail,
    bubbles: true,
    composed: true
  }) as SesamyElementEventMap[K];
}

export function dispatchSesamyEvent<K extends keyof SesamyElementEventMap>(
  target: EventTarget,
  type: K,
  detail: DetailOf<K>
): boolean {
  return target.dispatchEvent(createSesamyEvent(type, detail));
}

export type AuthState = 'authenticated' | 'unauthenticated' | 'unknown';

export type AuthTransition = 'login' | 'logout' | 'none';

export function authTransition(prev: AuthState, next: AuthState): AuthTransition {
  if (next === 'unknown' || prev === next) return 'none';
  if (prev === 'unauthenticated' && next === 'authenticated') return 'login';
  if (prev === 'authenticated' && next === 'unauthenticated') return 'logout';
  return 'none';
}
