import { describe, expect, it } from 'vitest';
import { emptySongState } from './songs';
import {
  applyMastery,
  gradeAttempt,
  isSessionComplete,
  maskLine,
  normalizeGuess,
  passCurrentLine,
  recordFailedAttempt,
  revealNext,
  sessionLearnedLines,
  sessionScore,
  startLearnSession,
} from './learn';

describe('maskLine', () => {
  it('first-letters keeps each word run’s first character and masks the rest', () => {
    expect(maskLine('Frère Jacques,', 'first-letters')).toBe('F____ J_______');
    // Apostrophes do not start new words: only the run's very first char survives.
    expect(maskLine("l'alouette", 'first-letters')).toBe('l_________');
    // A standalone punctuation run survives as its own first character.
    expect(maskLine('Sonnez les matines !', 'first-letters')).toBe(
      'S_____ l__ m______ !'
    );
  });

  it('is length-preserving in every mode, whitespace included', () => {
    const lines = ['Ding, dang, dong.', 'Et la tête !  deux  espaces', ''];
    for (const line of lines) {
      for (const mode of ['full', 'first-letters', 'hidden'] as const) {
        expect(maskLine(line, mode)).toHaveLength(line.length);
      }
    }
  });

  it('hidden masks every non-whitespace character but keeps spaces', () => {
    expect(maskLine('Et la tête !', 'hidden')).toBe('__ __ ____ _');
    expect(maskLine('   ', 'hidden')).toBe('   ');
  });

  it('full mode returns the line unchanged', () => {
    expect(maskLine('Ding, dang, dong.', 'full')).toBe('Ding, dang, dong.');
  });

  it('handles the degenerate empty line', () => {
    expect(maskLine('', 'first-letters')).toBe('');
    expect(maskLine('', 'hidden')).toBe('');
  });

  it('falls back to the hidden cue for an unrecognized mode', () => {
    expect(maskLine('Ding dong', 'surprise' as never)).toBe('____ ____');
  });
});

describe('normalizeGuess', () => {
  it('ignores case, leading/trailing space and internal whitespace runs', () => {
    expect(normalizeGuess('  Frère   Jacques, ')).toBe('frère jacques');
    expect(normalizeGuess('Alouette')).toBe(normalizeGuess('alouette'));
  });

  it('treats word-boundary punctuation as a separator', () => {
    expect(normalizeGuess('Frère Jacques,')).toBe('frère jacques');
    expect(normalizeGuess('Dormez-vous ?')).toBe(normalizeGuess('dormez vous'));
    expect(normalizeGuess('Ding, dang, dong.')).toBe('ding dang dong');
  });

  it('makes curly, straight and modifier-letter apostrophes equivalent', () => {
    expect(normalizeGuess('l’alouette')).toBe('l alouette');
    expect(normalizeGuess('l’alouette')).toBe(normalizeGuess("l'alouette"));
    expect(normalizeGuess('lʼalouette')).toBe(normalizeGuess("l'alouette"));
  });

  it('preserves accented letters untouched and composes via NFC', () => {
    expect(normalizeGuess('À É Ç')).toBe('à é ç');
    expect(normalizeGuess('te\u0302te')).toBe(normalizeGuess('tête'));
    // Accents are never transliterated: 'frère' deliberately ≠ 'frere'.
    expect(normalizeGuess('Frère')).not.toBe(normalizeGuess('Frere'));
  });

  it('collapses empty and whitespace-only input to the empty string', () => {
    expect(normalizeGuess('')).toBe('');
    expect(normalizeGuess(' \t\n ')).toBe('');
    expect(normalizeGuess('?!')).toBe('');
  });
});

describe('gradeAttempt', () => {
  it('passes exact matches', () => {
    expect(gradeAttempt('ya no puede caminar', 'ya no puede caminar')).toBe(true);
  });

  it('passes through the normalizer’s equivalence classes', () => {
    expect(
      gradeAttempt(
        'Amazing grace, how sweet the sound,',
        '  amazing   grace  how sweet the sound!'
      )
    ).toBe(true);
    expect(gradeAttempt("l'alouette", 'L’alouette')).toBe(true);
  });

  it('fails a wrong word and an empty guess against a non-empty line', () => {
    expect(gradeAttempt('ya no puede caminar', 'ya no puede volar')).toBe(false);
    expect(gradeAttempt('Amazing grace', '')).toBe(false);
    expect(gradeAttempt('Amazing grace', '   ')).toBe(false);
  });

  it('only matches empty against empty', () => {
    expect(gradeAttempt('', '')).toBe(true);
    expect(gradeAttempt('', 'hello')).toBe(false);
  });
});

describe('session progression', () => {
  it('starts at line 0 with nothing revealed', () => {
    expect(startLearnSession(4)).toEqual({
      totalLines: 4,
      currentLine: 0,
      revealedLineIndexes: [],
      attempts: 0,
      correctFirstTries: 0,
    });
  });

  it('starts already complete for a song with no lines', () => {
    expect(isSessionComplete(startLearnSession(0))).toBe(true);
    expect(sessionScore(startLearnSession(0))).toBe(0);
  });

  it('revealNext completes the current line without first-try credit', () => {
    const session = startLearnSession(4);
    const revealed = revealNext(session);
    expect(revealed.currentLine).toBe(1);
    expect(revealed.revealedLineIndexes).toEqual([0]);
    expect(revealed.correctFirstTries).toBe(0);
    expect(session.revealedLineIndexes).toEqual([]); // input untouched
  });

  it('recordFailedAttempt then passCurrentLine forfeits first-try credit', () => {
    const failed = recordFailedAttempt(recordFailedAttempt(startLearnSession(4)));
    expect(failed.attempts).toBe(2);
    const passed = passCurrentLine(failed);
    expect(passed.revealedLineIndexes).toEqual([0]);
    expect(passed.correctFirstTries).toBe(0);
    expect(passed.attempts).toBe(0); // counter resets for the next line
    expect(passed.currentLine).toBe(1);
  });

  it('passCurrentLine with no failed attempts earns first-try credit', () => {
    const passed = passCurrentLine(startLearnSession(4));
    expect(passed.correctFirstTries).toBe(1);
    expect(passed.revealedLineIndexes).toEqual([0]);
  });

  it('completes after every line and ignores further moves', () => {
    let session = startLearnSession(2);
    session = passCurrentLine(session);
    expect(isSessionComplete(session)).toBe(false);
    session = revealNext(session);
    expect(isSessionComplete(session)).toBe(true);
    expect(session.currentLine).toBe(2);
    expect(session.revealedLineIndexes).toEqual([0, 1]);
    expect(revealNext(session)).toBe(session);
    expect(passCurrentLine(session)).toBe(session);
    expect(recordFailedAttempt(session)).toBe(session);
  });
});

describe('sessionScore', () => {
  it('scores 100 for an all-first-try run', () => {
    let session = startLearnSession(4);
    for (let i = 0; i < 4; i++) session = passCurrentLine(session);
    expect(sessionScore(session)).toBe(100);
  });

  it('scores 50 when every line was revealed rather than typed', () => {
    let session = startLearnSession(4);
    for (let i = 0; i < 4; i++) session = revealNext(session);
    expect(sessionScore(session)).toBe(50);
  });

  it('rounds mixed runs and stays within bounds', () => {
    // 3 first-try passes (3.0) + 1 revealed (0.5) of 4 → 87.5 → 88.
    let session = startLearnSession(4);
    session = passCurrentLine(passCurrentLine(passCurrentLine(session)));
    session = revealNext(session);
    expect(sessionScore(session)).toBe(88);
    expect(sessionScore(session)).toBeLessThanOrEqual(100);
    expect(sessionScore(startLearnSession(0))).toBeGreaterThanOrEqual(0);
  });
});

describe('mastery mapping', () => {
  it('marks every completed line learned and merges into song state', () => {
    let session = startLearnSession(3);
    session = passCurrentLine(revealNext(session));
    expect(sessionLearnedLines(session)).toEqual([0, 1]);
    const state = applyMastery(
      { ...emptySongState(7), bookmarkedLines: [2] },
      sessionLearnedLines(session),
      42
    );
    expect(state.completedLines).toEqual([0, 1]);
    expect(state.bookmarkedLines).toEqual([2]);
    expect(state.updatedAt).toBe(42);
  });

  it('applyMastery unions, dedupes, sorts and ignores invalid indexes', () => {
    const state = { completedLines: [2], bookmarkedLines: [], updatedAt: 0 };
    const merged = applyMastery(state, [0, 2, -1, 1.5, 0], 9);
    expect(merged.completedLines).toEqual([0, 2]);
    expect(state.completedLines).toEqual([2]); // input untouched
  });
});
