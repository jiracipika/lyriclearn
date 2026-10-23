'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, MotionConfig } from 'motion/react';
import { getSongById } from '@/lib/songs';
import {
  computeProgress,
  filterByStatus,
  setWordStatus,
  toggleKnown,
  type VocabWord,
  type WordStatus,
} from '@/lib/vocabulary';
import { buildQuiz, gradeQuizAnswer, type QuizQuestion } from '@/lib/vocabulary-quiz';
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
      <motion.button
        onClick={() => onToggleKnown(word.id)}
        aria-pressed={known}
        aria-label={`Toggle ${word.term} as known`}
        whileTap={{ scale: 0.92 }}
        transition={{ type: 'spring', bounce: 0.4, duration: 0.3 }}
        style={{
          flexShrink: 0,
          background: known ? 'var(--ios-green)' : 'transparent',
          color: known ? '#fff' : 'var(--ios-blue)',
          border: `1px solid ${known ? 'var(--ios-green)' : 'var(--ios-blue)'}`,
          borderRadius: 12, padding: '8px 16px', fontSize: 15, fontWeight: 600, cursor: 'pointer',
        }}
      >
        {known ? 'Known' : 'Mark Known'}
      </motion.button>
    </div>
  );
}

export default function VocabularyPage() {
  const [words, setWords] = useState<VocabWord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizPicks, setQuizPicks] = useState<Record<number, string>>({});

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

  const quizQuestion = quiz ? quiz[quizIndex] : null;
  const quizPick = quizQuestion ? quizPicks[quizIndex] : undefined;
  const quizScore = quiz
    ? quiz.filter((q, i) => quizPicks[i] !== undefined && gradeQuizAnswer(q, quizPicks[i])).length
    : 0;

  const startQuiz = () => {
    const questions = buildQuiz(words);
    if (questions.length === 0) return;
    setQuiz(questions);
    setQuizIndex(0);
    setQuizPicks({});
  };

  const answerQuiz = (option: string) => {
    if (!quizQuestion || quizPicks[quizIndex] !== undefined) return;
    setQuizPicks((cur) => ({ ...cur, [quizIndex]: option }));
    // Quiz answers feed the mastery flow: correct promotes toward known,
    // a miss marks the word as actively being learned.
    const status: WordStatus = gradeQuizAnswer(quizQuestion, option) ? 'known' : 'learning';
    const next = setWordStatus(words, quizQuestion.wordId, status);
    setWords(next);
    saveWords(next);
  };

  const quizFinished = quiz !== null && quizIndex >= quiz.length;

  return (
    <MotionConfig reducedMotion="user">
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

              {quiz === null ? (
                <motion.button
                  onClick={startQuiz}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', bounce: 0.4, duration: 0.3 }}
                  style={{
                    width: '100%', border: 'none', cursor: 'pointer', marginBottom: 24,
                    background: 'var(--ios-blue)', color: '#fff', borderRadius: 14,
                    padding: 14, fontSize: 16, fontWeight: 600,
                  }}
                >
                  Quiz me ({filterByStatus(words, 'learning').length + filterByStatus(words, 'new').length} words)
                </motion.button>
              ) : (
                <section aria-label="Vocabulary quiz" style={{
                  borderRadius: 16, background: 'var(--ios-bg2)', boxShadow: 'var(--ios-shadow)',
                  padding: 20, marginBottom: 24,
                }}>
                  {quizFinished ? (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ios-label)', marginBottom: 6 }}>
                        {quizScore} / {quiz.length} correct
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--ios-label3)', marginBottom: 16 }}>
                        Correct answers were marked known; misses moved to Learning.
                      </div>
                      <button
                        onClick={() => { setQuiz(null); setQuizIndex(0); setQuizPicks({}); }}
                        style={{
                          background: 'var(--ios-blue)', color: '#fff', border: 'none', cursor: 'pointer',
                          borderRadius: 12, padding: '10px 24px', fontSize: 15, fontWeight: 600,
                        }}
                      >
                        Done
                      </button>
                    </div>
                  ) : quizQuestion && (
                    <>
                      <div style={{ fontSize: 12, color: 'var(--ios-label3)', marginBottom: 8 }}>
                        Question {quizIndex + 1} of {quiz.length} · score {quizScore}
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ios-label)', marginBottom: 16 }}>
                        {quizQuestion.prompt}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {quizQuestion.options.map((option) => {
                          const picked = quizPick !== undefined;
                          const isCorrect = option === quizQuestion.correct;
                          const isPicked = quizPick === option;
                          const bg = picked && isCorrect
                            ? 'var(--ios-green)'
                            : picked && isPicked
                              ? 'var(--ios-red)'
                              : 'var(--ios-bg)';
                          const fg = picked && (isCorrect || isPicked) ? '#fff' : 'var(--ios-label)';
                          return (
                            <button
                              key={option}
                              onClick={() => answerQuiz(option)}
                              disabled={picked}
                              aria-pressed={isPicked}
                              style={{
                                textAlign: 'left', background: bg, color: fg, cursor: picked ? 'default' : 'pointer',
                                border: '1px solid var(--ios-separator)', borderRadius: 12,
                                padding: '12px 16px', fontSize: 15, fontWeight: 500,
                              }}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                      {quizPick !== undefined && (
                        <button
                          onClick={() => setQuizIndex((i) => i + 1)}
                          style={{
                            marginTop: 14, width: '100%', background: 'var(--ios-label)', color: 'var(--ios-bg)',
                            border: 'none', cursor: 'pointer', borderRadius: 12, padding: 12,
                            fontSize: 15, fontWeight: 600,
                          }}
                        >
                          {quizIndex + 1 >= quiz.length ? 'See results' : 'Next'}
                        </button>
                      )}
                    </>
                  )}
                </section>
              )}

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
    </MotionConfig>
  );
}
