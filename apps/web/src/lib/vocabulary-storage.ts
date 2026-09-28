/**
 * Persistence boundary for the vocabulary word list.
 *
 * Mirrors the lib/storage pattern: every entry point guards `typeof window`
 * before touching browser storage, and accepts an injected `StorageLike` so
 * tests (and SSR) never need a real `localStorage`.
 */
import type { VocabWord } from './vocabulary';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const VOCAB_STORAGE_KEY = 'lyriclearn.vocab.v1';

/** Serialize a word list for storage. */
export function serializeWords(words: VocabWord[]): string {
  return JSON.stringify(words);
}

/**
 * Parse a stored word list. Returns an empty list for null/undefined input,
 * malformed JSON, or a non-array payload — never throws.
 */
export function deserializeWords(raw: string | null | undefined): VocabWord[] {
  if (raw === null || raw === undefined) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as VocabWord[];
  } catch {
    return [];
  }
}

/**
 * Load the word list. Prefers an explicitly injected storage; otherwise uses
 * `window.localStorage` when available; otherwise (Node, SSR, tests) returns
 * an empty list.
 */
export function loadWords(storage?: StorageLike | null): VocabWord[] {
  const target =
    storage !== undefined && storage !== null
      ? storage
      : typeof window !== 'undefined' && window.localStorage
        ? window.localStorage
        : null;
  if (!target) return [];
  return deserializeWords(target.getItem(VOCAB_STORAGE_KEY));
}

/**
 * Save the word list. No-op when no storage is available (Node, SSR, tests)
 * and none was injected.
 */
export function saveWords(words: VocabWord[], storage?: StorageLike | null): void {
  const target =
    storage !== undefined && storage !== null
      ? storage
      : typeof window !== 'undefined' && window.localStorage
        ? window.localStorage
        : null;
  if (!target) return;
  target.setItem(VOCAB_STORAGE_KEY, serializeWords(words));
}
