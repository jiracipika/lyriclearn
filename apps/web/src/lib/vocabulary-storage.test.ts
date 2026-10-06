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

  // The repo's known localStorage duality: runtimes expose storage either as
  // `window.localStorage` or as a bare `globalThis.localStorage`. Stub BOTH
  // forms pointing at the same backing store, then verify the page-level
  // write path end to end: saveWords with no injected storage persists, and a
  // fresh loadWords call (a "reload") reads the same list back.
  it('saveWords persists through the global fallback and loadWords survives a reload', () => {
    const storage = makeStorage();
    const globalRef = globalThis as { window?: unknown; localStorage?: unknown };
    const previousWindow = globalRef.window;
    const previousLocalStorage = globalRef.localStorage;
    try {
      globalRef.window = { localStorage: storage };
      globalRef.localStorage = storage;

      saveWords(sample);
      expect(storage.dump()[VOCAB_STORAGE_KEY]).toBeDefined();
      expect(loadWords()).toEqual(sample);
    } finally {
      globalRef.window = previousWindow;
      globalRef.localStorage = previousLocalStorage;
    }
  });
});
