/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Reads the custom properties of app/globals.css per theme, so tests
 * can check the design tokens without a browser.
 */

import { parseColor, type Rgba } from './color';

export type Tokens = Record<string, string>;

/** Custom properties declared directly in the first rule whose selector is `selector`. */
function declarations(css: string, selector: string): Tokens {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) return {};
  const body = css.slice(start + selector.length + 2, css.indexOf('}', start));
  const tokens: Tokens = {};
  for (const [, name, value] of body.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    tokens[name] = value.trim();
  }
  return tokens;
}

/**
 * The tokens of each theme: `:root` holds the light values and the aliases, and
 * `[data-theme="dark"]` overrides some of them, on the same element.
 */
export function readThemeTokens(css: string): { light: Tokens; dark: Tokens } {
  const light = declarations(css, ':root');
  return { light, dark: { ...light, ...declarations(css, '[data-theme="dark"]') } };
}

/** Resolves a color value, following `var(--x)` references; null if it is not a color. */
export function resolveColor(value: string, tokens: Tokens, depth = 0): Rgba | null {
  const ref = /^var\((--[a-z0-9-]+)\)$/i.exec(value.trim());
  if (ref) return depth < 8 && tokens[ref[1]] !== undefined ? resolveColor(tokens[ref[1]], tokens, depth + 1) : null;
  return parseColor(value);
}
