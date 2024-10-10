declare namespace JSX {
  interface IntrinsicElements {
    "sesamy-avatar": {};
    "sesamy-button": {
      buttonText?: string;
      loading?: boolean;
    };
    "sesamy-login": {
      buttonText?: string;
      loading?: boolean;
      loggedIn?: boolean;
    };
    "sesamy-registration-wall": {};
    "sesamy-paywall": {
      "settings-url": string;
    };
  }
}
