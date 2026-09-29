/**
 * Pure progress-stats module.
 *
 * No React, no DOM, no storage access here — the progress page composes
 * these stats over the `Song`/`SongState` types from `./songs` and the
 * `VocabWord` type from `./vocabulary`, loading persisted data through
 * `./songs-storage` / `./vocabulary-storage`. Built on top of those modules
 * (never duplicating them): line counts come from `SongState.completedLines`
 * as written by the learn flow's `applyMastery`, and vocabulary numbers come
 * verbatim from `computeProgress`.
 *
 * Pinned semantics (see tests):
 * - Mastery tiers over a song's lyric lines, by learned-line percentage:
 *   'new' (0 learned), 'started' (> 0 learned, below 50%), 'partial'
 *   (>= 50%, below 100%), 'mastered' (100%). A song with no lyric lines is
 *   always 'new' at 0% — never NaN.
 * - Only line indices that actually exist in `Song.lyrics` count, so stale
 *   persisted indices past the end of the lyrics are ignored.
 * - `lastPracticed` is the state's `updatedAt` passed through unchanged, or
 *   `null` when the song was never practiced (no state, or the `updatedAt`
 *   default of 0). Nothing here reads the clock: callers pass timestamps in.
 * - Aggregate vocabulary stats are kept as a sibling `vocabulary` field,
 *   composed verbatim from `computeProgress` — lyrics and vocabulary are
 *   reported side by side, never force-merged into one number.
 */

import { type Song, type SongState } from './songs';
import { computeProgress, type VocabProgress, type VocabWord } from './vocabulary';

// ---------------------------------------------------------------------------
// Per-song progress
// ---------------------------------------------------------------------------

/** How far a learner has taken one song. */
export type MasteryTier = 'new' | 'started' | 'partial' | 'mastered';

export interface SongProgress {
  songId: string;
  /** Lyric lines learned (valid completed-line indices in the song's state). */
  learnedLines: number;
  /** Total lyric lines in the song. */
  totalLines: number;
  /** Learned lines as a rounded 0-100 percentage; 0 for a song with no lines. */
  pct: number;
  /** Mastery tier derived from `pct` (cutoffs pinned in the module header). */
  tier: MasteryTier;
  /** The state's `updatedAt` (epoch ms), or `null` when never practiced. */
  lastPracticed: number | null;
}

/** Learned-line indices that actually exist in the song's lyrics. */
function countLearnedLines(state: SongState, totalLines: number): number {
  let count = 0;
  for (const index of state.completedLines) {
    if (Number.isInteger(index) && index >= 0 && index < totalLines) count++;
  }
  return count;
}

/**
 * Progress for one song. `state` is omitted for a song with no persisted
 * learner state — the result is the same as an empty state: 'new' at 0% with
 * a `null` last-practiced time.
 */
export function songProgress(song: Song, state?: SongState): SongProgress {
  const totalLines = song.lyrics.length;
  const learnedLines = state ? countLearnedLines(state, totalLines) : 0;
  const pct =
    totalLines === 0
      ? 0
      : Math.min(100, Math.max(0, Math.round((learnedLines / totalLines) * 100)));
  const tier: MasteryTier =
    learnedLines === 0 ? 'new' : pct === 100 ? 'mastered' : pct >= 50 ? 'partial' : 'started';
  return {
    songId: song.id,
    learnedLines,
    totalLines,
    pct,
    tier,
    lastPracticed: state && state.updatedAt > 0 ? state.updatedAt : null,
  };
}

// ---------------------------------------------------------------------------
// Aggregate progress
// ---------------------------------------------------------------------------

export interface AggregateProgress {
  /** Songs with at least one learned lyric line. */
  songsStarted: number;
  /** Songs whose lyric lines are all learned ('mastered' tier). */
  songsMastered: number;
  /** Learned lyric lines across the whole catalog. */
  totalLinesLearned: number;
  /** Total lyric lines across the whole catalog. */
  totalLines: number;
  /** Learned lines catalog-wide as a rounded 0-100 percentage; 0 with no lines. */
  overallPct: number;
  /**
   * Vocabulary progress as its own sibling summary, verbatim from
   * `computeProgress` — deliberately not merged into the lyric-line counts.
   */
  vocabulary: VocabProgress;
}

/**
 * Aggregate progress across `songs` (in the order given), reading each song's
 * learner state out of `states` (a song without an entry counts as never
 * practiced; state entries for unknown song ids are ignored) and the word
 * list through `computeProgress`. Deterministic: no clock reads, no mutation.
 */
export function aggregateProgress(
  songs: Song[],
  states: Record<string, SongState> = {},
  words: VocabWord[] = []
): AggregateProgress {
  let songsStarted = 0;
  let songsMastered = 0;
  let totalLinesLearned = 0;
  let totalLines = 0;
  for (const song of songs) {
    const progress = songProgress(song, states[song.id]);
    if (progress.tier !== 'new') songsStarted++;
    if (progress.tier === 'mastered') songsMastered++;
    totalLinesLearned += progress.learnedLines;
    totalLines += progress.totalLines;
  }
  const overallPct =
    totalLines === 0
      ? 0
      : Math.min(100, Math.max(0, Math.round((totalLinesLearned / totalLines) * 100)));
  return {
    songsStarted,
    songsMastered,
    totalLinesLearned,
    totalLines,
    overallPct,
    vocabulary: computeProgress(words),
  };
}
