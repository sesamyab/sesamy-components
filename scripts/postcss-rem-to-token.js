import valueParser from 'postcss-value-parser';

const DEFAULT_TOKEN = '--s-base-font-size';
const DEFAULT_ROOT_FONT_SIZE = 16;

/**
 * Replaces every `rem` length in the compiled CSS so that rendering never
 * depends on the host page's root font-size (vendors commonly set
 * `html { font-size: 62.5% }`, which would shrink rem-based components —
 * `rem` resolves against the host page's <html> even inside shadow DOM).
 *
 * - Declaration values: `0.875rem` -> `calc(0.875 * var(--s-base-font-size, 16px))`,
 *   so all sizes scale from one design token vendors can set in px.
 * - Media/container query conditions: `28rem` -> `448px`, since `var()` is not
 *   allowed inside query conditions.
 */
const remToToken = (opts = {}) => {
  const token = opts.token ?? DEFAULT_TOKEN;
  const rootFontSize = opts.rootFontSize ?? DEFAULT_ROOT_FONT_SIZE;

  const rewrite = (css, toValue) => {
    if (!css.includes('rem')) return css;
    const parsed = valueParser(css);
    let changed = false;
    parsed.walk((node) => {
      if (node.type !== 'word') return;
      const dimension = valueParser.unit(node.value);
      if (!dimension || dimension.unit !== 'rem') return;
      node.value = toValue(parseFloat(dimension.number));
      changed = true;
    });
    return changed ? parsed.toString() : css;
  };

  const toCalc = (n) => (n === 0 ? '0px' : `calc(${n} * var(${token}, ${rootFontSize}px))`);
  const toPx = (n) => `${n * rootFontSize}px`;

  const rewriteQueryCondition = (atRule) => {
    atRule.params = rewrite(atRule.params, toPx);
  };

  return {
    postcssPlugin: 'postcss-rem-to-token',
    Declaration(decl) {
      decl.value = rewrite(decl.value, toCalc);
    },
    AtRule: {
      media: rewriteQueryCondition,
      container: rewriteQueryCondition
    }
  };
};

remToToken.postcss = true;

export default remToToken;
