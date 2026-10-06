'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getSongById } from '@/lib/songs';
import {
  computeProgress,
  filterByStatus,
  toggleKnown,
  type VocabWord,
  type WordStatus,
} from '@/lib/vocabulary';
import { loadWords, saveWords } from '@/lib/vocabulary-storage';

/** Status groups in review order: words being learned first, known words last. */
const STATUS_GROUPS: Array<{ status: WordStatus; heading: string }> = [
  { status: 'learning', heading: 'Learning' },
  { status: 'new', heading: 'New' },
  { status: 'known', heading: 'Known' },
];

function WordRow({ word, onToggleKnown }: { word: VocabWord; onToggleKnown: (id: string) => void }) {
  const song = word.songId !== undefined ? getSongById(word.songId) : undefined;
  const known = word.status === 'known';
  return (
    <div style={{
      borderRadius: 16, background: 'var(--ios-bg2)', boxShadow: 'var(--ios-shadow)',
      padding: 14, marginBottom: 10,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
    }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ios-label)' }}>
          {word.term}
        </div>
        <div style={{ fontSize: 14, color: 'var(--ios-label2)', marginTop: 2 }}>
          {word.translation}
        </div>
        {song && (
          <Link href={`/songs/${song.id}`} style={{ fontSize: 12, color: 'var(--ios-blue)', marginTop: 6, display: 'inline-block' }}>
            from {song.title}
          </Link>
        )}
      </div>
      <button
        onClick={() => onToggleKnown(word.id)}
        aria-pressed={known}
        aria-label={`Toggle ${word.term} as known`}
        style={{
          flexShrink: 0,
          background: known ? 'var(--ios-green)' : 'transparent',
          color: known ? '#fff' : 'var(--ios-blue)',
          border: `1px solid ${known ? 'var(--ios-green)' : 'var(--ios-blue)'}`,
          borderRadius: 12, padding: '8px 16px', fontSize: 15, fontWeight: 600, cursor: 'pointer',
        }}
      >
        {known ? 'Known' : 'Mark Known'}
      </button>
    </div>
  );
}

export default function VocabularyPage() {
  const [words, setWords] = useState<VocabWord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setWords(loadWords());
    setLoaded(true);
  }, []);

  const progress = computeProgress(words);

  /** Flip a word's known status and persist the whole list (same read-modify-save as the learn page). */
  const handleToggleKnown = (id: string) => {
    const next = toggleKnown(words, id);
    setWords(next);
    saveWords(next);
  };

  return (
    <main style={{ background: 'var(--ios-bg)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '60px 16px 40px' }}>
        <Link href="/" aria-label="Back to home" style={{ fontSize: 14, color: 'var(--ios-blue)', marginBottom: 16, display: 'inline-block' }}>← Back</Link>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--ios-label)', marginBottom: 8 }}>Vocabulary</h1>
        <p style={{ fontSize: 15, color: 'var(--ios-label3)', marginBottom: 24 }}>
          Words you have saved from your songs — review them anytime.
        </p>

        {!loaded ? null : words.length === 0 ? (
          <div style={{
            borderRadius: 16, background: 'var(--ios-bg2)', boxShadow: 'var(--ios-shadow)',
            padding: 24, textAlign: 'center',
          }}>
            <div style={{ fontSize: 15, color: 'var(--ios-label)', marginBottom: 8 }}>
              No saved words yet.
            </div>
            <div style={{ fontSize: 13, color: 'var(--ios-label3)', marginBottom: 16 }}>
              Words you look up while practicing a song will appear here — pick a song to get started.
            </div>
            <Link href="/songs" style={{
              display: 'inline-block', background: 'var(--ios-blue)', color: '#fff',
              borderRadius: 12, padding: '10px 20px', fontSize: 15, fontWeight: 600,
            }}>
              Browse Songs
            </Link>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 13, color: 'var(--ios-label2)', marginBottom: 20 }}>
              {progress.known} of {progress.total} words known ({progress.knownPercent}%)
            </p>

            {STATUS_GROUPS.map(({ status, heading }) => {
              const group = filterByStatus(words, status);
              if (group.length === 0) return null;
              return (
                <section key={status} style={{ marginBottom: 24 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px', color: 'var(--ios-label)', marginBottom: 12 }}>
                    {heading} <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--ios-label3)' }}>({group.length})</span>
                  </h2>
                  {group.map((word) => (
                    <WordRow key={word.id} word={word} onToggleKnown={handleToggleKnown} />
                  ))}
                </section>
              );
            })}
          </>
        )}
      </div>
    </main>
  );
}
