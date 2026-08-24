import postcssNesting from 'postcss-nesting';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import remToToken from './scripts/postcss-rem-to-token.js';

export default {
  // remToToken must run after tailwindcss so it sees the expanded utilities
  plugins: [postcssNesting(), tailwindcss(), remToToken(), autoprefixer()]
};
