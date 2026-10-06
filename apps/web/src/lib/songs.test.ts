import { describe, expect, it } from 'vitest';
import {
  SONG_CATALOG,
  emptySongState,
  filterByLanguage,
  getSongById,
  listSongs,
  searchSongs,
  toggleLineIndex,
  type SongDifficulty,
} from './songs';

const DIFFICULTIES: SongDifficulty[] = ['beginner', 'intermediate', 'advanced'];

describe('seed catalog invariants', () => {
  it('has unique ids that all resolve through getSongById', () => {
    const ids = SONG_CATALOG.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const song of SONG_CATALOG) {
      expect(getSongById(song.id)).toBe(song);
    }
  });

  it('only ships complete songs with non-empty lyrics', () => {
    for (const song of SONG_CATALOG) {
      expect(song.title.length).toBeGreaterThan(0);
      expect(song.artist.length).toBeGreaterThan(0);
      expect(song.language.length).toBeGreaterThan(0);
      expect(song.lyrics.length).toBeGreaterThan(0);
      for (const line of song.lyrics) {
        expect(line.trim().length).toBeGreaterThan(0);
      }
      if (song.difficulty !== undefined) {
        expect(DIFFICULTIES).toContain(song.difficulty);
      }
    }
  });
});

describe('queries', () => {
  it('listSongs returns every song as a copy the caller may mutate', () => {
    const songs = listSongs();
    expect(songs).toEqual(SONG_CATALOG);
    songs.pop();
    expect(listSongs()).toHaveLength(SONG_CATALOG.length);
  });

  it('getSongById returns the match and undefined for unknown ids', () => {
    expect(getSongById('frere-jacques')?.title).toBe('Frère Jacques');
    expect(getSongById('missing-song')).toBeUndefined();
    expect(getSongById('')).toBeUndefined();
  });

  it('searchSongs matches case-insensitively over title, artist and lyrics', () => {
    expect(searchSongs('frère').map((s) => s.id)).toEqual(['frere-jacques']);
    expect(searchSongs('NEWTON').map((s) => s.id)).toEqual(['amazing-grace']);
    expect(searchSongs('plumerai').map((s) => s.id)).toEqual(['alouette']);
  });

  it('searchSongs with an empty or whitespace query returns every song', () => {
    expect(searchSongs('')).toHaveLength(SONG_CATALOG.length);
    expect(searchSongs('   ')).toHaveLength(SONG_CATALOG.length);
    expect(searchSongs('zzz')).toEqual([]);
  });

  it('filterByLanguage filters by tag case-insensitively', () => {
    expect(filterByLanguage('fr').map((s) => s.id)).toEqual(['frere-jacques', 'alouette']);
    expect(filterByLanguage('ES').map((s) => s.id)).toEqual(['la-cucaracha']);
    expect(filterByLanguage('de')).toEqual([]);
  });
});

describe('song learner state', () => {
  it('emptySongState starts with no completed or bookmarked lines', () => {
    expect(emptySongState()).toEqual({ completedLines: [], bookmarkedLines: [], updatedAt: 0 });
    expect(emptySongState(42).updatedAt).toBe(42);
  });

  it('toggleLineIndex adds, removes and keeps indices sorted and unique', () => {
    expect(toggleLineIndex([], 2)).toEqual([2]);
    expect(toggleLineIndex([2], 0)).toEqual([0, 2]);
    expect(toggleLineIndex([0, 2], 2)).toEqual([0]);
    expect(toggleLineIndex([1], 1)).toEqual([]);
  });

  it('toggleLineIndex ignores invalid indices and never mutates its input', () => {
    const indices = [1, 3];
    expect(toggleLineIndex(indices, -1)).toEqual([1, 3]);
    expect(toggleLineIndex(indices, 1.5)).toEqual([1, 3]);
    expect(indices).toEqual([1, 3]);
  });
});
