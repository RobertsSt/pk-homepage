/**
 * Whether a colour can be read on the paper of the site.
 *
 * The accent colour changes with the presidium and is typed in by an editor
 * (`presiding.accent` in home.yaml). It is used for small text and thin rules
 * on the light surfaces, so a pale colour would leave words that cannot be
 * read. The schema asks this file before a build accepts the colour.
 */

/** The darkest of the light surfaces: `--color-paper-deep` in global.css. */
export const DEEPEST_PAPER = '#ebe5d7';

/** What WCAG 2 asks between text of ordinary size and its background. */
export const READABLE = 4.5;

/** One channel of sRGB, from 0 to 255, as a share of linear light. */
function linear(value: number): number {
  const share = value / 255;
  return share <= 0.04045 ? share / 12.92 : ((share + 0.055) / 1.055) ** 2.4;
}

/** Relative luminance of a colour written as #rrggbb. */
function luminance(hex: string): number {
  const channel = (start: number) => linear(Number.parseInt(hex.slice(start, start + 2), 16));
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

/** Contrast between two colours as WCAG 2 counts it: 1 for the same colour, 21 for black on white. */
export function contrast(first: string, second: string): number {
  const lighter = Math.max(luminance(first), luminance(second));
  const darker = Math.min(luminance(first), luminance(second));
  return (lighter + 0.05) / (darker + 0.05);
}

/** True for a colour dark enough for text on every light surface of the site. */
export const readableOnPaper = (hex: string) => contrast(hex, DEEPEST_PAPER) >= READABLE;
