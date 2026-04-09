/**
 * QuestionnaireEngine - Session management for the voter questionnaire
 *
 * Responsibilities:
 * - Create sessions with cluster-randomized question order
 * - Record answers and skips
 * - Support back navigation with pre-selection
 * - Compute progress
 * - Emit axis-level and total-skip warnings
 *
 * @module engines/questionnaireEngine
 */

import type { ConfigBundle, QuestionBank } from '@/lib/configLoader';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Question {
  readonly id: string;
  readonly cluster: string;
  readonly text: { readonly en: string; readonly ta: string };
  readonly options: ReadonlyArray<{
    readonly id: string;
    readonly text: { readonly en: string; readonly ta: string };
    readonly partyWeights: Readonly<Record<string, number>>;
    readonly axisWeights: Readonly<Record<string, number>>;
  }>;
}

export interface Session {
  readonly id: string;
  readonly questions: readonly Question[];
  readonly answers: ReadonlyMap<string, string>; // questionId → optionId
  readonly skipped: ReadonlySet<string>;
  readonly startedAt: number;
  readonly language: string;
  readonly configVersion: string; // pinned at session creation
}

export const WARNING_TYPE = {
  AxisSkip: 'axis_skip',
  TotalSkip: 'total_skip',
} as const;
export type WarningType = (typeof WARNING_TYPE)[keyof typeof WARNING_TYPE];

export interface Warning {
  readonly type: WarningType;
  readonly axisId?: string; // present for axis_skip warnings
  readonly skippedCount: number;
  readonly totalCount: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Fisher-Yates shuffle — returns a new shuffled array, does not mutate input.
 */
function shuffle<T>(items: readonly T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // swap
    const tmp = arr[i];
    arr[i] = arr[j] as T;
    arr[j] = tmp as T;
  }
  return arr;
}

/**
 * Group questions by their cluster field.
 */
function groupByCluster(questions: readonly Question[]): Map<string, Question[]> {
  const groups = new Map<string, Question[]>();
  for (const q of questions) {
    const existing = groups.get(q.cluster);
    if (existing !== undefined) {
      existing.push(q);
    } else {
      groups.set(q.cluster, [q]);
    }
  }
  return groups;
}

/**
 * Cluster-randomize questions:
 * 1. Shuffle the cluster order.
 * 2. Within each cluster, shuffle the question order.
 * Returns a flat array of questions in the new order.
 */
function clusterRandomize(questions: readonly Question[]): Question[] {
  const groups = groupByCluster(questions);
  const clusterIds = shuffle([...groups.keys()]);
  const result: Question[] = [];
  for (const clusterId of clusterIds) {
    const clusterQuestions = groups.get(clusterId) ?? [];
    result.push(...shuffle(clusterQuestions));
  }
  return result;
}

// ─── QuestionnaireEngine ──────────────────────────────────────────────────────

export class QuestionnaireEngine {
  /**
   * Create a new session with cluster-randomized questions.
   * Pins the config version to the session so scoring always uses the
   * same weights even if config is updated mid-session.
   */
  createSession(config: ConfigBundle, lang: string): Session {
    const rawQuestions = config.questions.questions as readonly Question[];
    const randomized = clusterRandomize(rawQuestions);

    return {
      id: crypto.randomUUID(),
      questions: randomized,
      answers: new Map<string, string>(),
      skipped: new Set<string>(),
      startedAt: Date.now(),
      language: lang,
      configVersion: config.version,
    };
  }

  /**
   * Record an answer for a question.
   * If the question was previously skipped, removes it from the skipped set.
   * Returns a new Session (immutable update).
   */
  selectOption(session: Session, questionId: string, optionId: string): Session {
    const answers = new Map(session.answers);
    answers.set(questionId, optionId);

    const skipped = new Set(session.skipped);
    skipped.delete(questionId);

    return { ...session, answers, skipped };
  }

  /**
   * Mark a question as skipped.
   * If the question had a previous answer, removes it.
   * Returns a new Session (immutable update).
   */
  skipQuestion(session: Session, questionId: string): Session {
    const skipped = new Set(session.skipped);
    skipped.add(questionId);

    const answers = new Map(session.answers);
    answers.delete(questionId);

    return { ...session, answers, skipped };
  }

  /**
   * Navigate back to a previously answered/skipped question.
   * The returned session has the same answers/skips — the caller is responsible
   * for rendering the pre-selected option from session.answers.get(questionId).
   * This method is a no-op state-wise but is provided for API symmetry and
   * future extension (e.g., clearing forward answers on back-navigation).
   */
  navigateBack(session: Session, questionId: string): Session {
    // Validate the question exists in this session
    const exists = session.questions.some(q => q.id === questionId);
    if (!exists) {
      return session;
    }
    // Return session unchanged — pre-selection is read from session.answers
    return { ...session };
  }

  /**
   * Compute progress through the questionnaire.
   * "current" = number of questions answered or skipped so far.
   */
  getProgress(session: Session): { current: number; total: number; pct: number } {
    const total = session.questions.length;
    const current = session.answers.size + session.skipped.size;
    const pct = total === 0 ? 0 : Math.round((current / total) * 100);
    return { current, total, pct };
  }

  /**
   * Returns true when every question has been answered or skipped.
   */
  isComplete(session: Session): boolean {
    const { current, total } = this.getProgress(session);
    return total > 0 && current >= total;
  }

  /**
   * Compute active warnings for the current session state.
   *
   * Two warning types:
   * 1. axis_skip  — all questions in a cluster have been skipped
   * 2. total_skip — total skipped questions exceed the minAnsweredThreshold
   *                 (threshold read from scoring-params.json via config)
   */
  getWarnings(session: Session, config: ConfigBundle): Warning[] {
    const warnings: Warning[] = [];

    // ── Axis-level skip warning ──────────────────────────────────────────────
    const clusterGroups = groupByCluster(session.questions);
    for (const [clusterId, clusterQuestions] of clusterGroups) {
      const allSkipped = clusterQuestions.every(q => session.skipped.has(q.id));
      if (allSkipped && clusterQuestions.length > 0) {
        warnings.push({
          type: WARNING_TYPE.AxisSkip,
          axisId: clusterId,
          skippedCount: clusterQuestions.length,
          totalCount: clusterQuestions.length,
        });
      }
    }

    // ── Total skip threshold warning ─────────────────────────────────────────
    const total = session.questions.length;
    const skippedCount = session.skipped.size;
    const minAnsweredThreshold = config.scoringParams.minAnsweredThreshold;
    // Warning fires when answered fraction < threshold
    const answeredFraction = total === 0 ? 1 : (total - skippedCount) / total;
    if (answeredFraction < minAnsweredThreshold) {
      warnings.push({
        type: WARNING_TYPE.TotalSkip,
        skippedCount,
        totalCount: total,
      });
    }

    return warnings;
  }
}
