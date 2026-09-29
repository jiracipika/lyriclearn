/**
 * Pure song catalog domain module.
 *
 * No React, no DOM, no `window` access here — persistence lives behind the
 * boundary in `./songs-storage`. All list operations are immutable: they
 * return new arrays and never mutate their inputs.
 *
 * The songs pages are placeholder stubs: they ship no song data of their own,
 * only generated placeholder cards (see `placeholderSongCards` at the bottom,
 * extracted verbatim from the pages). The seed catalog below is the starting
 * data for the real data layer — the learn flow and progress slices consume
 * it from here instead of page-local constants.
 */

export type SongDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Song {
  id: string;
  title: string;
  artist: string;
  /** Language of the lyrics (ISO 639-1 tag, e.g. 'en', 'fr', 'es'). */
  language: string;
  /** Lyrics split into lines, in performance order. */
  lyrics: string[];
  difficulty?: SongDifficulty;
  genre?: string;
}

// ---------------------------------------------------------------------------
// Seed catalog
// ---------------------------------------------------------------------------

/**
 * Starting catalog of public-domain songs, fixed in display order. The app
 * has no song ingestion yet, so this is the single source of song/lyric data.
 */
export const SONG_CATALOG: Song[] = [
  {
    id: 'frere-jacques',
    title: 'Frère Jacques',
    artist: 'Traditional',
    language: 'fr',
    difficulty: 'beginner',
    genre: 'nursery',
    lyrics: [
      'Frère Jacques, Frère Jacques,',
      'Dormez-vous ? Dormez-vous ?',
      'Sonnez les matines ! Sonnez les matines !',
      'Ding, dang, dong. Ding, dang, dong.',
    ],
  },
  {
    id: 'alouette',
    title: 'Alouette',
    artist: 'Traditional',
    language: 'fr',
    difficulty: 'beginner',
    genre: 'folk',
    lyrics: [
      'Alouette, gentille alouette,',
      'Alouette, je te plumerai.',
      'Je te plumerai la tête.',
      'Et la tête ! Et la tête !',
      'Alouette, gentille alouette,',
      'Alouette, je te plumerai.',
    ],
  },
  {
    id: 'la-cucaracha',
    title: 'La Cucaracha',
    artist: 'Traditional',
    language: 'es',
    difficulty: 'beginner',
    genre: 'folk',
    lyrics: [
      'La cucaracha, la cucaracha,',
      'ya no puede caminar,',
      'porque no tiene, porque le falta',
      'una pata de atrás.',
    ],
  },
  {
    id: 'amazing-grace',
    title: 'Amazing Grace',
    artist: 'John Newton',
    language: 'en',
    difficulty: 'intermediate',
    genre: 'hymn',
    lyrics: [
      'Amazing grace, how sweet the sound,',
      'that saved a wretch like me.',
      'I once was lost, but now am found,',
      'was blind, but now I see.',
    ],
  },
];

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** All songs in display order, as a fresh array the caller may freely mutate. */
export function listSongs(catalog: Song[] = SONG_CATALOG): Song[] {
  return [...catalog];
}

/** The song with the given id, or `undefined` when the id is unknown. */
export function getSongById(id: string, catalog: Song[] = SONG_CATALOG): Song | undefined {
  return catalog.find((s) => s.id === id);
}

/**
 * Case-insensitive substring match over title, artist and lyric lines.
 * An empty/whitespace-only query matches every song.
 */
export function searchSongs(query: string, catalog: Song[] = SONG_CATALOG): Song[] {
  const needle = query.trim().toLowerCase();
  if (needle === '') return [...catalog];
  return catalog.filter(
    (s) =>
      s.title.toLowerCase().includes(needle) ||
      s.artist.toLowerCase().includes(needle) ||
      s.lyrics.some((line) => line.toLowerCase().includes(needle))
  );
}

/** Songs in the given language (case-insensitive tag comparison). */
export function filterByLanguage(language: string, catalog: Song[] = SONG_CATALOG): Song[] {
  const tag = language.trim().toLowerCase();
  return catalog.filter((s) => s.language.toLowerCase() === tag);
}

// ---------------------------------------------------------------------------
// Per-song learner state
// ---------------------------------------------------------------------------

/** Learner state kept for one song (completed and bookmarked lyric lines). */
export interface SongState {
  /** Indices into `Song.lyrics` of completed lines, ascending and unique. */
  completedLines: number[];
  /** Indices into `Song.lyrics` of bookmarked lines, ascending and unique. */
  bookmarkedLines: number[];
  /** Epoch milliseconds at which this state was last changed. */
  updatedAt: number;
}

export function emptySongState(now: number = 0): SongState {
  return { completedLines: [], bookmarkedLines: [], updatedAt: now };
}

/**
 * Toggle a line index in a sorted, unique index list. Non-integer or negative
 * indices are ignored; the input list is never mutated.
 */
export function toggleLineIndex(indices: number[], index: number): number[] {
  if (!Number.isInteger(index) || index < 0) return [...indices];
  if (indices.includes(index)) return indices.filter((i) => i !== index);
  return [...indices, index].sort((a, b) => a - b);
}

// ---------------------------------------------------------------------------
// Placeholder card data
// ---------------------------------------------------------------------------

/**
 * Card data shape currently rendered by the songs pages. The pages are
 * placeholder stubs; later slices replace this derivation with the real
 * catalog (list/detail) and persisted song state (learn), at which point
 * this function is retired.
 */
export interface SongCardData {
  id: string;
  title: string;
  subtitle: string;
  gradient: string;
}

export const SONG_PLACEHOLDER_COUNT = 6;

/**
 * Deterministically derives the placeholder cards a songs page renders for
 * its feature label ('Song Library', 'Song Detail' or 'Learn Mode'). Pure:
 * same label and count in, same cards out.
 */
export function placeholderSongCards(
  label: string,
  count: number = SONG_PLACEHOLDER_COUNT
): SongCardData[] {
  const cards: SongCardData[] = [];
  for (let i = 1; i <= count; i++) {
    const hue = i * 51;
    cards.push({
      id: `song-placeholder-${i}`,
      title: `${label} Item ${i}`,
      subtitle: `Added ${i}d ago`,
      gradient: `linear-gradient(135deg, hsl(${hue}, 40%, 85%) 0%, hsl(${hue + 30}, 45%, 80%) 100%)`,
    });
  }
  return cards;
}
