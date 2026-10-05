'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSongById, type SongDifficulty, type SongState } from '@/lib/songs';
import { loadSongStates } from '@/lib/songs-storage';
import { songProgress, type MasteryTier } from '@/lib/progress';

/** Display label + color for each mastery tier (mirrors the progress page). */
const TIER_STYLE: Record<MasteryTier, { label: string; color: string }> = {
  new: { label: 'Not started', color: 'var(--ios-label3)' },
  started: { label: 'Started', color: 'var(--ios-blue)' },
  partial: { label: 'Partial', color: 'var(--ios-orange)' },
  mastered: { label: 'Mastered', color: 'var(--ios-green)' },
};

const DIFFICULTY_LABEL: Record<SongDifficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export default function SongDetailPage() {
  const params = useParams<{ id: string }>();
  const song = getSongById(params?.id ?? '');

  const [states, setStates] = useState<Record<string, SongState>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setStates(loadSongStates());
    setLoaded(true);
  }, []);

  if (!song) {
    return (
      <main style={{ background: 'var(--ios-bg)', minHeight: '100vh' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '60px 16px 40px' }}>
          <Link href="/songs" aria-label="Back to all songs" style={{ fontSize: 14, color: 'var(--ios-blue)', marginBottom: 16, display: 'inline-block' }}>← All Songs</Link>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--ios-label)', marginBottom: 8 }}>Song Not Found</h1>
          <p style={{ fontSize: 15, color: 'var(--ios-label3)' }}>
            No song matches this link. Pick one from the library to start learning.
          </p>
        </div>
      </main>
    );
  }

  // Same mastery path as the progress page: persisted learner state through
  // loadSongStates, tier/counts through the shared songProgress engine.
  const progress = songProgress(song, states[song.id]);
  const tier = TIER_STYLE[progress.tier];

  return (
    <main style={{ background: 'var(--ios-bg)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '60px 16px 40px' }}>
        <Link href="/songs" aria-label="Back to all songs" style={{ fontSize: 14, color: 'var(--ios-blue)', marginBottom: 16, display: 'inline-block' }}>← All Songs</Link>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--ios-label)', marginBottom: 4 }}>{song.title}</h1>
        <p style={{ fontSize: 15, color: 'var(--ios-label3)', marginBottom: 20 }}>
          {song.artist} · {song.language.toUpperCase()}
          {song.difficulty !== undefined ? ` · ${DIFFICULTY_LABEL[song.difficulty]}` : ''}
        </p>

        {loaded && (
          <div style={{
            borderRadius: 16, background: 'var(--ios-bg2)', boxShadow: 'var(--ios-shadow)',
            padding: 16, marginBottom: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: tier.color }}>{tier.label}</span>
              <span style={{ fontSize: 12, color: 'var(--ios-label3)' }}>
                {progress.learnedLines} of {progress.totalLines} lines mastered
              </span>
            </div>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress.pct}
              aria-valuetext={`${progress.pct}% — ${tier.label}`}
              aria-label={`${song.title} progress`}
              style={{ height: 6, borderRadius: 3, background: 'var(--ios-fill)', overflow: 'hidden' }}
            >
              <div style={{ width: `${progress.pct}%`, height: '100%', borderRadius: 3, background: tier.color }} />
            </div>
          </div>
        )}

        <Link href={`/songs/${song.id}/learn`} aria-label={`Practice ${song.title} in Learn Mode`} style={{
          display: 'inline-block', background: 'var(--ios-blue)', color: '#fff',
          borderRadius: 12, padding: '10px 20px', fontSize: 15, fontWeight: 600,
          marginBottom: 28,
        }}>
          Practice This Song
        </Link>

        <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px', color: 'var(--ios-label)', marginBottom: 12 }}>Lyrics</h2>
        <ol aria-label={`Lyrics for ${song.title}`} style={{
          borderRadius: 16, background: 'var(--ios-bg2)', boxShadow: 'var(--ios-shadow)',
          padding: '20px 20px 20px 40px', margin: 0,
        }}>
          {song.lyrics.map((line, index) => (
            <li key={index} style={{ fontSize: 15, color: 'var(--ios-label)', lineHeight: 1.6, marginBottom: 6 }}>
              {line}
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
