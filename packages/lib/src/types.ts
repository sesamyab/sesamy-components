export interface LoginProps {
  buttonText?: string;
  loading?: boolean;
  loggedIn?: boolean;
  userAvatar?: string;
  onLogin?: (event: CustomEvent) => void;
}

export interface PaywallProps extends HTMLElement {
  ['settings-url']: string;
  template: 'ARTICLE' | 'BOXES';
}
