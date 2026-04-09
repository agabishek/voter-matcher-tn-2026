/**
 * Tests for AnalyticsCollector — aggregated analytics (task 12.1, 12.2)
 *
 * Validates:
 * - Aggregated counter increments for all distribution types
 * - No session-level identifiers in any analytics record
 * - Enable/disable behavior via constructor flag
 * - Snapshot immutability
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AnalyticsCollector } from '@/lib/analyticsCollector';
import type { AnalyticsSnapshot } from '@/lib/analyticsCollector';

describe('AnalyticsCollector', () => {
  let collector: AnalyticsCollector;

  beforeEach(() => {
    collector = new AnalyticsCollector(true);
  });

  describe('enable/disable', () => {
    it('reports enabled when constructed with true', () => {
      expect(collector.isEnabled()).toBe(true);
    });

    it('reports disabled when constructed with false', () => {
      const disabled = new AnalyticsCollector(false);
      expect(disabled.isEnabled()).toBe(false);
    });

    it('does not record data when disabled', () => {
      const disabled = new AnalyticsCollector(false);
      disabled.recordCompletion();
      disabled.recordAnswerDistribution('q1', 'q1_a');
      disabled.recordPartyMatch('DMK');
      disabled.recordArchetype('security_seeker');
      disabled.recordConfidence('High');
      disabled.recordSessionStart();

      const snap = disabled.getSnapshot();
      expect(snap.sessionsStarted).toBe(0);
      expect(snap.sessionsCompleted).toBe(0);
      expect(Object.keys(snap.answerDistributions)).toHaveLength(0);
      expect(Object.keys(snap.partyMatchDistributions)).toHaveLength(0);
      expect(Object.keys(snap.archetypeDistributions)).toHaveLength(0);
      expect(Object.keys(snap.confidenceDistributions)).toHaveLength(0);
    });
  });

  describe('recordSessionStart / recordCompletion', () => {
    it('increments sessionsStarted counter', () => {
      collector.recordSessionStart();
      collector.recordSessionStart();
      expect(collector.getSnapshot().sessionsStarted).toBe(2);
    });

    it('increments sessionsCompleted counter', () => {
      collector.recordCompletion();
      expect(collector.getSnapshot().sessionsCompleted).toBe(1);
    });

    it('tracks completion rate as ratio of completed to started', () => {
      collector.recordSessionStart();
      collector.recordSessionStart();
      collector.recordSessionStart();
      collector.recordCompletion();
      collector.recordCompletion();
      const snap = collector.getSnapshot();
      expect(snap.sessionsCompleted / snap.sessionsStarted).toBeCloseTo(2 / 3);
    });
  });

  describe('recordAnswerDistribution', () => {
    it('increments answer bucket for question and option', () => {
      collector.recordAnswerDistribution('q1', 'q1_a');
      collector.recordAnswerDistribution('q1', 'q1_a');
      collector.recordAnswerDistribution('q1', 'q1_b');

      const snap = collector.getSnapshot();
      expect(snap.answerDistributions['q1']?.['q1_a']).toBe(2);
      expect(snap.answerDistributions['q1']?.['q1_b']).toBe(1);
    });

    it('handles multiple questions independently', () => {
      collector.recordAnswerDistribution('q1', 'q1_a');
      collector.recordAnswerDistribution('q2', 'q2_c');

      const snap = collector.getSnapshot();
      expect(snap.answerDistributions['q1']?.['q1_a']).toBe(1);
      expect(snap.answerDistributions['q2']?.['q2_c']).toBe(1);
    });
  });

  describe('recordPartyMatch', () => {
    it('increments party match bucket', () => {
      collector.recordPartyMatch('DMK');
      collector.recordPartyMatch('DMK');
      collector.recordPartyMatch('AIADMK');

      const snap = collector.getSnapshot();
      expect(snap.partyMatchDistributions['DMK']).toBe(2);
      expect(snap.partyMatchDistributions['AIADMK']).toBe(1);
    });
  });

  describe('recordArchetype', () => {
    it('increments archetype bucket', () => {
      collector.recordArchetype('security_seeker');
      collector.recordArchetype('equity_builder');
      collector.recordArchetype('security_seeker');

      const snap = collector.getSnapshot();
      expect(snap.archetypeDistributions['security_seeker']).toBe(2);
      expect(snap.archetypeDistributions['equity_builder']).toBe(1);
    });
  });

  describe('recordConfidence', () => {
    it('increments confidence level bucket', () => {
      collector.recordConfidence('High');
      collector.recordConfidence('Medium');
      collector.recordConfidence('High');
      collector.recordConfidence('Low');

      const snap = collector.getSnapshot();
      expect(snap.confidenceDistributions['High']).toBe(2);
      expect(snap.confidenceDistributions['Medium']).toBe(1);
      expect(snap.confidenceDistributions['Low']).toBe(1);
    });
  });

  describe('no session-level identifiers (Req 16 AC 7)', () => {
    it('snapshot contains no session ID field', () => {
      collector.recordSessionStart();
      collector.recordCompletion();
      collector.recordAnswerDistribution('q1', 'q1_a');
      collector.recordPartyMatch('DMK');
      collector.recordArchetype('security_seeker');
      collector.recordConfidence('High');

      const snap = collector.getSnapshot();
      const keys = Object.keys(snap);

      // Must NOT contain any session-level identifier fields
      const forbiddenKeys = ['sessionId', 'userId', 'ip', 'fingerprint', 'deviceId', 'browserId', 'timestamp'];
      for (const forbidden of forbiddenKeys) {
        expect(keys).not.toContain(forbidden);
      }
    });

    it('snapshot JSON contains no identifiable strings', () => {
      collector.recordSessionStart();
      collector.recordCompletion();
      collector.recordPartyMatch('DMK');

      const json = JSON.stringify(collector.getSnapshot());
      const identifierPatterns = ['sessionId', 'userId', 'ipAddress', 'fingerprint', 'deviceId'];
      for (const pattern of identifierPatterns) {
        expect(json).not.toContain(pattern);
      }
    });

    it('data structure only contains expected aggregated fields', () => {
      const snap = collector.getSnapshot();
      const allowedKeys = new Set([
        'sessionsStarted',
        'sessionsCompleted',
        'answerDistributions',
        'partyMatchDistributions',
        'archetypeDistributions',
        'confidenceDistributions',
      ]);
      for (const key of Object.keys(snap)) {
        expect(allowedKeys.has(key)).toBe(true);
      }
    });
  });

  describe('reset', () => {
    it('clears all counters to zero', () => {
      collector.recordSessionStart();
      collector.recordCompletion();
      collector.recordAnswerDistribution('q1', 'q1_a');
      collector.recordPartyMatch('DMK');
      collector.recordArchetype('security_seeker');
      collector.recordConfidence('High');

      collector.reset();
      const snap = collector.getSnapshot();

      expect(snap.sessionsStarted).toBe(0);
      expect(snap.sessionsCompleted).toBe(0);
      expect(Object.keys(snap.answerDistributions)).toHaveLength(0);
      expect(Object.keys(snap.partyMatchDistributions)).toHaveLength(0);
      expect(Object.keys(snap.archetypeDistributions)).toHaveLength(0);
      expect(Object.keys(snap.confidenceDistributions)).toHaveLength(0);
    });
  });

  describe('snapshot immutability', () => {
    it('returns a copy — mutating snapshot does not affect collector', () => {
      collector.recordPartyMatch('DMK');
      const snap1 = collector.getSnapshot() as Record<string, unknown>;
      (snap1 as { partyMatchDistributions: Record<string, number> }).partyMatchDistributions['TVK'] = 999;

      const snap2 = collector.getSnapshot();
      expect(snap2.partyMatchDistributions['TVK']).toBeUndefined();
    });
  });
});
