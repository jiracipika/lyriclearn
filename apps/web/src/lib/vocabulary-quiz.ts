/**
 * Pure quiz-generation domain over the vocabulary list.
 *
 * No React, no DOM, no `window` access. Deterministic: the same word list
 * and seed always produce the same questions (small LCG PRNG), so tests
 * can pin exact outputs and re-renders never reshuffle mid-quiz.
 */

import type { VocabWord, WordStatus } from './vocabulary';

export interface QuizQuestion {
  wordId: string;
  /** The term shown to the learner. */
  prompt: string;
  correct: string;
  /** Answer options including the correct one exactly once. */
  options: string[];
}

export interface QuizOptions {
  /** How many questions to build. Default 10, clamped to the pool size. */
  length?: number;
  /** Answer options per question (correct + distractors). Default 4. */
  choices?: number;
  /** Only quiz words with these statuses. Default: everything except 'known'. */
  statuses?: WordStatus[];
  /** Seed for reproducible ordering. Default 1. */
  seed?: number;
}

const DEFAULT_LENGTH = 10;
const DEFAULT_CHOICES = 4;

function makeRand(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function seededShuffle<T>(items: T[], rand: () => number): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

/**
 * Build a multiple-choice quiz from the vocabulary. Words without both a
 * term and a translation are never quizzed; fewer than two quizable words
 * produce no quiz at all (one option is not a question). Distractors come
 * from other words' translations and are unique strings — the options list
 * is therefore at most `choices` long and always contains the correct
 * answer exactly once.
 */
export function buildQuiz(words: VocabWord[], options: QuizOptions = {}): QuizQuestion[] {
  const statuses = options.statuses ?? (['new', 'learning'] as WordStatus[]);
  const allowed = new Set(statuses);
  const pool = words.filter(
    (w) =>
      allowed.has(w.status) &&
      w.term.trim() !== '' &&
      w.translation.trim() !== ''
  );
  if (pool.length < 2) return [];

  const length = Math.max(1, Math.min(options.length ?? DEFAULT_LENGTH, pool.length));
  const choices = Math.max(2, options.choices ?? DEFAULT_CHOICES);
  const rand = makeRand(options.seed ?? 1);
  const order = seededShuffle(pool, rand);

  return order.slice(0, length).map((target) => {
    const distractors: string[] = [];
    const seen = new Set<string>([target.translation]);
    for (const candidate of order) {
      if (distractors.length >= choices - 1) break;
      if (candidate.id === target.id) continue;
      const translation = candidate.translation;
      if (seen.has(translation)) continue;
      seen.add(translation);
      distractors.push(translation);
    }
    const optionsShuffled = seededShuffle([...distractors, target.translation], rand);
    return {
      wordId: target.id,
      prompt: target.term,
      correct: target.translation,
      options: optionsShuffled,
    };
  });
}

/** Whether the learner picked the right translation (whitespace-tolerant). */
export function gradeQuizAnswer(question: QuizQuestion, selected: string): boolean {
  return selected.trim() === question.correct.trim();
}
