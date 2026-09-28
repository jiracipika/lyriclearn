import { describe, expect, it } from 'vitest';
import {
  addWord,
  computeProgress,
  createWord,
  filterByStatus,
  placeholderVocabCards,
  removeWord,
  searchWords,
  setWordStatus,
  toggleKnown,
  wordsForSong,
  type VocabWord,
} from './vocabulary';

function word(overrides: Partial<VocabWord> = {}): VocabWord {
  return createWord({
    id: 'w1',
    term: 'canción',
    translation: 'song',
    ...overrides,
  });
}

describe('createWord', () => {
  it('applies defaults for status and addedAt', () => {
    const w = createWord({ id: 'a', term: 'hola', translation: 'hello' });
    expect(w.status).toBe('new');
    expect(w.addedAt).toBe(0);
    expect(w.songId).toBeUndefined();
  });

  it('keeps explicit status, songId and addedAt', () => {
    const w = createWord({
      id: 'a',
      term: 'hola',
      translation: 'hello',
      songId: 's1',
      status: 'learning',
      addedAt: 42,
    });
    expect(w).toEqual({
      id: 'a',
      term: 'hola',
      translation: 'hello',
      songId: 's1',
      status: 'learning',
      addedAt: 42,
    });
  });
});

describe('list operations', () => {
  it('addWord appends a new word and replaces an existing id in place', () => {
    const a = word({ id: 'a' });
    const b = word({ id: 'b' });
    const two = addWord(addWord([], a), b);
    expect(two).toEqual([a, b]);
    const updatedA = { ...a, status: 'known' as const };
    const replaced = addWord(two, updatedA);
    expect(replaced).toEqual([updatedA, b]);
    expect(replaced).toHaveLength(2);
  });

  it('addWord does not mutate the input list', () => {
    const a = word({ id: 'a' });
    const list = [a];
    addWord(list, word({ id: 'b' }));
    expect(list).toEqual([a]);
  });

  it('removeWord removes only the target id and is a no-op for absent ids', () => {
    const a = word({ id: 'a' });
    const b = word({ id: 'b' });
    const list = [a, b];
    expect(removeWord(list, 'a')).toEqual([b]);
    expect(removeWord(list, 'zzz')).toEqual([a, b]);
  });

  it('setWordStatus updates the target word only and is a no-op when absent', () => {
    const a = word({ id: 'a' });
    const b = word({ id: 'b' });
    const list = [a, b];
    const next = setWordStatus(list, 'b', 'known');
    expect(next[1].status).toBe('known');
    expect(next[0]).toEqual(a);
    expect(setWordStatus(list, 'zzz', 'known')).toEqual(list);
  });

  it('toggleKnown sends known back to new and everything else to known', () => {
    const known = word({ id: 'k', status: 'known' });
    const learning = word({ id: 'l', status: 'learning' });
    const fresh = word({ id: 'n', status: 'new' });
    const list = [known, learning, fresh];
    const toggled = toggleKnown(list, 'k');
    expect(toggled[0].status).toBe('new');
    expect(toggleKnown(toggled, 'k')[0].status).toBe('known');
    expect(toggleKnown(list, 'l')[1].status).toBe('known');
    expect(toggleKnown(list, 'zzz')).toEqual(list);
  });
});

describe('queries', () => {
  const list: VocabWord[] = [
    word({ id: 'a', term: 'Canción', translation: 'song', status: 'known' }),
    word({ id: 'b', term: 'corazón', translation: 'heart', status: 'learning' }),
    word({ id: 'c', term: 'sol', translation: 'Sun', songId: 's1' }),
    word({ id: 'd', term: 'luna', translation: 'moon' }),
  ];

  it('filterByStatus returns only matching words', () => {
    expect(filterByStatus(list, 'known').map((w) => w.id)).toEqual(['a']);
    expect(filterByStatus(list, 'learning').map((w) => w.id)).toEqual(['b']);
  });

  it('searchWords matches case-insensitively over term and translation', () => {
    expect(searchWords(list, 'CANC').map((w) => w.id)).toEqual(['a']);
    expect(searchWords(list, 'heart').map((w) => w.id)).toEqual(['b']);
  });

  it('searchWords with an empty or whitespace term returns every word', () => {
    expect(searchWords(list, '')).toHaveLength(4);
    expect(searchWords(list, '   ')).toHaveLength(4);
    expect(searchWords(list, 'zzz')).toEqual([]);
  });

  it('wordsForSong filters by song and undefined selects global words', () => {
    expect(wordsForSong(list, 's1').map((w) => w.id)).toEqual(['c']);
    expect(wordsForSong(list, 'missing')).toEqual([]);
    expect(wordsForSong(list, undefined).map((w) => w.id)).toEqual(['a', 'b', 'd']);
  });
});

describe('computeProgress', () => {
  it('counts statuses and rounds the known percentage', () => {
    const list = [
      word({ id: 'a', status: 'known' }),
      word({ id: 'b', status: 'known' }),
      word({ id: 'c', status: 'learning' }),
      word({ id: 'd', status: 'new' }),
    ];
    expect(computeProgress(list)).toEqual({
      total: 4,
      known: 2,
      learning: 1,
      newCount: 1,
      knownPercent: 50,
    });
    // 1/3 known rounds to 33.
    const thirds = [
      word({ id: 'a', status: 'known' }),
      word({ id: 'b', status: 'learning' }),
      word({ id: 'c', status: 'new' }),
    ];
    expect(computeProgress(thirds).knownPercent).toBe(33);
  });

  it('returns zeroes for an empty list', () => {
    expect(computeProgress([])).toEqual({
      total: 0,
      known: 0,
      learning: 0,
      newCount: 0,
      knownPercent: 0,
    });
  });
});

describe('placeholderVocabCards', () => {
  it('derives the exact placeholder cards the vocab page renders', () => {
    const cards = placeholderVocabCards();
    expect(cards).toHaveLength(6);
    expect(cards[0]).toEqual({
      id: 'vocab-placeholder-1',
      title: 'Vocabulary Item 1',
      subtitle: 'Added 1d ago',
      gradient: 'linear-gradient(135deg, hsl(51, 40%, 85%) 0%, hsl(81, 45%, 80%) 100%)',
    });
    expect(cards[2].title).toBe('Vocabulary Item 3');
    expect(cards[2].subtitle).toBe('Added 3d ago');
    expect(cards[2].gradient).toBe(
      'linear-gradient(135deg, hsl(153, 40%, 85%) 0%, hsl(183, 45%, 80%) 100%)'
    );
  });

  it('is deterministic and honours an explicit count', () => {
    expect(placeholderVocabCards()).toEqual(placeholderVocabCards());
    expect(placeholderVocabCards(0)).toEqual([]);
    expect(placeholderVocabCards(2)).toHaveLength(2);
  });
});
