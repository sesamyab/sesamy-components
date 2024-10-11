export interface LoginProps {
  buttonText?: string;
  loading?: boolean;
  loggedIn?: boolean;
  userAvatar?: string;
  lang?: string;
  onLogin?: (event: CustomEvent) => void;
}

export interface PaywallProps extends HTMLElement {
  ['settings-url']: string;
  template: 'ARTICLE' | 'BOXES';
}
