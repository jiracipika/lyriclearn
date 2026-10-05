/**
 * Pure vocabulary word-tracking domain module.
 *
 * No React, no DOM, no `window` access here — persistence lives behind the
 * boundary in `./vocabulary-storage`. All list operations are immutable:
 * they return new arrays and never mutate their inputs.
 */

export type WordStatus = 'new' | 'learning' | 'known';

export interface VocabWord {
  id: string;
  term: string;
  translation: string;
  /** Song the word comes from, if it was learned from a song. */
  songId?: string;
  status: WordStatus;
  /** Epoch milliseconds at which the word was added. */
  addedAt: number;
}

export interface VocabWordInput {
  id: string;
  term: string;
  translation: string;
  songId?: string;
  status?: WordStatus;
  addedAt?: number;
}

export function createWord(input: VocabWordInput): VocabWord {
  return {
    id: input.id,
    term: input.term,
    translation: input.translation,
    ...(input.songId !== undefined ? { songId: input.songId } : {}),
    status: input.status ?? 'new',
    addedAt: input.addedAt ?? 0,
  };
}

// ---------------------------------------------------------------------------
// List operations
// ---------------------------------------------------------------------------

/**
 * Add a word to the list. If a word with the same id already exists it is
 * replaced in place (list order otherwise preserved).
 */
export function addWord(words: VocabWord[], word: VocabWord): VocabWord[] {
  const index = words.findIndex((w) => w.id === word.id);
  if (index === -1) return [...words, word];
  const next = [...words];
  next[index] = word;
  return next;
}

/** Remove the word with the given id. No-op (same contents, new array is not required) if absent. */
export function removeWord(words: VocabWord[], id: string): VocabWord[] {
  return words.filter((w) => w.id !== id);
}

/** Set the status of the word with the given id. Returns the input list untouched if the id is absent. */
export function setWordStatus(
  words: VocabWord[],
  id: string,
  status: WordStatus
): VocabWord[] {
  return words.map((w) => (w.id === id ? { ...w, status } : w));
}

/**
 * Toggle a word between "known" and "new": a known word goes back to "new",
 * anything else becomes "known". No-op if the id is absent.
 */
export function toggleKnown(words: VocabWord[], id: string): VocabWord[] {
  return words.map((w) =>
    w.id === id ? { ...w, status: w.status === 'known' ? 'new' : 'known' } : w
  );
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function filterByStatus(words: VocabWord[], status: WordStatus): VocabWord[] {
  return words.filter((w) => w.status === status);
}

/**
 * Case-insensitive substring match over `term` and `translation`.
 * An empty/whitespace-only term matches everything.
 */
export function searchWords(words: VocabWord[], term: string): VocabWord[] {
  const needle = term.trim().toLowerCase();
  if (needle === '') return [...words];
  return words.filter(
    (w) =>
      w.term.toLowerCase().includes(needle) ||
      w.translation.toLowerCase().includes(needle)
  );
}

/**
 * Words belonging to a song. Passing `undefined` selects the global
 * (song-less) vocabulary — words without a `songId`.
 */
export function wordsForSong(
  words: VocabWord[],
  songId: string | undefined
): VocabWord[] {
  if (songId === undefined) return words.filter((w) => w.songId === undefined);
  return words.filter((w) => w.songId === songId);
}

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

export interface VocabProgress {
  total: number;
  known: number;
  learning: number;
  newCount: number;
  /** Percentage of words known, rounded to the nearest integer. 0 for an empty list. */
  knownPercent: number;
}

export function computeProgress(words: VocabWord[]): VocabProgress {
  const total = words.length;
  const known = words.filter((w) => w.status === 'known').length;
  const learning = words.filter((w) => w.status === 'learning').length;
  const newCount = words.filter((w) => w.status === 'new').length;
  const knownPercent =
    total === 0 ? 0 : Math.round((known / total) * 100);
  return { total, known, learning, newCount, knownPercent };
}

// ---------------------------------------------------------------------------
// Placeholder card data
// ---------------------------------------------------------------------------

/**
 * Card data shape of the S1 placeholder bridge. The vocabulary page now
 * renders the real persisted word list (`loadWords` + `filterByStatus`), so
 * no page consumes this any more. Kept — with its tests — alongside
 * `placeholderSongCards` so the two bridges can be retired together when
 * the songs library page is wired to the real catalog.
 */
export interface VocabCardData {
  id: string;
  title: string;
  subtitle: string;
  gradient: string;
}

export const VOCAB_PLACEHOLDER_COUNT = 6;

/**
 * Deterministically derives the placeholder cards the vocabulary page
 * renders. Pure: same count in, same cards out.
 */
export function placeholderVocabCards(
  count: number = VOCAB_PLACEHOLDER_COUNT
): VocabCardData[] {
  const cards: VocabCardData[] = [];
  for (let i = 1; i <= count; i++) {
    const hue = i * 51;
    cards.push({
      id: `vocab-placeholder-${i}`,
      title: `Vocabulary Item ${i}`,
      subtitle: `Added ${i}d ago`,
      gradient: `linear-gradient(135deg, hsl(${hue}, 40%, 85%) 0%, hsl(${hue + 30}, 45%, 80%) 100%)`,
    });
  }
  return cards;
}
