import { describe, expect, it } from 'vitest';
import { buildQuiz, gradeQuizAnswer, type QuizQuestion } from './vocabulary-quiz';
import { createWord, type VocabWord } from './vocabulary';

const word = (id: string, term: string, translation: string, status: VocabWord['status'] = 'new'): VocabWord =>
  createWord({ id, term, translation, status, addedAt: 0 });

const five = (): VocabWord[] => [
  word('w1', 'hola', 'hello'),
  word('w2', 'gracias', 'thank you'),
  word('w3', 'adiós', 'goodbye', 'learning'),
  word('w4', 'por favor', 'please', 'learning'),
  word('w5', 'ayer', 'yesterday', 'known'),
];

describe('buildQuiz', () => {
  it('quizzes only non-known words by default', () => {
    const quiz = buildQuiz(five());
    expect(quiz).toHaveLength(4); // w5 is known and excluded
    expect(quiz.map((q) => q.wordId)).not.toContain('w5');
  });

  it('is deterministic for the same words and seed', () => {
    expect(buildQuiz(five(), { seed: 7 })).toEqual(buildQuiz(five(), { seed: 7 }));
    expect(buildQuiz(five(), { seed: 7 })).not.toEqual(buildQuiz(five(), { seed: 8 }));
  });

  it('clamps length to the pool and never asks about a word twice', () => {
    const quiz = buildQuiz(five(), { length: 99 });
    expect(quiz).toHaveLength(4);
    expect(new Set(quiz.map((q) => q.wordId)).size).toBe(4);
    expect(buildQuiz(five(), { length: 2 })).toHaveLength(2);
  });

  it('every question contains the correct answer exactly once among unique options', () => {
    const words = [
      word('a', 'uno', 'one'),
      word('b', 'dos', 'two'),
      word('c', 'dos alt', 'two'), // duplicate translation must not double as a distractor
      word('d', 'tres', 'three'),
      word('e', 'cuatro', 'four'),
    ];
    for (const seed of [1, 2, 3, 42]) {
      for (const q of buildQuiz(words, { seed })) {
        expect(new Set(q.options).size).toBe(q.options.length);
        expect(q.options.filter((o) => o === q.correct)).toHaveLength(1);
        expect(q.options.length).toBeLessThanOrEqual(4);
        expect(q.options.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('drops duplicates from distractors rather than the correct answer', () => {
    const words = [
      word('a', 'uno', 'one'),
      word('b', 'dos', 'two'),
      word('c', 'dos alt', 'two'),
    ];
    const [q] = buildQuiz(words, { choices: 3 });
    expect(q.options).toHaveLength(2); // 'two' appears once, one real distractor
    expect(q.options).toContain('two');
  });

  it('returns no quiz for tiny or degenerate pools', () => {
    expect(buildQuiz([])).toEqual([]);
    expect(buildQuiz([word('a', 'solo', 'alone')])).toEqual([]);
    // blank terms/translations are not quizable
    expect(buildQuiz([word('a', '', 'x'), word('b', 'y', '')])).toEqual([]);
  });

  it('honors an explicit status selection', () => {
    const quiz = buildQuiz(five(), { statuses: ['known', 'learning'] });
    expect(quiz.map((q) => q.wordId).sort()).toEqual(['w3', 'w4', 'w5'].sort());
    // A single qualifying word cannot produce a quiz (no distractors).
    expect(buildQuiz(five(), { statuses: ['known'] })).toEqual([]);
  });
});

describe('gradeQuizAnswer', () => {
  const q: QuizQuestion = {
    wordId: 'w1',
    prompt: 'hola',
    correct: 'hello',
    options: ['bye', 'hello', 'thanks'],
  };

  it('accepts the correct answer, trimming whitespace', () => {
    expect(gradeQuizAnswer(q, 'hello')).toBe(true);
    expect(gradeQuizAnswer(q, '  hello ')).toBe(true);
  });

  it('rejects wrong answers case-sensitively only when truly different', () => {
    expect(gradeQuizAnswer(q, 'bye')).toBe(false);
    expect(gradeQuizAnswer(q, 'Hello')).toBe(false); // translations are compared as-is
    expect(gradeQuizAnswer(q, '')).toBe(false);
  });
});
