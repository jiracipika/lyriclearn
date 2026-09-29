import { describe, expect, it } from 'vitest';
import { emptySongState, type Song, type SongState } from './songs';
import { computeProgress, createWord } from './vocabulary';
import { aggregateProgress, songProgress } from './progress';

function song(id: string, lyrics: string[]): Song {
  return { id, title: id, artist: 'Test', language: 'en', lyrics };
}

function state(completedLines: number[], updatedAt = 0): SongState {
  return { completedLines, bookmarkedLines: [], updatedAt };
}

const FOUR = song('four', ['a', 'b', 'c', 'd']);
const SIX = song('six', ['1', '2', '3', '4', '5', '6']);
const TWO = song('two', ['x', 'y']);
const NO_LINES = song('empty', []);

describe('songProgress', () => {
  it('counts a song with no state as new at 0%, never practiced', () => {
    expect(songProgress(FOUR)).toEqual({
      songId: 'four',
      learnedLines: 0,
      totalLines: 4,
      pct: 0,
      tier: 'new',
      lastPracticed: null,
    });
  });

  it('treats an empty state the same as no state', () => {
    const progress = songProgress(FOUR, emptySongState());
    expect(progress.tier).toBe('new');
    expect(progress.pct).toBe(0);
    expect(progress.lastPracticed).toBe(null);
  });

  it('does not count bookmarked-only lines as learned', () => {
    const progress = songProgress(FOUR, {
      completedLines: [],
      bookmarkedLines: [0, 1],
      updatedAt: 5,
    });
    expect(progress.learnedLines).toBe(0);
    expect(progress.tier).toBe('new');
  });

  it('pins "started" for anything above 0 learned but below 50%', () => {
    expect(songProgress(SIX, state([0]))).toMatchObject({ pct: 17, tier: 'started' });
    expect(songProgress(SIX, state([0, 1]))).toMatchObject({ pct: 33, tier: 'started' });
  });

  it('pins the partial cutoff at exactly >= 50%', () => {
    expect(songProgress(SIX, state([0, 1, 2]))).toMatchObject({ pct: 50, tier: 'partial' });
    expect(songProgress(TWO, state([0]))).toMatchObject({ pct: 50, tier: 'partial' });
  });

  it('pins "mastered" only at 100%', () => {
    expect(songProgress(TWO, state([0, 1]))).toMatchObject({ pct: 100, tier: 'mastered' });
    expect(songProgress(SIX, state([0, 1, 2, 3, 4]))).toMatchObject({ pct: 83, tier: 'partial' });
  });

  it('passes updatedAt through as lastPracticed, untouched', () => {
    expect(songProgress(FOUR, state([0], 1727500000000)).lastPracticed).toBe(1727500000000);
  });

  it('reports null lastPracticed for the updatedAt default of 0', () => {
    expect(songProgress(FOUR, state([0])).lastPracticed).toBe(null);
    expect(songProgress(FOUR, state([0], 0)).lastPracticed).toBe(null);
  });

  it('ignores learned indices past the end of the lyrics', () => {
    const progress = songProgress(FOUR, state([0, 9, 99]));
    expect(progress.learnedLines).toBe(1);
    expect(progress.pct).toBe(25);
    expect(progress.tier).toBe('started');
  });

  it('handles a song with no lyric lines without dividing by zero', () => {
    expect(songProgress(NO_LINES)).toEqual({
      songId: 'empty',
      learnedLines: 0,
      totalLines: 0,
      pct: 0,
      tier: 'new',
      lastPracticed: null,
    });
    expect(songProgress(NO_LINES, state([0, 1], 7)).pct).toBe(0);
    expect(Number.isNaN(songProgress(NO_LINES, state([0], 7)).pct)).toBe(false);
  });

  it('never mutates the input state', () => {
    const input = state([0, 9]);
    songProgress(FOUR, input);
    expect(input.completedLines).toEqual([0, 9]);
  });
});

describe('aggregateProgress', () => {
  it('returns all zeros for an empty catalog with no states', () => {
    expect(aggregateProgress([], {})).toEqual({
      songsStarted: 0,
      songsMastered: 0,
      totalLinesLearned: 0,
      totalLines: 0,
      overallPct: 0,
      vocabulary: { total: 0, known: 0, learning: 0, newCount: 0, knownPercent: 0 },
    });
  });

  it('aggregates mixed song states: started, mastered and never-practiced songs', () => {
    const songs = [FOUR, SIX, TWO, NO_LINES];
    const states = {
      four: state([0, 1]), // 2/4 = 50% -> partial, started
      six: state([0, 1, 2, 3, 4, 5]), // 6/6 -> mastered
      // 'two' has no state -> new; 'empty' has no lines.
    };
    const aggregate = aggregateProgress(songs, states);
    expect(aggregate.songsStarted).toBe(2);
    expect(aggregate.songsMastered).toBe(1);
    expect(aggregate.totalLinesLearned).toBe(8);
    expect(aggregate.totalLines).toBe(12);
    expect(aggregate.overallPct).toBe(67); // round(8/12 * 100)
  });

  it('ignores state entries for song ids not in the catalog', () => {
    const aggregate = aggregateProgress([FOUR], { ghost: state([0, 1, 2, 3]) });
    expect(aggregate.songsStarted).toBe(0);
    expect(aggregate.totalLinesLearned).toBe(0);
    expect(aggregate.overallPct).toBe(0);
  });

  it('rounds the catalog-wide percentage like the per-song one', () => {
    const songs = [SIX, song('six-b', ['1', '2', '3', '4', '5', '6']), FOUR, TWO];
    const aggregate = aggregateProgress(songs, { six: state([0]), 'six-b': state([0, 1]) });
    expect(aggregate.totalLinesLearned).toBe(3);
    expect(aggregate.totalLines).toBe(18);
    expect(aggregate.overallPct).toBe(17); // round(3/18 * 100)
  });

  it('stays at 0% (never NaN) for a catalog with no lyric lines', () => {
    const aggregate = aggregateProgress([NO_LINES], { empty: state([0], 3) });
    expect(aggregate.overallPct).toBe(0);
    expect(aggregate.totalLines).toBe(0);
    expect(aggregate.songsStarted).toBe(0);
  });

  it('composes vocabulary verbatim from computeProgress as a sibling field', () => {
    const words = [
      createWord({ id: 'w1', term: 'frère', translation: 'brother', status: 'known' }),
      createWord({ id: 'w2', term: 'matines', translation: 'matins', status: 'learning' }),
      createWord({ id: 'w3', term: 'dong', translation: 'dong' }),
    ];
    const aggregate = aggregateProgress([FOUR], {}, words);
    expect(aggregate.vocabulary).toEqual(computeProgress(words));
    expect(aggregate.vocabulary).toEqual({
      total: 3,
      known: 1,
      learning: 1,
      newCount: 1,
      knownPercent: 33,
    });
  });

  it('defaults the vocabulary summary to an empty one when no words are given', () => {
    expect(aggregateProgress([FOUR], {}).vocabulary).toEqual(computeProgress([]));
  });

  it('is deterministic: no hidden clock, same inputs give the same output', () => {
    const states = { four: state([0, 1, 2, 3], 1727500000000) };
    expect(aggregateProgress([FOUR], states)).toEqual(aggregateProgress([FOUR], states));
    // The timestamp only ever flows through from the stored state.
    expect(songProgress(FOUR, states.four).lastPracticed).toBe(1727500000000);
  });
});
