// File: packages/lib/src/sesamy-components.d.ts

declare module "../../../dist/lib/sesamy-components.es.js" {
  export class Login extends HTMLElement {
    buttonText?: string;
    onLogin?: (event: CustomEvent) => void;
  }

  export class Paywall extends HTMLElement {
    // Add properties for Paywall if needed
  }

  export class RegistrationWall extends HTMLElement {
    // Add properties for Paywall if needed
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "sesamy-login": Login;
    "sesamy-paywall": Paywall;
    "sesamy-registration-wall": RegistrationWall;
  }
}
