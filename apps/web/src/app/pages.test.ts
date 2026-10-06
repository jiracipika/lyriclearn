import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Pins the data-wiring slices: the song detail and vocabulary pages no
 * longer render placeholder card grids — they consume the real data layers
 * (getSongById + loadSongStates/songProgress, loadWords/filterByStatus/
 * computeProgress), and the songs library renders the real catalog through
 * listSongs. The vocabulary page also persists status changes through
 * saveWords. Like a11y.test.ts this greps page sources: the repo has
 * no jsdom/render testing, so source-level pins are the established pattern.
 */

const APP_DIR = dirname(fileURLToPath(import.meta.url));
const songDetailPage = readFileSync(join(APP_DIR, 'songs/[id]/page.tsx'), 'utf8');
const vocabPage = readFileSync(join(APP_DIR, 'vocab/page.tsx'), 'utf8');
const songLibraryPage = readFileSync(join(APP_DIR, 'songs/page.tsx'), 'utf8');

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

  it('flips word status through the shared toggleKnown engine, not a reimplementation', () => {
    expect(vocabPage).toContain("toggleKnown,\n  type VocabWord,");
    expect(vocabPage).toContain('toggleKnown(words, id)');
  });

  it('persists every status change through saveWords so it survives a reload', () => {
    expect(vocabPage).toContain("import { loadWords, saveWords } from '@/lib/vocabulary-storage'");
    expect(vocabPage).toContain('setWords(next);');
    expect(vocabPage).toContain('saveWords(next);');
  });

  it('exposes the known toggle as a real control with a word-specific accessible name', () => {
    expect(vocabPage).toContain('aria-pressed={known}');
    expect(vocabPage).toContain('aria-label={`Toggle ${word.term} as known`}');
  });
});

describe('song library page data wiring', () => {
  it('renders the real catalog through listSongs, not placeholder cards', () => {
    expect(songLibraryPage).toContain("from '@/lib/songs'");
    expect(songLibraryPage).toContain('const songs = listSongs();');
    expect(songLibraryPage).not.toContain('placeholderSongCards');
  });

  it('every card shows the real song fields and links to its song detail page', () => {
    expect(songLibraryPage).toContain('href={`/songs/${song.id}`}');
    expect(songLibraryPage).toContain('{song.title}');
    expect(songLibraryPage).toContain('{song.artist}');
  });

  it('keeps an honest empty state when the catalog is empty', () => {
    expect(songLibraryPage).toContain('songs.length === 0');
    expect(songLibraryPage).toContain('No songs in the catalog yet.');
  });

  it('keeps the established back-link and card accessible names', () => {
    expect(songLibraryPage).toContain('aria-label="Back to home"');
    expect(songLibraryPage).toContain('aria-label={`Open ${song.title} by ${song.artist}`}');
  });
});
