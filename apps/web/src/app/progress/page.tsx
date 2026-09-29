'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  SONG_CATALOG,
  type SongState,
} from '@/lib/songs';
import { loadSongStates } from '@/lib/songs-storage';
import { loadWords } from '@/lib/vocabulary-storage';
import type { VocabWord } from '@/lib/vocabulary';
import { aggregateProgress, songProgress, type MasteryTier, type SongProgress } from '@/lib/progress';

/** Display label + color for each mastery tier. */
const TIER_STYLE: Record<MasteryTier, { label: string; color: string }> = {
  new: { label: 'Not started', color: 'var(--ios-label3)' },
  started: { label: 'Started', color: 'var(--ios-blue)' },
  partial: { label: 'Partial', color: 'var(--ios-orange)' },
  mastered: { label: 'Mastered', color: 'var(--ios-green)' },
};

function formatLastPracticed(timestamp: number): string {
  const date = new Date(timestamp);
  return `Last practiced ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

function SongRow({ progress, title, artist }: { progress: SongProgress; title: string; artist: string }) {
  const tier = TIER_STYLE[progress.tier];
  return (
    <Link href={`/songs/${progress.songId}/learn`} style={{ textDecoration: 'none' }}>
      <div style={{
        borderRadius: 16, background: 'var(--ios-bg2)', boxShadow: 'var(--ios-shadow)',
        padding: 16, marginBottom: 12,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ios-label)' }}>
              {title}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ios-label3)', marginTop: 2 }}>
              {artist} · {progress.learnedLines} of {progress.totalLines} lines
              {progress.lastPracticed !== null ? ` · ${formatLastPracticed(progress.lastPracticed)}` : ''}
            </div>
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: tier.color, whiteSpace: 'nowrap' }}>
            {tier.label}
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress.pct}
          aria-label={`${title} progress`}
          style={{ height: 6, borderRadius: 3, background: 'var(--ios-fill)', overflow: 'hidden' }}
        >
          <div style={{ width: `${progress.pct}%`, height: '100%', borderRadius: 3, background: tier.color }} />
        </div>
      </div>
    </Link>
  );
}

export default function MyProgressPage() {
  const [states, setStates] = useState<Record<string, SongState>>({});
  const [words, setWords] = useState<VocabWord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setStates(loadSongStates());
    setWords(loadWords());
    setLoaded(true);
  }, []);

  const aggregate = aggregateProgress(SONG_CATALOG, states, words);
  const hasActivity = aggregate.songsStarted > 0 || aggregate.vocabulary.total > 0;

  return (
    <div style={{ background: 'var(--ios-bg)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '60px 16px 40px' }}>
        <Link href="/" style={{ fontSize: 14, color: 'var(--ios-blue)', marginBottom: 16, display: 'inline-block' }}>← Back</Link>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--ios-label)', marginBottom: 8 }}>My Progress</h1>
        <p style={{ fontSize: 15, color: 'var(--ios-label3)', marginBottom: 24 }}>
          Your lyrics and vocabulary at a glance.
        </p>

        {!loaded ? null : !hasActivity ? (
          <div style={{
            borderRadius: 16, background: 'var(--ios-bg2)', boxShadow: 'var(--ios-shadow)',
            padding: 24, textAlign: 'center',
          }}>
            <div style={{ fontSize: 15, color: 'var(--ios-label)', marginBottom: 16 }}>
              Practice a song to see progress here.
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
            <div style={{
              borderRadius: 16, background: 'var(--ios-bg2)', boxShadow: 'var(--ios-shadow)',
              padding: 20, marginBottom: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 40, fontWeight: 700, color: 'var(--ios-label)' }}>
                  {aggregate.overallPct}%
                </span>
                <span style={{ fontSize: 14, color: 'var(--ios-label3)' }}>
                  of all lyric lines learned
                </span>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--ios-label2)' }}>
                <span>{aggregate.songsStarted} song{aggregate.songsStarted === 1 ? '' : 's'} started</span>
                <span style={{ color: 'var(--ios-green)' }}>{aggregate.songsMastered} mastered</span>
                <span>{aggregate.totalLinesLearned} of {aggregate.totalLines} lines</span>
              </div>
              {aggregate.vocabulary.total > 0 && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--ios-sep)', fontSize: 13, color: 'var(--ios-label2)' }}>
                  Vocabulary: {aggregate.vocabulary.known} of {aggregate.vocabulary.total} words known ({aggregate.vocabulary.knownPercent}%)
                  {' · '}
                  <Link href="/vocab" style={{ color: 'var(--ios-blue)' }}>Review</Link>
                </div>
              )}
            </div>

            {SONG_CATALOG.map((song) => (
              <SongRow
                key={song.id}
                progress={songProgress(song, states[song.id])}
                title={song.title}
                artist={song.artist}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
