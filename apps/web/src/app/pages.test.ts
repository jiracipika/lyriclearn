import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Pins the final data-wiring slice: the song detail and vocabulary pages no
 * longer render placeholder card grids — they consume the real data layers
 * (getSongById + loadSongStates/songProgress, loadWords/filterByStatus/
 * computeProgress). Like a11y.test.ts this greps page sources: the repo has
 * no jsdom/render testing, so source-level pins are the established pattern.
 */

const APP_DIR = dirname(fileURLToPath(import.meta.url));
const songDetailPage = readFileSync(join(APP_DIR, 'songs/[id]/page.tsx'), 'utf8');
const vocabPage = readFileSync(join(APP_DIR, 'vocab/page.tsx'), 'utf8');

describe('song detail page data wiring', () => {
  it('looks the song up through getSongById from the useParams id', () => {
    expect(songDetailPage).toContain("useParams<{ id: string }>");
    expect(songDetailPage).toContain("getSongById(params?.id ?? '')");
  });

  it('derives mastery from the shared songProgress engine, not a reimplementation', () => {
    expect(songDetailPage).toContain("from '@/lib/progress'");
    expect(songDetailPage).toContain('songProgress(song, states[song.id])');
  });

  it('loads persisted learner state through loadSongStates inside useEffect', () => {
    expect(songDetailPage).toMatch(/useEffect\(/);
    expect(songDetailPage).toContain('loadSongStates()');
  });

  it('keeps a primary CTA into the learn flow with a specific accessible name', () => {
    expect(songDetailPage).toContain('href={`/songs/${song.id}/learn`}');
    expect(songDetailPage).toContain('aria-label={`Practice ${song.title} in Learn Mode`}');
  });

  it('renders the real song fields and the lyric list', () => {
    expect(songDetailPage).toContain('{song.title}');
    expect(songDetailPage).toContain('{song.artist}');
    expect(songDetailPage).toContain('{song.language.toUpperCase()}');
    expect(songDetailPage).toContain('{song.difficulty !== undefined');
    expect(songDetailPage).toContain('{song.lyrics.map(');
  });

  it('keeps the graceful not-found state for unknown ids, matching the learn page', () => {
    expect(songDetailPage).toContain('Song Not Found');
    expect(songDetailPage).toContain('aria-label="Back to all songs"');
  });

  it('no longer renders the placeholder card grid', () => {
    expect(songDetailPage).not.toContain('placeholderSongCards');
  });
});

describe('vocabulary page data wiring', () => {
  it('renders the persisted word list via loadWords inside useEffect', () => {
    expect(vocabPage).toMatch(/useEffect\(/);
    expect(vocabPage).toContain('loadWords()');
  });

  it('groups the list by status through filterByStatus', () => {
    expect(vocabPage).toContain('filterByStatus(words, status)');
  });

  it('summarizes the list with the shared computeProgress engine', () => {
    expect(vocabPage).toContain('computeProgress(words)');
  });

  it('attributes words to their songs via getSongById', () => {
    expect(vocabPage).toContain('getSongById(word.songId)');
  });

  it('guides the empty state to the song library — words are user-added, never seeded', () => {
    expect(vocabPage).toContain('No saved words yet.');
    expect(vocabPage).toContain('href="/songs"');
  });

  it('no longer renders the placeholder card bridge', () => {
    expect(vocabPage).not.toContain('placeholderVocabCards');
  });
});
