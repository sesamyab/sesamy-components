declare namespace JSX {
  interface IntrinsicElements {
    'sesamy-avatar': {};
    'sesamy-button': {
      buttonText?: string;
      loading?: boolean;
    };
    'sesamy-content-container': {
      'item-src'?: string;
      pass?: string;
      'access-level'?: 'public' | 'logged-in' | 'entitlement';
      'publisher-content-id'?: string;
      'lock-mode'?: 'embed' | 'encode' | 'signedUrl' | 'event';
    };
    'sesamy-login': {
      buttonText?: string;
      loading?: boolean;
      loggedIn?: boolean;
    };
    'sesamy-paywall': {
      'settings-url': string;
    };
  }
}
