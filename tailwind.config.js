/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './packages/demo/src/**/*.{svelte,js,ts,jsx,tsx}',
    './packages/lib/src/**/*.{svelte,js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {}
  },
  plugins: [require('@ape-egg/tailwind-rows-columns')]
};
