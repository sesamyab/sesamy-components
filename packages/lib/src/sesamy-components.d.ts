declare namespace JSX {
  interface IntrinsicElements {
    'sesamy-avatar': {};
    'sesamy-button': {
      loading?: boolean;
      disabled?: boolean;
      href: string;
      onclick?: () => {};
      size?: 'sm' | 'md' | 'lg';
      variant?: 'primary' | 'secondry' | 'tertiary';
    };
    'sesamy-login': {
      buttonText?: string;
      loading?: boolean;
      loggedIn?: boolean;
    };
    'sesamy-content-container': {};
    'sesamy-registration-wall': {};
    'sesamy-paywall': {
      'settings-url': string;
    };
  }
}
