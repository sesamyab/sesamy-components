declare module "../../../dist/lib/sesamy-components.es.js" {
  export class Login extends HTMLElement {
    buttonText?: string;
    onLogin?: (event: CustomEvent) => void;
  }

  export class Paywall extends HTMLElement {
    // Add properties for Paywall if needed
  }

  export class Avatar extends HTMLElement {
    loding?: boolean;
    size?: "sm" | "md" | "lg";
  }

  export class Button extends HTMLElement {
    loding?: boolean;
    size?: "sm" | "md" | "lg";
    part?: string;
    "aria-label"?: string;
  }

  export class RegistrationWall extends HTMLElement {}
}

declare global {
  interface HTMLElementTagNameMap {
    "sesamy-login": Login;
    "sesamy-paywall": Paywall;
    "sesamy-avatar": Avatar;
    "sesamy-button": Button;
    "sesamy-registration-wall": RegistrationWall;
  }
}
