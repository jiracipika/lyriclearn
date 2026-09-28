import { describe, expect, it } from 'vitest';
import { createWord } from './vocabulary';
import {
  deserializeWords,
  loadWords,
  saveWords,
  serializeWords,
  VOCAB_STORAGE_KEY,
  type StorageLike,
} from './vocabulary-storage';

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

const sample = [
  createWord({ id: 'a', term: 'sol', translation: 'sun', status: 'known', addedAt: 1 }),
  createWord({ id: 'b', term: 'luna', translation: 'moon', songId: 's1' }),
];

describe('serializeWords / deserializeWords', () => {
  it('round-trips a word list losslessly', () => {
    expect(deserializeWords(serializeWords(sample))).toEqual(sample);
  });

  it('deserializeWords returns [] for null, undefined, garbage JSON and non-arrays', () => {
    expect(deserializeWords(null)).toEqual([]);
    expect(deserializeWords(undefined)).toEqual([]);
    expect(deserializeWords('not json {')).toEqual([]);
    expect(deserializeWords('{"a":1}')).toEqual([]);
    expect(deserializeWords('[]')).toEqual([]);
  });
});

describe('loadWords / saveWords with injected storage', () => {
  it('saveWords writes under the canonical key and loadWords reads it back', () => {
    const storage = makeStorage();
    saveWords(sample, storage);
    expect(Object.keys(storage.dump())).toEqual([VOCAB_STORAGE_KEY]);
    expect(loadWords(storage)).toEqual(sample);
  });

  it('loadWords returns [] for an empty storage and [] for null storage override', () => {
    expect(loadWords(makeStorage())).toEqual([]);
    expect(loadWords(null)).toEqual([]);
    expect(loadWords(undefined)).toEqual([]);
  });

  it('saveWords is a safe no-op when no storage is available', () => {
    expect(() => saveWords(sample, null)).not.toThrow();
  });
});
