export interface LoginProps extends HTMLElement {
  buttonText?: string;
  loading?: boolean;
  loggedIn?: boolean;
  userAvatar?: string;
  onLogin?: (event: CustomEvent) => void;
}
