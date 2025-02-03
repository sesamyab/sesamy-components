/** @type {import('tailwindcss').Config} */
import tailwindRowsColumns from '@ape-egg/tailwind-rows-columns';
import containerQueries from '@tailwindcss/container-queries';

export default {
  darkMode: 'class',
  content: [
    './packages/demo/src/**/*.{svelte,js,ts,jsx,tsx}',
    './packages/lib/src/**/*.{svelte,js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--s-primary-color)'
      }
    }
  },
  plugins: [tailwindRowsColumns, containerQueries]
};
