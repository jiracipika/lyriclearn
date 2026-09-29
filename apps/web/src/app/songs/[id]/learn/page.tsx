'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  applyMastery,
  gradeAttempt,
  isSessionComplete,
  maskLine,
  passCurrentLine,
  recordFailedAttempt,
  revealNext,
  sessionScore,
  startLearnSession,
  type LearnSession,
  type MaskMode,
} from '@/lib/learn';
import { getSongById, emptySongState } from '@/lib/songs';
import {
  loadSongStates,
  saveSongStates,
  type StoredSongStates,
} from '@/lib/songs-storage';

/** Failed attempts after which the full line shows as a hint. */
const HINT_AFTER_FAILED_ATTEMPTS = 2;

export default function LearnModePage() {
  const params = useParams<{ id: string }>();
  const song = getSongById(params?.id ?? '');

  const [session, setSession] = useState<LearnSession>(() =>
    startLearnSession(song?.lyrics.length ?? 0)
  );
  const [mode, setMode] = useState<MaskMode>('first-letters');
  const [typed, setTyped] = useState('');
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [hintVisible, setHintVisible] = useState(false);
  const [masteredCount, setMasteredCount] = useState(0);

  useEffect(() => {
    setMasteredCount(loadSongStates()[song?.id ?? '']?.completedLines.length ?? 0);
  }, [song?.id]);

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

  const done = isSessionComplete(session);
  const currentLine = done ? undefined : song.lyrics[session.currentLine];
  const cue = currentLine === undefined ? '' : maskLine(currentLine, mode);
  const score = sessionScore(session);

  const resetSession = () => {
    setSession(startLearnSession(song.lyrics.length));
    setTyped('');
    setFeedback('none');
    setHintVisible(false);
  };

  /** Merge this line into the song's persisted mastered-lines set. */
  const recordMastery = (lineIndex: number) => {
    const states: StoredSongStates = loadSongStates();
    const updated = applyMastery(
      states[song.id] ?? emptySongState(),
      [lineIndex],
      Date.now()
    );
    saveSongStates({ ...states, [song.id]: updated });
    setMasteredCount(updated.completedLines.length);
  };

  const checkGuess = () => {
    if (done || currentLine === undefined || feedback === 'correct') return;
    if (gradeAttempt(currentLine, typed)) {
      recordMastery(session.currentLine);
      setSession(passCurrentLine(session));
      setFeedback('correct');
      setTyped('');
      setHintVisible(false);
    } else {
      const failed = recordFailedAttempt(session);
      setSession(failed);
      setFeedback('wrong');
      setHintVisible(failed.attempts >= HINT_AFTER_FAILED_ATTEMPTS);
    }
  };

  const revealAnswer = () => {
    if (done) return;
    setSession(revealNext(session));
    setFeedback('none');
    setTyped('');
    setHintVisible(false);
  };

  const toggleMode = () => {
    setMode(mode === 'first-letters' ? 'hidden' : 'first-letters');
  };

  return (
    <main style={{ background: 'var(--ios-bg)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '60px 16px 40px' }}>
        <Link href={`/songs/${song.id}`} aria-label={`Back to ${song.title}`} style={{ fontSize: 14, color: 'var(--ios-blue)', marginBottom: 16, display: 'inline-block' }}>← {song.title}</Link>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--ios-label)', marginBottom: 4 }}>Learn Mode</h1>
        <p style={{ fontSize: 15, color: 'var(--ios-label3)', marginBottom: 24 }}>
          {song.title} — {song.artist} · {song.language.toUpperCase()}
          {masteredCount > 0 ? ` · ${masteredCount} of ${song.lyrics.length} lines mastered` : ''}
        </p>

        {done ? (
          <div aria-live="polite" style={{
            borderRadius: 16, background: 'var(--ios-bg2)', boxShadow: 'var(--ios-shadow)',
            padding: 24, textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, fontWeight: 700, color: 'var(--ios-label)', marginBottom: 4 }}>
              {score}%
            </div>
            <div style={{ fontSize: 14, color: 'var(--ios-label3)', marginBottom: 20 }}>
              {session.correctFirstTries} of {session.totalLines} lines on the first try
            </div>
            <button onClick={resetSession} style={{
              background: 'var(--ios-blue)', color: '#fff', border: 'none',
              borderRadius: 12, padding: '10px 20px', fontSize: 15, fontWeight: 600, cursor: 'pointer',
            }}>
              Practice Again
            </button>
          </div>
        ) : (
          <div style={{
            borderRadius: 16, background: 'var(--ios-bg2)', boxShadow: 'var(--ios-shadow)',
            padding: 20,
          }}>
            <div aria-live="polite" style={{ fontSize: 12, color: 'var(--ios-label3)', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
              <span>Line {session.currentLine + 1} of {session.totalLines}</span>
              <span>Score {score}%</span>
            </div>
            <div aria-label="Practice cue" style={{
              fontSize: 24, fontWeight: 600, letterSpacing: '0.5px', color: 'var(--ios-label)',
              background: 'var(--ios-bg)', borderRadius: 12, padding: 16, marginBottom: 12,
            }}>
              {cue || '\u00A0'}
            </div>
            {hintVisible && currentLine !== undefined && (
              <div style={{ fontSize: 15, color: 'var(--ios-label3)', marginBottom: 12 }}>
                Hint: {currentLine}
              </div>
            )}
            <input
              value={typed}
              onChange={(e) => { setTyped(e.target.value); setFeedback('none'); }}
              onKeyDown={(e) => { if (e.key === 'Enter') checkGuess(); }}
              placeholder="Type the line from memory…"
              aria-label="Type the current lyric line"
              style={{
                width: '100%', boxSizing: 'border-box', fontSize: 16, color: 'var(--ios-label)',
                background: 'var(--ios-bg)', border: '1px solid var(--ios-label3)', borderRadius: 12,
                padding: '10px 14px', marginBottom: 12, outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={checkGuess} style={{
                background: 'var(--ios-blue)', color: '#fff', border: 'none',
                borderRadius: 12, padding: '8px 16px', fontSize: 15, fontWeight: 600, cursor: 'pointer',
              }}>
                Check
              </button>
              <button onClick={revealAnswer} style={{
                background: 'transparent', color: 'var(--ios-blue)', border: '1px solid var(--ios-blue)',
                borderRadius: 12, padding: '8px 16px', fontSize: 15, fontWeight: 600, cursor: 'pointer',
              }}>
                Reveal &amp; Skip
              </button>
              <button onClick={toggleMode} aria-pressed={mode === 'first-letters'} style={{
                background: 'transparent', color: 'var(--ios-label3)', border: '1px solid var(--ios-label3)',
                borderRadius: 12, padding: '8px 16px', fontSize: 15, cursor: 'pointer',
              }}>
                Cue: {mode === 'first-letters' ? 'first letters' : 'all hidden'}
              </button>
            </div>
            {feedback === 'correct' && (
              <div aria-live="polite" style={{ fontSize: 14, color: 'var(--ios-blue)', marginTop: 12 }}>Correct — next line!</div>
            )}
            {feedback === 'wrong' && (
              <div aria-live="polite" style={{ fontSize: 14, color: 'var(--ios-red)', marginTop: 12 }}>
                Not quite — try again{hintVisible ? '' : ` (hint after ${HINT_AFTER_FAILED_ATTEMPTS - session.attempts} more miss${HINT_AFTER_FAILED_ATTEMPTS - session.attempts === 1 ? '' : 'es'})`}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
