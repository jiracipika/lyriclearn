import { describe, expect, it } from 'vitest';
import { emptySongState } from './songs';
import {
  deserializeSongStates,
  loadSongStates,
  saveSongStates,
  serializeSongStates,
  SONG_STATE_STORAGE_KEY,
  type StorageLike,
} from './songs-storage';

function makeStorage(): StorageLike & { dump: () => Record<string, string> } {
  const map = new Map<string, string>();
  return {
    getItem: (key) => (map.has(key) ? (map.get(key) as string) : null),
    setItem: (key, value) => {
      map.set(key, value);
    },
    dump: () => Object.fromEntries(map.entries()),
  };
}

const sample = {
  'frere-jacques': {
    completedLines: [0, 2],
    bookmarkedLines: [3],
    updatedAt: 100,
  },
};

describe('serializeSongStates / deserializeSongStates', () => {
  it('round-trips a song-state record losslessly', () => {
    expect(deserializeSongStates(serializeSongStates(sample))).toEqual(sample);
  });

  it('deserializeSongStates returns {} for null, undefined, garbage JSON and non-objects', () => {
    expect(deserializeSongStates(null)).toEqual({});
    expect(deserializeSongStates(undefined)).toEqual({});
    expect(deserializeSongStates('not json {')).toEqual({});
    expect(deserializeSongStates('[]')).toEqual({});
    expect(deserializeSongStates('"song"')).toEqual({});
  });

  it('drops invalid line indices and normalizes surviving ones to sorted+unique', () => {
    const parsed = deserializeSongStates(
      JSON.stringify({
        s1: { completedLines: [4, -1, 2.5, 0, 4], bookmarkedLines: 'nope', updatedAt: 'x' },
        broken: 'not-an-object',
      })
    );
    expect(parsed.s1).toEqual({ completedLines: [0, 4], bookmarkedLines: [], updatedAt: 0 });
    expect(parsed.broken).toBeUndefined();
  });
});

describe('loadSongStates / saveSongStates with injected storage', () => {
  it('saveSongStates writes under the canonical key and loadSongStates reads it back', () => {
    const storage = makeStorage();
    saveSongStates(sample, storage);
    expect(Object.keys(storage.dump())).toEqual([SONG_STATE_STORAGE_KEY]);
    expect(loadSongStates(storage)).toEqual(deserializeSongStates(serializeSongStates(sample)));
  });

  it('loadSongStates returns {} for an empty storage and {} for a null storage override', () => {
    expect(loadSongStates(makeStorage())).toEqual({});
    expect(loadSongStates(null)).toEqual({});
    expect(loadSongStates(undefined)).toEqual({});
  });

  it('saveSongStates is a safe no-op when no storage is available', () => {
    expect(() => saveSongStates(sample, null)).not.toThrow();
  });

  it('falls back to window.localStorage and honours bare localStorage pointing at it', () => {
    const storage = makeStorage();
    const previousWindow = (globalThis as { window?: unknown }).window;
    try {
      (globalThis as { window?: unknown }).window = { localStorage: storage };
      saveSongStates({ s1: emptySongState(7) });
      expect(storage.dump()[SONG_STATE_STORAGE_KEY]).toBeDefined();
      expect(loadSongStates()).toEqual({ s1: emptySongState(7) });
    } finally {
      (globalThis as { window?: unknown }).window = previousWindow;
    }
  });
});
