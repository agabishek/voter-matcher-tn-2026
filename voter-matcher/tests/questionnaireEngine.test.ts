/**
 * Tests for QuestionnaireEngine — session state management (5.2) and warning logic (5.3)
 */

import { describe, it, expect } from 'vitest';
import {
  QuestionnaireEngine,
  WARNING_TYPE,
  type Question,
  type Session,
} from '@/engines/questionnaireEngine';
import type { ConfigBundle } from '@/lib/configLoader';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeQuestion(id: string, cluster: string): Question {
  return {
    id,
    cluster,
    text: { en: `Question ${id}`, ta: `கேள்வி ${id}` },
    options: [
      {
        id: `${id}_a`,
        text: { en: 'Option A', ta: 'விருப்பம் அ' },
        partyWeights: { DMK: 3, AIADMK: 1, TVK: 2 },
        axisWeights: { welfare: 3 },
      },
      {
        id: `${id}_b`,
        text: { en: 'Option B', ta: 'விருப்பம் ஆ' },
        partyWeights: { DMK: 1, AIADMK: 3, TVK: 2 },
        axisWeights: { welfare: 1 },
      },
    ],
  };
}

/** Minimal ConfigBundle stub — only fields used by QuestionnaireEngine */
function makeConfig(questions: Question[], minAnsweredThreshold = 0.5): ConfigBundle {
  return {
    version: 'test-v1',
    loadedAt: new Date().toISOString(),
    questions: { version: '1.0', hash: 'x', questions } as ConfigBundle['questions'],
    scoringParams: {
      version: '1.0',
      hash: 'x',
      minAnsweredThreshold,
    } as ConfigBundle['scoringParams'],
    parties: {} as ConfigBundle['parties'],
    axes: {} as ConfigBundle['axes'],
    archetypes: {} as ConfigBundle['archetypes'],
    languages: {} as ConfigBundle['languages'],
  };
}

const Q1 = makeQuestion('q1', 'welfare');
const Q2 = makeQuestion('q2', 'welfare');
const Q3 = makeQuestion('q3', 'governance');
const Q4 = makeQuestion('q4', 'governance');

function makeSession(questions: Question[] = [Q1, Q2, Q3, Q4]): Session {
  const engine = new QuestionnaireEngine();
  const config = makeConfig(questions);
  return engine.createSession(config, 'en');
}

// ─── 5.2 Session State Management ─────────────────────────────────────────────

describe('QuestionnaireEngine — session state management (5.2)', () => {
  const engine = new QuestionnaireEngine();

  describe('createSession', () => {
    it('creates a session with all questions present', () => {
      const session = makeSession();
      expect(session.questions).toHaveLength(4);
    });

    it('starts with no answers and no skips', () => {
      const session = makeSession();
      expect(session.answers.size).toBe(0);
      expect(session.skipped.size).toBe(0);
    });

    it('pins the config version to the session', () => {
      const session = makeSession();
      expect(session.configVersion).toBe('test-v1');
    });

    it('assigns a unique id each time', () => {
      const config = makeConfig([Q1, Q2]);
      const s1 = engine.createSession(config, 'en');
      const s2 = engine.createSession(config, 'en');
      expect(s1.id).not.toBe(s2.id);
    });
  });

  describe('selectOption — answer recording', () => {
    it('records an answer for a question', () => {
      const session = makeSession();
      const updated = engine.selectOption(session, 'q1', 'q1_a');
      expect(updated.answers.get('q1')).toBe('q1_a');
    });

    it('does not mutate the original session', () => {
      const session = makeSession();
      engine.selectOption(session, 'q1', 'q1_a');
      expect(session.answers.size).toBe(0);
    });

    it('overwrites a previous answer', () => {
      let session = makeSession();
      session = engine.selectOption(session, 'q1', 'q1_a');
      session = engine.selectOption(session, 'q1', 'q1_b');
      expect(session.answers.get('q1')).toBe('q1_b');
    });

    it('removes question from skipped set when answered', () => {
      let session = makeSession();
      session = engine.skipQuestion(session, 'q1');
      expect(session.skipped.has('q1')).toBe(true);
      session = engine.selectOption(session, 'q1', 'q1_a');
      expect(session.skipped.has('q1')).toBe(false);
    });
  });

  describe('skipQuestion — skip tracking', () => {
    it('marks a question as skipped', () => {
      const session = makeSession();
      const updated = engine.skipQuestion(session, 'q1');
      expect(updated.skipped.has('q1')).toBe(true);
    });

    it('removes any existing answer when skipped', () => {
      let session = makeSession();
      session = engine.selectOption(session, 'q1', 'q1_a');
      session = engine.skipQuestion(session, 'q1');
      expect(session.answers.has('q1')).toBe(false);
    });

    it('does not mutate the original session', () => {
      const session = makeSession();
      engine.skipQuestion(session, 'q1');
      expect(session.skipped.size).toBe(0);
    });

    it('can skip multiple questions independently', () => {
      let session = makeSession();
      session = engine.skipQuestion(session, 'q1');
      session = engine.skipQuestion(session, 'q3');
      expect(session.skipped.has('q1')).toBe(true);
      expect(session.skipped.has('q3')).toBe(true);
      expect(session.skipped.has('q2')).toBe(false);
    });
  });

  describe('navigateBack — back navigation with pre-selection', () => {
    it('returns a session unchanged for a valid question id', () => {
      let session = makeSession();
      session = engine.selectOption(session, 'q1', 'q1_a');
      const back = engine.navigateBack(session, 'q1');
      // pre-selection is preserved in answers
      expect(back.answers.get('q1')).toBe('q1_a');
    });

    it('returns session unchanged for an unknown question id', () => {
      const session = makeSession();
      const back = engine.navigateBack(session, 'nonexistent');
      expect(back).toEqual(session);
    });

    it('preserves skipped state on back navigation', () => {
      let session = makeSession();
      session = engine.skipQuestion(session, 'q2');
      const back = engine.navigateBack(session, 'q1');
      expect(back.skipped.has('q2')).toBe(true);
    });
  });

  describe('getProgress', () => {
    it('returns 0% progress on a fresh session', () => {
      const session = makeSession();
      expect(engine.getProgress(session)).toEqual({ current: 0, total: 4, pct: 0 });
    });

    it('counts answered questions in progress', () => {
      let session = makeSession();
      session = engine.selectOption(session, 'q1', 'q1_a');
      expect(engine.getProgress(session).current).toBe(1);
    });

    it('counts skipped questions in progress', () => {
      let session = makeSession();
      session = engine.skipQuestion(session, 'q1');
      expect(engine.getProgress(session).current).toBe(1);
    });

    it('counts both answered and skipped', () => {
      let session = makeSession();
      session = engine.selectOption(session, 'q1', 'q1_a');
      session = engine.skipQuestion(session, 'q2');
      expect(engine.getProgress(session).current).toBe(2);
      expect(engine.getProgress(session).pct).toBe(50);
    });
  });

  describe('isComplete', () => {
    it('returns false when not all questions are answered/skipped', () => {
      const session = makeSession();
      expect(engine.isComplete(session)).toBe(false);
    });

    it('returns true when all questions are answered', () => {
      let session = makeSession([Q1, Q2]);
      session = engine.selectOption(session, 'q1', 'q1_a');
      session = engine.selectOption(session, 'q2', 'q2_b');
      expect(engine.isComplete(session)).toBe(true);
    });

    it('returns true when all questions are skipped', () => {
      let session = makeSession([Q1, Q2]);
      session = engine.skipQuestion(session, 'q1');
      session = engine.skipQuestion(session, 'q2');
      expect(engine.isComplete(session)).toBe(true);
    });

    it('returns true with a mix of answers and skips', () => {
      let session = makeSession([Q1, Q2]);
      session = engine.selectOption(session, 'q1', 'q1_a');
      session = engine.skipQuestion(session, 'q2');
      expect(engine.isComplete(session)).toBe(true);
    });
  });
});

// ─── 5.3 Warning Logic ────────────────────────────────────────────────────────

describe('QuestionnaireEngine — warning logic (5.3)', () => {
  const engine = new QuestionnaireEngine();

  describe('axis-level skip warning', () => {
    it('emits no warning when no questions are skipped', () => {
      const session = makeSession();
      const config = makeConfig([Q1, Q2, Q3, Q4]);
      const warnings = engine.getWarnings(session, config);
      expect(warnings.filter(w => w.type === WARNING_TYPE.AxisSkip)).toHaveLength(0);
    });

    it('emits axis_skip warning when all questions in a cluster are skipped', () => {
      let session = makeSession();
      const config = makeConfig([Q1, Q2, Q3, Q4]);
      // skip all welfare cluster questions
      session = engine.skipQuestion(session, 'q1');
      session = engine.skipQuestion(session, 'q2');
      const warnings = engine.getWarnings(session, config);
      const axisWarnings = warnings.filter(w => w.type === WARNING_TYPE.AxisSkip);
      expect(axisWarnings).toHaveLength(1);
      expect(axisWarnings[0]?.axisId).toBe('welfare');
    });

    it('does not emit axis_skip when only some questions in a cluster are skipped', () => {
      let session = makeSession();
      const config = makeConfig([Q1, Q2, Q3, Q4]);
      session = engine.skipQuestion(session, 'q1'); // only one of two welfare questions
      const warnings = engine.getWarnings(session, config);
      expect(warnings.filter(w => w.type === WARNING_TYPE.AxisSkip)).toHaveLength(0);
    });

    it('emits axis_skip for each fully-skipped cluster independently', () => {
      let session = makeSession();
      const config = makeConfig([Q1, Q2, Q3, Q4]);
      session = engine.skipQuestion(session, 'q1');
      session = engine.skipQuestion(session, 'q2');
      session = engine.skipQuestion(session, 'q3');
      session = engine.skipQuestion(session, 'q4');
      const axisWarnings = engine.getWarnings(session, config).filter(w => w.type === WARNING_TYPE.AxisSkip);
      expect(axisWarnings).toHaveLength(2);
      const axisIds = axisWarnings.map(w => w.axisId);
      expect(axisIds).toContain('welfare');
      expect(axisIds).toContain('governance');
    });

    it('clears axis_skip warning when a skipped question is answered', () => {
      let session = makeSession();
      const config = makeConfig([Q1, Q2, Q3, Q4]);
      session = engine.skipQuestion(session, 'q1');
      session = engine.skipQuestion(session, 'q2');
      // now answer one back
      session = engine.selectOption(session, 'q1', 'q1_a');
      const warnings = engine.getWarnings(session, config);
      expect(warnings.filter(w => w.type === WARNING_TYPE.AxisSkip)).toHaveLength(0);
    });
  });

  describe('total skip threshold warning', () => {
    it('emits no total_skip warning when answered fraction is above threshold', () => {
      let session = makeSession([Q1, Q2, Q3, Q4]);
      const config = makeConfig([Q1, Q2, Q3, Q4], 0.5);
      // answer 3 of 4 — 75% answered, above 50% threshold
      session = engine.selectOption(session, 'q1', 'q1_a');
      session = engine.selectOption(session, 'q2', 'q2_a');
      session = engine.selectOption(session, 'q3', 'q3_a');
      session = engine.skipQuestion(session, 'q4');
      const warnings = engine.getWarnings(session, config);
      expect(warnings.filter(w => w.type === WARNING_TYPE.TotalSkip)).toHaveLength(0);
    });

    it('emits total_skip warning when skipped fraction exceeds threshold', () => {
      let session = makeSession([Q1, Q2, Q3, Q4]);
      const config = makeConfig([Q1, Q2, Q3, Q4], 0.5);
      // skip 3 of 4 — only 25% answered, below 50% threshold
      session = engine.skipQuestion(session, 'q1');
      session = engine.skipQuestion(session, 'q2');
      session = engine.skipQuestion(session, 'q3');
      const warnings = engine.getWarnings(session, config);
      expect(warnings.filter(w => w.type === WARNING_TYPE.TotalSkip)).toHaveLength(1);
    });

    it('reads threshold from config (not hardcoded)', () => {
      let session = makeSession([Q1, Q2, Q3, Q4]);
      // strict threshold: must answer 90%
      const strictConfig = makeConfig([Q1, Q2, Q3, Q4], 0.9);
      session = engine.skipQuestion(session, 'q1'); // 75% answered — below 90%
      const warnings = engine.getWarnings(session, strictConfig);
      expect(warnings.filter(w => w.type === WARNING_TYPE.TotalSkip)).toHaveLength(1);
    });

    it('total_skip warning includes correct counts', () => {
      let session = makeSession([Q1, Q2, Q3, Q4]);
      const config = makeConfig([Q1, Q2, Q3, Q4], 0.5);
      session = engine.skipQuestion(session, 'q1');
      session = engine.skipQuestion(session, 'q2');
      session = engine.skipQuestion(session, 'q3');
      const warnings = engine.getWarnings(session, config);
      const totalSkipWarning = warnings.find(w => w.type === WARNING_TYPE.TotalSkip);
      expect(totalSkipWarning?.skippedCount).toBe(3);
      expect(totalSkipWarning?.totalCount).toBe(4);
    });
  });
});
