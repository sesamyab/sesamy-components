import './app.css';
import './../../lib/src/app.css';
import { mount } from 'svelte';
import ExpressCheckoutDemo from './ExpressCheckoutDemo.svelte';

const appElement = document.getElementById('app');
if (!appElement) {
  throw new Error('Failed to find app element');
}

export default mount(ExpressCheckoutDemo, { target: appElement });
