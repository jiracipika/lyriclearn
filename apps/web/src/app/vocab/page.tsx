'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getSongById } from '@/lib/songs';
import {
  computeProgress,
  filterByStatus,
  type VocabWord,
  type WordStatus,
} from '@/lib/vocabulary';
import { loadWords } from '@/lib/vocabulary-storage';

/** Status groups in review order: words being learned first, known words last. */
const STATUS_GROUPS: Array<{ status: WordStatus; heading: string }> = [
  { status: 'learning', heading: 'Learning' },
  { status: 'new', heading: 'New' },
  { status: 'known', heading: 'Known' },
];

function WordRow({ word }: { word: VocabWord }) {
  const song = word.songId !== undefined ? getSongById(word.songId) : undefined;
  return (
    <div style={{
      borderRadius: 16, background: 'var(--ios-bg2)', boxShadow: 'var(--ios-shadow)',
      padding: 14, marginBottom: 10,
    }}>
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
                    <WordRow key={word.id} word={word} />
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
