/**
 * Persistence boundary for per-song learner state (completed/bookmarked
 * lyric lines).
 *
 * Mirrors the vocabulary-storage pattern: every entry point guards
 * `typeof window` before touching browser storage, and accepts an injected
 * `StorageLike` so tests (and SSR) never need a real `localStorage`.
 */
import type { SongState } from './songs';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const SONG_STATE_STORAGE_KEY = 'lyriclearn.songs.v1';

/** Stored shape: a record of song id -> learner state for that song. */
export type StoredSongStates = Record<string, SongState>;

/** Serialize a song-state record for storage. */
export function serializeSongStates(states: StoredSongStates): string {
  return JSON.stringify(states);
}

/** Keep only non-negative integer indices, deduped and ascending. */
function sanitizeLineIndices(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  const out: number[] = [];
  for (const n of value) {
    if (typeof n === 'number' && Number.isInteger(n) && n >= 0 && !out.includes(n)) {
      out.push(n);
    }
  }
  return out.sort((a, b) => a - b);
}

/**
 * Parse stored song states. Returns an empty record for null/undefined input,
 * malformed JSON, or a non-object payload — never throws. Entries are
 * sanitized: invalid line indices are dropped and surviving indices are
 * deduped and sorted; malformed entries fall back to an empty state.
 */
export function deserializeSongStates(raw: string | null | undefined): StoredSongStates {
  if (raw === null || raw === undefined) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    const states: StoredSongStates = {};
    for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value !== 'object' || value === null) continue;
      const entry = value as Record<string, unknown>;
      const updatedAt = entry.updatedAt;
      states[id] = {
        completedLines: sanitizeLineIndices(entry.completedLines),
        bookmarkedLines: sanitizeLineIndices(entry.bookmarkedLines),
        updatedAt:
          typeof updatedAt === 'number' && Number.isFinite(updatedAt) ? updatedAt : 0,
      };
    }
    return states;
  } catch {
    return {};
  }
}

/**
 * Load the song-state record. Prefers an explicitly injected storage;
 * otherwise uses `window.localStorage` when available; otherwise (Node, SSR,
 * tests) returns an empty record.
 */
export function loadSongStates(storage?: StorageLike | null): StoredSongStates {
  const target =
    storage !== undefined && storage !== null
      ? storage
      : typeof window !== 'undefined' && window.localStorage
        ? window.localStorage
        : null;
  if (!target) return {};
  return deserializeSongStates(target.getItem(SONG_STATE_STORAGE_KEY));
}

/**
 * Save the song-state record. No-op when no storage is available (Node, SSR,
 * tests) and none was injected.
 */
export function saveSongStates(states: StoredSongStates, storage?: StorageLike | null): void {
  const target =
    storage !== undefined && storage !== null
      ? storage
      : typeof window !== 'undefined' && window.localStorage
        ? window.localStorage
        : null;
  if (!target) return;
  target.setItem(SONG_STATE_STORAGE_KEY, serializeSongStates(states));
}
