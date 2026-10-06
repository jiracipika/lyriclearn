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
 *
 * It also pins the a11y contract of the pages rewired in the final data-
 * wiring slice (song detail + vocabulary + songs library): landmark/heading
 * structure, specific back-link and CTA accessible names, token-only grays,
 * and no inline outline overrides — the same contract the learn/progress
 * pages already follow.
 */

const APP_DIR = dirname(fileURLToPath(import.meta.url));
const globalsCss = readFileSync(join(APP_DIR, 'globals.css'), 'utf8');
const learnPage = readFileSync(join(APP_DIR, 'songs/[id]/learn/page.tsx'), 'utf8');
const songDetailPage = readFileSync(join(APP_DIR, 'songs/[id]/page.tsx'), 'utf8');
const vocabPage = readFileSync(join(APP_DIR, 'vocab/page.tsx'), 'utf8');
const songLibraryPage = readFileSync(join(APP_DIR, 'songs/page.tsx'), 'utf8');

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

describe('rewired pages a11y contract (song detail + vocabulary + songs library)', () => {
  // The song detail page has a found and a not-found render branch — exactly
  // one renders at runtime, so the source carries two <main>/<h1> occurrences
  // (one per branch). The vocabulary and songs library pages keep a single
  // <main>/<h1> and swap only the content below it.
  it.each([
    ['song detail', songDetailPage, 2],
    ['vocabulary', vocabPage, 1],
    ['songs library', songLibraryPage, 1],
  ])('%s page: one <main> landmark and one <h1> per render branch', (_name, source, branches) => {
    expect(source.match(/<main\b/g)).toHaveLength(branches);
    expect(source.match(/<h1\b/g)).toHaveLength(branches);
  });

  it.each([
    ['song detail', songDetailPage],
    ['vocabulary', vocabPage],
    ['songs library', songLibraryPage],
  ])('%s back link carries a specific aria-label', (_name, source) => {
    expect(source).toMatch(/aria-label="Back to (all songs|home)"/);
  });

  it('song detail: the learn-flow CTA and progress bar expose accessible names', () => {
    expect(songDetailPage).toContain('aria-label={`Practice ${song.title} in Learn Mode`}');
    expect(songDetailPage).toContain('role="progressbar"');
    expect(songDetailPage).toContain('aria-valuetext=');
    expect(songDetailPage).toContain('aria-label={`${song.title} progress`}');
  });

  it.each([
    ['song detail', songDetailPage],
    ['vocabulary', vocabPage],
    ['songs library', songLibraryPage],
  ])('%s page keeps secondary text on the fixed --ios-label3 token (no hardcoded grays)', (_name, source) => {
    expect(source).toContain('var(--ios-label3)');
    expect(source, 'grays must come from design tokens, never literal hexes').not.toMatch(
      /#(8E8E93|6D6D72|3C3C43)/i
    );
  });

  it.each([
    ['song detail', songDetailPage],
    ['vocabulary', vocabPage],
    ['songs library', songLibraryPage],
  ])('%s page sets no inline outline that would break keyboard focus visibility', (_name, source) => {
    expect(source, 'inline `outline` would override the .learn-input:focus-visible rule').not.toMatch(/outline\s*:/);
  });
});
