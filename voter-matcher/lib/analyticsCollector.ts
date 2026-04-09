/**
 * AnalyticsCollector — Aggregated, anonymous analytics collection
 *
 * Collects ONLY aggregated counters and distribution buckets.
 * No session-level identifiers (no session ID, no IP, no fingerprint).
 *
 * Analytics can be enabled/disabled via ANALYTICS_ENABLED env var.
 *
 * @module lib/analyticsCollector
 */

/** Aggregated analytics data — no session-level identifiers */
interface AnalyticsData {
  /** Total sessions started */
  readonly sessionsStarted: number;
  /** Total sessions that reached the result screen */
  readonly sessionsCompleted: number;
  /** Distribution of selected options per question: questionId → optionId → count */
  readonly answerDistributions: Record<string, Record<string, number>>;
  /** Distribution of top party match results: partyId → count */
  readonly partyMatchDistributions: Record<string, number>;
  /** Distribution of assigned archetypes: archetypeId → count */
  readonly archetypeDistributions: Record<string, number>;
  /** Distribution of confidence levels: 'High' | 'Medium' | 'Low' → count */
  readonly confidenceDistributions: Record<string, number>;
}

/** Read-only snapshot of current analytics state */
type AnalyticsSnapshot = Readonly<AnalyticsData>;

/**
 * Check whether analytics collection is enabled.
 * Reads from NEXT_PUBLIC_ANALYTICS_ENABLED env var (client-safe).
 */
function isAnalyticsEnabled(): boolean {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true';
  }
  return false;
}

/**
 * Create a fresh, zeroed-out analytics data object.
 */
function createEmptyData(): AnalyticsData {
  return {
    sessionsStarted: 0,
    sessionsCompleted: 0,
    answerDistributions: {},
    partyMatchDistributions: {},
    archetypeDistributions: {},
    confidenceDistributions: {},
  };
}

/**
 * Deep-copy a nested distribution map (questionId → optionId → count).
 */
function deepCopyDistributions(
  src: Record<string, Record<string, number>>,
): Record<string, Record<string, number>> {
  const copy: Record<string, Record<string, number>> = {};
  for (const key of Object.keys(src)) {
    copy[key] = { ...src[key] };
  }
  return copy;
}

/**
 * AnalyticsCollector — Aggregated analytics with zero session-level identifiers.
 *
 * All methods are no-ops when analytics is disabled.
 * Data is purely in-memory counters; persistence (e.g. Turso) is a separate concern.
 */
class AnalyticsCollector {
  private data: AnalyticsData;
  private readonly enabled: boolean;

  constructor(enabled?: boolean) {
    this.enabled = enabled ?? isAnalyticsEnabled();
    this.data = createEmptyData();
  }

  /** Whether analytics collection is active */
  isEnabled(): boolean {
    return this.enabled;
  }

  /** Record that a session started (increment counter only) */
  recordSessionStart(): void {
    if (!this.enabled) return;
    this.data = { ...this.data, sessionsStarted: this.data.sessionsStarted + 1 };
  }

  /** Record that a session reached the result screen (increment counter only) */
  recordCompletion(): void {
    if (!this.enabled) return;
    this.data = { ...this.data, sessionsCompleted: this.data.sessionsCompleted + 1 };
  }

  /** Record a single answer selection — aggregated bucket increment only */
  recordAnswerDistribution(questionId: string, optionId: string): void {
    if (!this.enabled) return;
    const current = { ...this.data.answerDistributions };
    const questionBucket = { ...(current[questionId] ?? {}) };
    questionBucket[optionId] = (questionBucket[optionId] ?? 0) + 1;
    current[questionId] = questionBucket;
    this.data = { ...this.data, answerDistributions: current };
  }

  /** Record the top party match result — aggregated bucket increment only */
  recordPartyMatch(partyId: string): void {
    if (!this.enabled) return;
    const current = { ...this.data.partyMatchDistributions };
    current[partyId] = (current[partyId] ?? 0) + 1;
    this.data = { ...this.data, partyMatchDistributions: current };
  }

  /** Record the assigned archetype — aggregated bucket increment only */
  recordArchetype(archetypeId: string): void {
    if (!this.enabled) return;
    const current = { ...this.data.archetypeDistributions };
    current[archetypeId] = (current[archetypeId] ?? 0) + 1;
    this.data = { ...this.data, archetypeDistributions: current };
  }

  /** Record the confidence level — aggregated bucket increment only */
  recordConfidence(level: string): void {
    if (!this.enabled) return;
    const current = { ...this.data.confidenceDistributions };
    current[level] = (current[level] ?? 0) + 1;
    this.data = { ...this.data, confidenceDistributions: current };
  }

  /** Get a read-only snapshot of current aggregated data (deep copy) */
  getSnapshot(): AnalyticsSnapshot {
    return {
      sessionsStarted: this.data.sessionsStarted,
      sessionsCompleted: this.data.sessionsCompleted,
      answerDistributions: deepCopyDistributions(this.data.answerDistributions),
      partyMatchDistributions: { ...this.data.partyMatchDistributions },
      archetypeDistributions: { ...this.data.archetypeDistributions },
      confidenceDistributions: { ...this.data.confidenceDistributions },
    };
  }

  /** Reset all counters to zero */
  reset(): void {
    this.data = createEmptyData();
  }
}

export { AnalyticsCollector, isAnalyticsEnabled };
export type { AnalyticsData, AnalyticsSnapshot };
