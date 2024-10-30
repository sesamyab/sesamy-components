import type { SesamyAPI } from '@sesamy/sesamy-js';
import store from '../store';

let { loggingIn, loggingOut, isLoggedIn, user } = store;

export const login = async (api: SesamyAPI) => {
  loggingIn = true;
  try {
    await api.auth.loginWithRedirect();
  } catch (error) {
    loggingIn = false;
    console.error('Login failed:', error);
  }
};

export const logout = async (api: SesamyAPI) => {
  loggingOut = true;
  try {
    await api.auth.logout();
    isLoggedIn = false;
  } catch (error) {
    console.error('Logout failed:', error);
  }
};

export const checkLoggedIn = async (api: SesamyAPI) => {
  try {
    isLoggedIn = await api.auth.isAuthenticated();
    if (isLoggedIn) {
      user = await api.auth.getUser();
    }
  } catch (error) {
    console.error('Error checking login status:', error);
  }
};
