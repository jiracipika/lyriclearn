import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Pins the two a11y defects found in the 2026-09-29 accessibility pass:
 *  1. `--ios-label3` must clear WCAG AA contrast against every background its
 *     text is rendered on (4.5:1 — all uses are 12–15px normal-weight text).
 *  2. The learn-mode practice input must have a visible keyboard focus style
 *     (WCAG 2.4.7) via the `.learn-input:focus-visible` rule in globals.css.
 */

const APP_DIR = dirname(fileURLToPath(import.meta.url));
const globalsCss = readFileSync(join(APP_DIR, 'globals.css'), 'utf8');
const learnPage = readFileSync(join(APP_DIR, 'songs/[id]/learn/page.tsx'), 'utf8');

function tokenValue(name: string): string {
  const match = globalsCss.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!match) throw new Error(`token --${name} not found in globals.css`);
  return match[1].trim();
}

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(value)) throw new Error(`unsupported color: ${hex}`);
  return [0, 1, 2].map((i) => parseInt(value.slice(i * 2, i * 2 + 2), 16)) as [number, number, number];
}

/** WCAG 2.x relative luminance of a hex color. */
function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two hex colors, rounded to 2 decimals. */
function contrastRatio(foreground: string, background: string): number {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
}

describe('ios-label3 WCAG AA contrast', () => {
  // --ios-label3 text is rendered on --ios-bg (page subtitles) and --ios-bg2
  // (cards), always at 12–15px normal weight → AA requires 4.5:1.
  const textBackgrounds = ['ios-bg', 'ios-bg2'];

  it.each(textBackgrounds)('clears 4.5:1 against --%s', (backgroundToken) => {
    const label3 = tokenValue('ios-label3');
    const background = tokenValue(backgroundToken);
    const ratio = contrastRatio(label3, background);
    expect(ratio, `--ios-label3 (${label3}) on --${backgroundToken} (${background}) = ${ratio}:1`).toBeGreaterThanOrEqual(4.5);
  });

  it('still clears 3:1 against --ios-bg, keeping the 1px input/button borders non-text-contrast compliant', () => {
    const ratio = contrastRatio(tokenValue('ios-label3'), tokenValue('ios-bg'));
    expect(ratio).toBeGreaterThanOrEqual(3);
  });
});

describe('learn input keyboard focus style', () => {
  it('defines a visible :focus-visible indicator for .learn-input in globals.css', () => {
    const rule = globalsCss.match(/\.learn-input:focus-visible\s*\{([^}]*)\}/);
    expect(rule, 'expected a `.learn-input:focus-visible { … }` rule in globals.css').not.toBeNull();
    const declarations = rule?.[1] ?? '';
    expect(declarations).toMatch(/outline:\s*(?!none)(?!0)/);
  });

  it('wires the class onto the practice input without an inline outline that would override it', () => {
    const input = learnPage.match(/<input\b[\s\S]*?\/>/);
    expect(input, 'expected an <input> element on the learn page').not.toBeNull();
    const markup = input?.[0] ?? '';
    expect(markup).toContain('className="learn-input"');
    expect(markup, 'inline `outline` would override the .learn-input:focus-visible rule').not.toMatch(/outline\s*:/);
  });
});
