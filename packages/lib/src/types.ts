export interface LoginProps {
  buttonText?: string;
  loading?: boolean;
  loggedIn?: boolean;
  userAvatar?: string;
  onLogin?: (event: CustomEvent) => void;
}
