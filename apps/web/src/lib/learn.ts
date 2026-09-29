/**
 * Pure learn-flow scoring engine.
 *
 * No React, no DOM, no storage access here — the learn page composes these
 * solvers over the `Song`/`SongState` types from `./songs` and persists
 * results through `./songs-storage`. All functions are deterministic (no
 * RNG) and immutable: they return new values and never mutate their inputs.
 *
 * Pinned semantics (see tests):
 * - Guesses compare equal after NFC normalization, lowercasing, folding
 *   typographic apostrophes and replacing every non-letter/number character
 *   with a word separator. Accents are never transliterated ('é' ≠ 'e').
 * - A line passed with zero failed attempts earns first-try credit (1.0);
 *   any other completed line (failed-then-passed or revealed) earns 0.5.
 *   Score = completed points / total lines, as a rounded 0-100 percentage.
 * - Mastery: every completed line counts as learned — passed or revealed.
 *   Re-completing a line never un-completes it.
 */

import { type SongState } from './songs';

// ---------------------------------------------------------------------------
// Line masking
// ---------------------------------------------------------------------------

/** How a lyric line is presented as a practice cue. */
export type MaskMode =
  /** The line exactly as written. */
  | 'full'
  /** First character of every word kept, everything else masked. */
  | 'first-letters'
  /** Every non-whitespace character masked. */
  | 'hidden';

/** The mask character used for hidden text. */
export const MASK_CHAR = '_';

/**
 * Turn a lyric line into its practice cue for the given mode. Deterministic
 * and length-preserving: the result always has exactly as many UTF-16 code
 * units as the input (whitespace is copied verbatim, every other character
 * is kept or replaced by `MASK_CHAR`).
 *
 * Words are maximal runs of non-whitespace characters; only each run's first
 * character survives in `first-letters` mode (so "l'alouette" cues as
 * "l_________" — apostrophes do not start new words). An unrecognized mode
 * falls back to `hidden`, the safest cue.
 */
export function maskLine(line: string, mode: MaskMode): string {
  let out = '';
  let atWordStart = true;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (/\s/.test(ch)) {
      out += ch;
      atWordStart = true;
      continue;
    }
    if (mode === 'full') {
      out += ch;
    } else if (mode === 'first-letters' && atWordStart) {
      out += ch;
      atWordStart = false;
    } else {
      out += MASK_CHAR;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Guess normalization + grading
// ---------------------------------------------------------------------------

/**
 * Apostrophe variants folded to `'` before the punctuation sweep. U+02BC is
 * Unicode-category *letter* (Lm), so without this fold it would survive the
 * sweep while `'`/`’` become word separators — the fold keeps all three
 * equivalent. (Dashes and quotes need no fold: every variant is punctuation
 * and swept alike.)
 */
const APOSTROPHE_VARIANTS = /[\u2018\u2019\u02BC]/g;

/**
 * Everything that is not a letter, number or whitespace becomes a word
 * separator. Built with `new RegExp` because the `u` flag is rejected by the
 * app's es5 compiler target in regex literals (TS1501); the runtime feature
 * itself is ES2018 and universally supported.
 */
const NON_WORD_CHARS = new RegExp('[^\\p{L}\\p{N}\\s]', 'gu');

/**
 * Normalize a guessed or expected line into its comparable form. Pinned
 * rules, in order:
 * 1. Unicode NFC (composed and decomposed accents compare equal).
 * 2. Typographic apostrophes (' ’ ʼ) fold to `'`.
 * 3. Every character outside Unicode letters/numbers/whitespace (punctuation,
 *    symbols) becomes a word separator — word-boundary punctuation is
 *    forgiving, and apostrophes/hyphens inside words split like spaces.
 * 4. Lowercase; whitespace runs collapse to one space and the ends are trimmed.
 *
 * Accented letters are letters: 'é', 'à', 'ç' survive untouched (apart from
 * case), and 'frère' deliberately does NOT equal 'frere'.
 */
export function normalizeGuess(text: string): string {
  const folded = text
    .normalize('NFC')
    .replace(APOSTROPHE_VARIANTS, "'")
    .replace(NON_WORD_CHARS, ' ')
    .toLowerCase();
  return folded.replace(/\s+/g, ' ').trim();
}

/**
 * Grade a typed guess against the expected line: true exactly when both
 * sides normalize to the same string. A non-empty line therefore never
 * matches an empty (or whitespace-only) guess, and an empty expected line
 * only matches an empty guess.
 */
export function gradeAttempt(expected: string, typed: string): boolean {
  return normalizeGuess(expected) === normalizeGuess(typed);
}

// ---------------------------------------------------------------------------
// Session progression
// ---------------------------------------------------------------------------

/** Mutable-by-replacement state of one learn session over a song's lyrics. */
export interface LearnSession {
  /** Number of lyric lines in the song being practiced. */
  totalLines: number;
  /** Index of the line currently being practiced; equals `totalLines` once the session is complete. */
  currentLine: number;
  /** Indexes of lines completed this session (passed or revealed), ascending and unique. */
  revealedLineIndexes: number[];
  /** Failed attempts on the current line since it was shown; reset when the line is left. */
  attempts: number;
  /** Lines completed without any failed attempt on them (first-try passes). */
  correctFirstTries: number;
}

/**
 * A fresh session over `totalLines` lyric lines, starting at line 0. A
 * non-positive or non-finite count yields an already-complete session.
 */
export function startLearnSession(totalLines: number): LearnSession {
  const count =
    typeof totalLines === 'number' && Number.isFinite(totalLines)
      ? Math.max(0, Math.floor(totalLines))
      : 0;
  return {
    totalLines: count,
    currentLine: 0,
    revealedLineIndexes: [],
    attempts: 0,
    correctFirstTries: 0,
  };
}

/** True once every line has been completed (or the song has no lines). */
export function isSessionComplete(session: LearnSession): boolean {
  return session.currentLine >= session.totalLines;
}

/**
 * Record one failed attempt on the current line. No-op when the session is
 * already complete.
 */
export function recordFailedAttempt(session: LearnSession): LearnSession {
  if (isSessionComplete(session)) return session;
  return { ...session, attempts: session.attempts + 1 };
}

/**
 * Complete the current line with a correct guess and advance to the next
 * one. First-try credit is awarded only when the line was passed with zero
 * failed attempts. The failed-attempt counter resets for the next line.
 * No-op when the session is already complete.
 */
export function passCurrentLine(session: LearnSession): LearnSession {
  if (isSessionComplete(session)) return session;
  return {
    ...session,
    revealedLineIndexes: [...session.revealedLineIndexes, session.currentLine],
    currentLine: session.currentLine + 1,
    attempts: 0,
    correctFirstTries:
      session.correctFirstTries + (session.attempts === 0 ? 1 : 0),
  };
}

/**
 * Tap-to-reveal fallback: show the current line's answer, complete it
 * WITHOUT first-try credit, and advance. Failed attempts are forgiven (the
 * counter resets). No-op when the session is already complete.
 */
export function revealNext(session: LearnSession): LearnSession {
  if (isSessionComplete(session)) return session;
  return {
    ...session,
    revealedLineIndexes: [...session.revealedLineIndexes, session.currentLine],
    currentLine: session.currentLine + 1,
    attempts: 0,
  };
}

// ---------------------------------------------------------------------------
// Scoring + mastery
// ---------------------------------------------------------------------------

/**
 * Session score as a rounded 0-100 percentage. Each completed line earns a
 * point: 1.0 for a first-try pass, 0.5 otherwise (failed-then-passed or
 * revealed). A song with no lines scores 0, never NaN; the result is
 * clamped defensively to [0, 100].
 */
export function sessionScore(session: LearnSession): number {
  const total = session.totalLines;
  if (total <= 0) return 0;
  const completed = session.revealedLineIndexes.length;
  const points =
    session.correctFirstTries + 0.5 * (completed - session.correctFirstTries);
  return Math.min(100, Math.max(0, Math.round((points / total) * 100)));
}

/**
 * Which of the song's line indexes this session marks as learned: every
 * completed line, whether passed or revealed (the score already carries the
 * quality signal). Returned as a fresh array the caller may freely mutate.
 */
export function sessionLearnedLines(session: LearnSession): number[] {
  return [...session.revealedLineIndexes];
}

/**
 * Merge a session's learned lines into a song's persisted learner state:
 * every index in `indexes` is added to `completedLines` (invalid indexes
 * ignored; result ascending and unique), bookmarks are preserved, and
 * `updatedAt` is set to `now`. Mastery never un-completes: re-passing a
 * line is a no-op for that line — use `toggleLineIndex` for explicit
 * un-completion. The input state is never mutated.
 */
export function applyMastery(
  state: SongState,
  indexes: number[],
  now: number
): SongState {
  const merged = [...state.completedLines];
  for (const index of indexes) {
    if (!Number.isInteger(index) || index < 0 || merged.includes(index)) continue;
    merged.push(index);
  }
  merged.sort((a, b) => a - b);
  return { ...state, completedLines: merged, updatedAt: now };
}
