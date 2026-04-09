import { describe, it, expect } from 'vitest';
import { ScoringEngine } from '@/engines/scoringEngine';
import type { ConfigBundle, QuestionBank } from '@/lib/configLoader';

describe('ScoringEngine', () => {
  const engine = new ScoringEngine();

  // Mock config bundle with 3 active parties
  const mockConfig: ConfigBundle = {
    parties: {
      version: '1.0.0',
      hash: 'test-hash',
      parties: [
        { id: 'DMK', names: { en: 'DMK', ta: 'திமுக' }, fullNames: { en: 'DMK', ta: 'திமுக' }, governanceStatus: 'incumbent', weightBasis: 'track-record', manifestoVersion: 'v1', active: true },
        { id: 'AIADMK', names: { en: 'AIADMK', ta: 'அதிமுக' }, fullNames: { en: 'AIADMK', ta: 'அதிமுக' }, governanceStatus: 'incumbent', weightBasis: 'track-record', manifestoVersion: 'v1', active: true },
        { id: 'TVK', names: { en: 'TVK', ta: 'தவெக' }, fullNames: { en: 'TVK', ta: 'தவெக' }, governanceStatus: 'new', weightBasis: 'promise', manifestoVersion: 'v1', active: true },
        { id: 'INACTIVE', names: { en: 'Inactive', ta: 'செயலற்ற' }, fullNames: { en: 'Inactive', ta: 'செயலற்ற' }, governanceStatus: 'new', weightBasis: 'promise', manifestoVersion: 'v1', active: false }
      ]
    },
    axes: {
      version: '1.0.0',
      hash: 'test-hash',
      axes: [
        { id: 'welfare', labels: { en: 'Welfare', ta: 'நலன்புரி' }, technicalName: { en: 'Welfare', ta: 'நலன்புரி' }, archetypeMapping: [], independentPairs: [] },
        { id: 'economy', labels: { en: 'Economy', ta: 'பொருளாதாரம்' }, technicalName: { en: 'Economy', ta: 'பொருளாதாரம்' }, archetypeMapping: [], independentPairs: [] },
        { id: 'governance', labels: { en: 'Governance', ta: 'ஆட்சி' }, technicalName: { en: 'Governance', ta: 'ஆட்சி' }, archetypeMapping: [], independentPairs: [] }
      ]
    },
    archetypes: {
      version: '1.0.0',
      hash: 'test-hash',
      archetypes: []
    },
    languages: {
      version: '1.0.0',
      hash: 'test-hash',
      defaultLanguage: 'ta',
      languages: []
    },
    scoringParams: {
      version: '1.0.0',
      hash: 'test-hash',
      questionCount: 30,
      optionsPerQuestion: 3,
      weightRange: { min: 0, max: 5 },
      minAnsweredThreshold: 0.5,
      collinearityThreshold: 0.70,
      discriminatingPowerThreshold: 1.0,
      confidenceFormula: 'dynamic',
      estimatedCompletionMinutes: 3,
      performanceTargets: {
        loadTime4G: 1000,
        loadTime2G: 3000,
        scoringTime: 200,
        concurrentUsers: 100000
      },
      disclaimerText: { en: 'Disclaimer', ta: 'மறுப்பு' }
    },
    questions: {
      version: '1.0.0',
      hash: 'test-hash',
      questions: []
    },
    version: 'test-version',
    loadedAt: new Date().toISOString()
  };

  const testQuestions: QuestionBank = {
    version: '1.0.0',
    hash: 'test-hash',
    questions: [
      {
        id: 'q001',
        cluster: 'welfare',
        text: { en: 'Question 1', ta: 'கேள்வி 1' },
        options: [
          {
            id: 'q001_a',
            text: { en: 'Option A', ta: 'விருப்பம் A' },
            partyWeights: { DMK: 3, AIADMK: 5, TVK: 2 },
            axisWeights: { welfare: 4, economy: 1 }
          },
          {
            id: 'q001_b',
            text: { en: 'Option B', ta: 'விருப்பம் B' },
            partyWeights: { DMK: 5, AIADMK: 2, TVK: 4 },
            axisWeights: { welfare: 2, governance: 3 }
          }
        ]
      },
      {
        id: 'q002',
        cluster: 'economy',
        text: { en: 'Question 2', ta: 'கேள்வி 2' },
        options: [
          {
            id: 'q002_a',
            text: { en: 'Option A', ta: 'விருப்பம் A' },
            partyWeights: { DMK: 2, AIADMK: 3, TVK: 5 },
            axisWeights: { economy: 5, governance: 2 }
          },
          {
            id: 'q002_b',
            text: { en: 'Option B', ta: 'விருப்பம் B' },
            partyWeights: { DMK: 4, AIADMK: 4, TVK: 3 },
            axisWeights: { economy: 3, welfare: 3 }
          }
        ]
      }
    ]
  };

  describe('normalize', () => {
    it('should convert raw scores to percentages summing to 100', () => {
      const rawScores = { DMK: 5, AIADMK: 8, TVK: 7 };
      const normalized = engine.normalize(rawScores);

      // Total raw = 20
      // DMK: 5/20 * 100 = 25%
      // AIADMK: 8/20 * 100 = 40%
      // TVK: 7/20 * 100 = 35%
      expect(normalized.DMK).toBeCloseTo(25, 10);
      expect(normalized.AIADMK).toBeCloseTo(40, 10);
      expect(normalized.TVK).toBeCloseTo(35, 10);

      // Sum must equal exactly 100
      const sum = normalized.DMK + normalized.AIADMK + normalized.TVK;
      expect(sum).toBe(100);
    });

    it('should handle all zeros with equal split', () => {
      const rawScores = { DMK: 0, AIADMK: 0, TVK: 0 };
      const normalized = engine.normalize(rawScores);

      // Equal split: 100/3
      const expectedShare = 100 / 3;
      expect(normalized.DMK).toBeCloseTo(expectedShare, 10);
      expect(normalized.AIADMK).toBeCloseTo(expectedShare, 10);
      expect(normalized.TVK).toBeCloseTo(expectedShare, 10);

      // Sum must equal exactly 100
      const sum = normalized.DMK + normalized.AIADMK + normalized.TVK;
      expect(sum).toBe(100);
    });

    it('should work with N=2 parties', () => {
      const rawScores = { PARTY_A: 10, PARTY_B: 15 };
      const normalized = engine.normalize(rawScores);

      // Total = 25
      // PARTY_A: 10/25 * 100 = 40%
      // PARTY_B: 15/25 * 100 = 60%
      expect(normalized.PARTY_A).toBeCloseTo(40, 10);
      expect(normalized.PARTY_B).toBeCloseTo(60, 10);

      const sum = normalized.PARTY_A + normalized.PARTY_B;
      expect(sum).toBe(100);
    });

    it('should work with N=5 parties', () => {
      const rawScores = { P1: 10, P2: 20, P3: 30, P4: 25, P5: 15 };
      const normalized = engine.normalize(rawScores);

      // Total = 100
      // P1: 10%, P2: 20%, P3: 30%, P4: 25%, P5: 15%
      expect(normalized.P1).toBeCloseTo(10, 10);
      expect(normalized.P2).toBeCloseTo(20, 10);
      expect(normalized.P3).toBeCloseTo(30, 10);
      expect(normalized.P4).toBeCloseTo(25, 10);
      expect(normalized.P5).toBeCloseTo(15, 10);

      const sum = Object.values(normalized).reduce((acc, val) => acc + val, 0);
      expect(sum).toBe(100);
    });

    it('should handle single party', () => {
      const rawScores = { ONLY_PARTY: 42 };
      const normalized = engine.normalize(rawScores);

      // Single party gets 100%
      expect(normalized.ONLY_PARTY).toBe(100);
    });

    it('should handle single party with zero score', () => {
      const rawScores = { ONLY_PARTY: 0 };
      const normalized = engine.normalize(rawScores);

      // Single party with zero score gets 100% (equal split of 1)
      expect(normalized.ONLY_PARTY).toBe(100);
    });

    it('should handle very small raw scores', () => {
      const rawScores = { DMK: 0.001, AIADMK: 0.002, TVK: 0.003 };
      const normalized = engine.normalize(rawScores);

      // Total = 0.006
      // DMK: 0.001/0.006 * 100 ≈ 16.666...%
      // AIADMK: 0.002/0.006 * 100 ≈ 33.333...%
      // TVK: 0.003/0.006 * 100 = 50%
      expect(normalized.DMK).toBeCloseTo(16.666666666666668, 10);
      expect(normalized.AIADMK).toBeCloseTo(33.333333333333336, 10);
      expect(normalized.TVK).toBeCloseTo(50, 10);

      const sum = normalized.DMK + normalized.AIADMK + normalized.TVK;
      expect(sum).toBe(100);
    });

    it('should handle very large raw scores', () => {
      const rawScores = { DMK: 1000000, AIADMK: 2000000, TVK: 3000000 };
      const normalized = engine.normalize(rawScores);

      // Total = 6000000
      // DMK: 1/6 * 100 ≈ 16.666...%
      // AIADMK: 2/6 * 100 ≈ 33.333...%
      // TVK: 3/6 * 100 = 50%
      expect(normalized.DMK).toBeCloseTo(16.666666666666668, 10);
      expect(normalized.AIADMK).toBeCloseTo(33.333333333333336, 10);
      expect(normalized.TVK).toBeCloseTo(50, 10);

      const sum = normalized.DMK + normalized.AIADMK + normalized.TVK;
      expect(sum).toBe(100);
    });

    it('should handle one party with zero score among non-zero scores', () => {
      const rawScores = { DMK: 0, AIADMK: 10, TVK: 20 };
      const normalized = engine.normalize(rawScores);

      // Total = 30
      // DMK: 0/30 * 100 = 0%
      // AIADMK: 10/30 * 100 ≈ 33.333...%
      // TVK: 20/30 * 100 ≈ 66.666...%
      expect(normalized.DMK).toBe(0);
      expect(normalized.AIADMK).toBeCloseTo(33.333333333333336, 10);
      expect(normalized.TVK).toBeCloseTo(66.66666666666667, 10);

      const sum = normalized.DMK + normalized.AIADMK + normalized.TVK;
      expect(sum).toBe(100);
    });

    it('should handle equal raw scores', () => {
      const rawScores = { DMK: 10, AIADMK: 10, TVK: 10 };
      const normalized = engine.normalize(rawScores);

      // All equal → each gets 33.333...%
      expect(normalized.DMK).toBeCloseTo(33.333333333333336, 10);
      expect(normalized.AIADMK).toBeCloseTo(33.333333333333336, 10);
      expect(normalized.TVK).toBeCloseTo(33.333333333333336, 10);

      const sum = normalized.DMK + normalized.AIADMK + normalized.TVK;
      expect(sum).toBe(100);
    });

    it('should handle fractional raw scores', () => {
      const rawScores = { DMK: 1.5, AIADMK: 2.7, TVK: 3.8 };
      const normalized = engine.normalize(rawScores);

      // Total = 8.0
      // DMK: 1.5/8 * 100 = 18.75%
      // AIADMK: 2.7/8 * 100 = 33.75%
      // TVK: 3.8/8 * 100 = 47.5%
      expect(normalized.DMK).toBeCloseTo(18.75, 10);
      expect(normalized.AIADMK).toBeCloseTo(33.75, 10);
      expect(normalized.TVK).toBeCloseTo(47.5, 10);

      const sum = normalized.DMK + normalized.AIADMK + normalized.TVK;
      expect(sum).toBe(100);
    });

    it('should ensure sum equals exactly 100 with floating point edge case', () => {
      // This tests the rounding adjustment logic
      const rawScores = { DMK: 1, AIADMK: 1, TVK: 1 };
      const normalized = engine.normalize(rawScores);

      // Each should be 33.333...%, but we need to ensure sum = 100 exactly
      const sum = normalized.DMK + normalized.AIADMK + normalized.TVK;
      expect(sum).toBe(100);
    });

    it('should work with N=10 parties', () => {
      const rawScores = {
        P1: 5, P2: 10, P3: 15, P4: 20, P5: 25,
        P6: 30, P7: 35, P8: 40, P9: 45, P10: 50
      };
      const normalized = engine.normalize(rawScores);

      // Total = 275
      expect(normalized.P1).toBeCloseTo(5/275 * 100, 10);
      expect(normalized.P2).toBeCloseTo(10/275 * 100, 10);
      expect(normalized.P3).toBeCloseTo(15/275 * 100, 10);
      expect(normalized.P4).toBeCloseTo(20/275 * 100, 10);
      expect(normalized.P5).toBeCloseTo(25/275 * 100, 10);
      expect(normalized.P6).toBeCloseTo(30/275 * 100, 10);
      expect(normalized.P7).toBeCloseTo(35/275 * 100, 10);
      expect(normalized.P8).toBeCloseTo(40/275 * 100, 10);
      expect(normalized.P9).toBeCloseTo(45/275 * 100, 10);
      expect(normalized.P10).toBeCloseTo(50/275 * 100, 10);

      const sum = Object.values(normalized).reduce((acc, val) => acc + val, 0);
      expect(sum).toBe(100);
    });

    it('should preserve party IDs in output', () => {
      const rawScores = { DMK: 5, AIADMK: 8, TVK: 7 };
      const normalized = engine.normalize(rawScores);

      expect(normalized).toHaveProperty('DMK');
      expect(normalized).toHaveProperty('AIADMK');
      expect(normalized).toHaveProperty('TVK');
      expect(Object.keys(normalized)).toHaveLength(3);
    });

    it('should handle N=2 parties with all zeros', () => {
      const rawScores = { PARTY_A: 0, PARTY_B: 0 };
      const normalized = engine.normalize(rawScores);

      // Equal split: 50% each
      expect(normalized.PARTY_A).toBe(50);
      expect(normalized.PARTY_B).toBe(50);

      const sum = normalized.PARTY_A + normalized.PARTY_B;
      expect(sum).toBe(100);
    });

    it('should handle N=7 parties (realistic multi-party scenario)', () => {
      const rawScores = {
        P1: 12, P2: 18, P3: 25, P4: 8, P5: 15, P6: 10, P7: 22
      };
      const normalized = engine.normalize(rawScores);

      // Total = 110
      expect(normalized.P1).toBeCloseTo(12/110 * 100, 10);
      expect(normalized.P2).toBeCloseTo(18/110 * 100, 10);
      expect(normalized.P3).toBeCloseTo(25/110 * 100, 10);
      expect(normalized.P4).toBeCloseTo(8/110 * 100, 10);
      expect(normalized.P5).toBeCloseTo(15/110 * 100, 10);
      expect(normalized.P6).toBeCloseTo(10/110 * 100, 10);
      expect(normalized.P7).toBeCloseTo(22/110 * 100, 10);

      const sum = Object.values(normalized).reduce((acc, val) => acc + val, 0);
      expect(sum).toBe(100);
    });
  });

  describe('computeConfidence', () => {
    it('should return High confidence when gap exceeds high threshold (N=3)', () => {
      // N=3: High threshold = max(15, 100/3 - 18) = 15
      // Gap of 55 should be High
      const scores = { DMK: 70, AIADMK: 15, TVK: 15 };
      const result = engine.computeConfidence(scores);

      expect(result.level).toBe('High');
      expect(result.gap).toBe(55);
      expect(result.thresholds.high).toBeCloseTo(15.33, 1);
      expect(result.thresholds.medium).toBeCloseTo(5.33, 1);
    });

    it('should return Medium confidence when gap is between medium and high thresholds (N=3)', () => {
      // N=3: Medium threshold ≈ 5.33, High threshold ≈ 15.33
      // Gap of 10 should be Medium
      const scores = { DMK: 45, AIADMK: 35, TVK: 20 };
      const result = engine.computeConfidence(scores);

      expect(result.level).toBe('Medium');
      expect(result.gap).toBe(10);
      expect(result.thresholds.high).toBeCloseTo(15.33, 1);
      expect(result.thresholds.medium).toBeCloseTo(5.33, 1);
    });

    it('should return Low confidence when gap is below medium threshold (N=3)', () => {
      // N=3: Medium threshold ≈ 5.33
      // Gap of 2 should be Low
      const scores = { DMK: 35, AIADMK: 33, TVK: 32 };
      const result = engine.computeConfidence(scores);

      expect(result.level).toBe('Low');
      expect(result.gap).toBe(2);
      expect(result.thresholds.high).toBeCloseTo(15.33, 1);
      expect(result.thresholds.medium).toBeCloseTo(5.33, 1);
    });

    it('should work with N=2 parties', () => {
      // N=2: High threshold = max(15, 100/2 - 18) = max(15, 32) = 32
      // N=2: Medium threshold = max(5, 100/2 - 28) = max(5, 22) = 22
      const scores = { PARTY_A: 70, PARTY_B: 30 };
      const result = engine.computeConfidence(scores);

      expect(result.level).toBe('High');
      expect(result.gap).toBe(40);
      expect(result.thresholds.high).toBe(32);
      expect(result.thresholds.medium).toBe(22);
    });

    it('should work with N=5 parties', () => {
      // N=5: High threshold = max(15, 100/5 - 18) = max(15, 2) = 15
      // N=5: Medium threshold = max(5, 100/5 - 28) = max(5, -8) = 5
      const scores = { P1: 40, P2: 25, P3: 20, P4: 10, P5: 5 };
      const result = engine.computeConfidence(scores);

      expect(result.level).toBe('High');
      expect(result.gap).toBe(15);
      expect(result.thresholds.high).toBe(15);
      expect(result.thresholds.medium).toBe(5);
    });

    it('should work with N=10 parties', () => {
      // N=10: High threshold = max(15, 100/10 - 18) = max(15, -8) = 15
      // N=10: Medium threshold = max(5, 100/10 - 28) = max(5, -18) = 5
      const scores = {
        P1: 20, P2: 15, P3: 12, P4: 10, P5: 9,
        P6: 8, P7: 8, P8: 7, P9: 6, P10: 5
      };
      const result = engine.computeConfidence(scores);

      expect(result.level).toBe('Medium');
      expect(result.gap).toBe(5);
      expect(result.thresholds.high).toBe(15);
      expect(result.thresholds.medium).toBe(5);
    });

    it('should handle exact threshold boundary for High (N=3)', () => {
      // N=3: High threshold ≈ 15.33
      const highThreshold = Math.max(15, 100/3 - 18);
      const scores = { DMK: 50 + highThreshold/2, AIADMK: 50 - highThreshold/2, TVK: 0 };
      const result = engine.computeConfidence(scores);

      expect(result.level).toBe('High');
      expect(result.gap).toBeCloseTo(highThreshold, 10);
    });

    it('should handle exact threshold boundary for Medium (N=3)', () => {
      // N=3: Medium threshold ≈ 5.33
      const mediumThreshold = Math.max(5, 100/3 - 28);
      const scores = { DMK: 50 + mediumThreshold/2, AIADMK: 50 - mediumThreshold/2, TVK: 0 };
      const result = engine.computeConfidence(scores);

      expect(result.level).toBe('Medium');
      expect(result.gap).toBeCloseTo(mediumThreshold, 10);
    });

    it('should handle tie between top 2 parties (gap = 0)', () => {
      const scores = { DMK: 40, AIADMK: 40, TVK: 20 };
      const result = engine.computeConfidence(scores);

      expect(result.level).toBe('Low');
      expect(result.gap).toBe(0);
    });

    it('should handle single party edge case', () => {
      const scores = { ONLY_PARTY: 100 };
      const result = engine.computeConfidence(scores);

      expect(result.level).toBe('Low');
      expect(result.gap).toBe(0);
      expect(result.thresholds.high).toBe(0);
      expect(result.thresholds.medium).toBe(0);
    });

    it('should handle equal split (N=3)', () => {
      const scores = { DMK: 33.333333333333336, AIADMK: 33.333333333333336, TVK: 33.333333333333336 };
      const result = engine.computeConfidence(scores);

      expect(result.level).toBe('Low');
      expect(result.gap).toBeCloseTo(0, 10);
    });

    it('should handle equal split (N=2)', () => {
      const scores = { PARTY_A: 50, PARTY_B: 50 };
      const result = engine.computeConfidence(scores);

      expect(result.level).toBe('Low');
      expect(result.gap).toBe(0);
    });

    it('should correctly identify top 2 parties regardless of order in object', () => {
      // Object key order shouldn't matter
      const scores = { TVK: 20, DMK: 50, AIADMK: 30 };
      const result = engine.computeConfidence(scores);

      expect(result.gap).toBe(20); // 50 - 30 = 20
    });

    it('should handle very small gaps', () => {
      const scores = { DMK: 33.4, AIADMK: 33.3, TVK: 33.3 };
      const result = engine.computeConfidence(scores);

      expect(result.level).toBe('Low');
      expect(result.gap).toBeCloseTo(0.1, 10);
    });

    it('should handle very large gaps (N=3)', () => {
      const scores = { DMK: 90, AIADMK: 5, TVK: 5 };
      const result = engine.computeConfidence(scores);

      expect(result.level).toBe('High');
      expect(result.gap).toBe(85); // 90 - 5 = 85
    });

    it('should verify High > Medium > Low threshold ordering (N=2)', () => {
      const scores = { PARTY_A: 50, PARTY_B: 50 };
      const result = engine.computeConfidence(scores);

      expect(result.thresholds.high).toBeGreaterThan(result.thresholds.medium);
      expect(result.thresholds.medium).toBeGreaterThan(0);
    });

    it('should verify High > Medium > Low threshold ordering (N=5)', () => {
      const scores = { P1: 20, P2: 20, P3: 20, P4: 20, P5: 20 };
      const result = engine.computeConfidence(scores);

      expect(result.thresholds.high).toBeGreaterThan(result.thresholds.medium);
      expect(result.thresholds.medium).toBeGreaterThan(0);
    });

    it('should verify High > Medium > Low threshold ordering (N=10)', () => {
      const scores = {
        P1: 10, P2: 10, P3: 10, P4: 10, P5: 10,
        P6: 10, P7: 10, P8: 10, P9: 10, P10: 10
      };
      const result = engine.computeConfidence(scores);

      expect(result.thresholds.high).toBeGreaterThan(result.thresholds.medium);
      expect(result.thresholds.medium).toBeGreaterThan(0);
    });

    it('should handle N=2 with High confidence', () => {
      // N=2: High threshold = 62
      const scores = { PARTY_A: 85, PARTY_B: 15 };
      const result = engine.computeConfidence(scores);

      expect(result.level).toBe('High');
      expect(result.gap).toBe(70); // 85 - 15 = 70
    });

    it('should handle N=2 with Medium confidence', () => {
      // N=2: Medium threshold = 22, High threshold = 32
      // Gap of 26 should be Medium
      const scores = { PARTY_A: 63, PARTY_B: 37 };
      const result = engine.computeConfidence(scores);

      expect(result.level).toBe('Medium');
      expect(result.gap).toBe(26);
    });

    it('should handle N=5 with High confidence', () => {
      // N=5: High threshold = 15
      const scores = { P1: 50, P2: 15, P3: 15, P4: 10, P5: 10 };
      const result = engine.computeConfidence(scores);

      expect(result.level).toBe('High');
      expect(result.gap).toBe(35);
    });

    it('should handle N=5 with Medium confidence', () => {
      // N=5: Medium threshold = 5, High threshold = 15
      // Gap of 10 should be Medium
      const scores = { P1: 30, P2: 20, P3: 20, P4: 15, P5: 15 };
      const result = engine.computeConfidence(scores);

      expect(result.level).toBe('Medium');
      expect(result.gap).toBe(10);
    });

    it('should handle fractional scores', () => {
      const scores = { DMK: 35.7, AIADMK: 32.1, TVK: 32.2 };
      const result = engine.computeConfidence(scores);

      expect(result.gap).toBeCloseTo(3.5, 10); // 35.7 - 32.2 = 3.5
    });

    it('should handle winner with very small margin', () => {
      const scores = { DMK: 33.34, AIADMK: 33.33, TVK: 33.33 };
      const result = engine.computeConfidence(scores);

      expect(result.level).toBe('Low');
      expect(result.gap).toBeCloseTo(0.01, 10);
    });

    it('should handle N=7 parties (realistic multi-party scenario)', () => {
      // N=7: High threshold = max(15, 100/7 - 18) = max(15, -3.7) = 15
      // N=7: Medium threshold = max(5, 100/7 - 28) = max(5, -13.7) = 5
      const scores = { P1: 25, P2: 18, P3: 15, P4: 14, P5: 12, P6: 10, P7: 6 };
      const result = engine.computeConfidence(scores);

      expect(result.level).toBe('Medium');
      expect(result.gap).toBe(7);
      expect(result.thresholds.high).toBe(15);
      expect(result.thresholds.medium).toBe(5);
    });

    it('should return thresholds in result for transparency', () => {
      const scores = { DMK: 50, AIADMK: 30, TVK: 20 };
      const result = engine.computeConfidence(scores);

      expect(result.thresholds).toBeDefined();
      expect(result.thresholds.high).toBeDefined();
      expect(result.thresholds.medium).toBeDefined();
      expect(typeof result.thresholds.high).toBe('number');
      expect(typeof result.thresholds.medium).toBe('number');
    });

    it('should handle all parties with zero scores', () => {
      const scores = { DMK: 0, AIADMK: 0, TVK: 0 };
      const result = engine.computeConfidence(scores);

      expect(result.level).toBe('Low');
      expect(result.gap).toBe(0);
    });

    it('should handle one party with 100%, others with 0%', () => {
      const scores = { DMK: 100, AIADMK: 0, TVK: 0 };
      const result = engine.computeConfidence(scores);

      expect(result.level).toBe('High');
      expect(result.gap).toBe(100); // 100 - 0 = 100
    });

    it('should handle close three-way race', () => {
      const scores = { DMK: 34, AIADMK: 33, TVK: 33 };
      const result = engine.computeConfidence(scores);

      expect(result.level).toBe('Low');
      expect(result.gap).toBe(1); // 34 - 33 = 1
    });

    it('should handle two-way race with third party far behind', () => {
      const scores = { DMK: 48, AIADMK: 47, TVK: 5 };
      const result = engine.computeConfidence(scores);

      expect(result.level).toBe('Low');
      expect(result.gap).toBe(1); // 48 - 47 = 1
    });

    it('should correctly compute gap when 2nd and 3rd place are tied', () => {
      const scores = { DMK: 50, AIADMK: 25, TVK: 25 };
      const result = engine.computeConfidence(scores);

      expect(result.gap).toBe(25); // 50 - 25 = 25
    });

    it('should handle minimum N=2 requirement', () => {
      // N=2: High threshold = max(15, 100/2 - 18) = 32
      // N=2: Medium threshold = max(5, 100/2 - 28) = 22
      // Gap of 20 should be Low (below medium threshold of 22)
      const scores = { PARTY_A: 60, PARTY_B: 40 };
      const result = engine.computeConfidence(scores);

      expect(result.level).toBe('Low');
      expect(result.gap).toBe(20);
      expect(result.thresholds.high).toBe(32);
      expect(result.thresholds.medium).toBe(22);
    });
  });

  describe('compute', () => {
    it('should sum party weights across selected options', () => {
      const result = engine.compute(['q001_a', 'q002_a'], testQuestions, mockConfig);

      // q001_a: DMK=3, AIADMK=5, TVK=2
      // q002_a: DMK=2, AIADMK=3, TVK=5
      // Sum:    DMK=5, AIADMK=8, TVK=7
      expect(result.partyScores).toEqual({
        DMK: 5,
        AIADMK: 8,
        TVK: 7
      });
    });

    it('should sum axis weights across selected options', () => {
      const result = engine.compute(['q001_a', 'q002_a'], testQuestions, mockConfig);

      // q001_a: welfare=4, economy=1
      // q002_a: economy=5, governance=2
      // Sum:    welfare=4, economy=6, governance=2
      expect(result.axisScores).toEqual({
        welfare: 4,
        economy: 6,
        governance: 2
      });
    });

    it('should handle single option selection', () => {
      const result = engine.compute(['q001_b'], testQuestions, mockConfig);

      expect(result.partyScores).toEqual({
        DMK: 5,
        AIADMK: 2,
        TVK: 4
      });

      expect(result.axisScores).toEqual({
        welfare: 2,
        economy: 0,
        governance: 3
      });
    });

    it('should handle zero-input edge case with equal split', () => {
      const result = engine.compute([], testQuestions, mockConfig);

      // 3 active parties: DMK, AIADMK, TVK
      // Equal split: 100/3 ≈ 33.333...
      const expectedShare = 100 / 3;

      expect(result.partyScores.DMK).toBeCloseTo(expectedShare, 5);
      expect(result.partyScores.AIADMK).toBeCloseTo(expectedShare, 5);
      expect(result.partyScores.TVK).toBeCloseTo(expectedShare, 5);

      // All axis scores should be 0
      expect(result.axisScores).toEqual({
        welfare: 0,
        economy: 0,
        governance: 0
      });
    });

    it('should only include active parties in scores', () => {
      const result = engine.compute(['q001_a'], testQuestions, mockConfig);

      // Should have scores for DMK, AIADMK, TVK (active)
      expect(result.partyScores).toHaveProperty('DMK');
      expect(result.partyScores).toHaveProperty('AIADMK');
      expect(result.partyScores).toHaveProperty('TVK');

      // Should NOT have score for INACTIVE party
      expect(result.partyScores).not.toHaveProperty('INACTIVE');
    });

    it('should initialize all axes to 0 even if not mentioned in options', () => {
      const result = engine.compute(['q001_a'], testQuestions, mockConfig);

      // q001_a only has welfare and economy weights
      // governance should still be present with value 0
      expect(result.axisScores).toHaveProperty('governance');
      expect(result.axisScores.governance).toBe(0);
    });

    it('should handle multiple selections with different weight combinations', () => {
      const result = engine.compute(['q001_a', 'q001_b', 'q002_b'], testQuestions, mockConfig);

      // q001_a: DMK=3, AIADMK=5, TVK=2
      // q001_b: DMK=5, AIADMK=2, TVK=4
      // q002_b: DMK=4, AIADMK=4, TVK=3
      // Sum:    DMK=12, AIADMK=11, TVK=9
      expect(result.partyScores).toEqual({
        DMK: 12,
        AIADMK: 11,
        TVK: 9
      });

      // q001_a: welfare=4, economy=1
      // q001_b: welfare=2, governance=3
      // q002_b: economy=3, welfare=3
      // Sum:    welfare=9, economy=4, governance=3
      expect(result.axisScores).toEqual({
        welfare: 9,
        economy: 4,
        governance: 3
      });
    });

    it('should work with N=2 parties', () => {
      const twoPartyConfig: ConfigBundle = {
        ...mockConfig,
        parties: {
          ...mockConfig.parties,
          parties: [
            { id: 'PARTY_A', names: { en: 'A', ta: 'அ' }, fullNames: { en: 'A', ta: 'அ' }, governanceStatus: 'incumbent', weightBasis: 'track-record', manifestoVersion: 'v1', active: true },
            { id: 'PARTY_B', names: { en: 'B', ta: 'ஆ' }, fullNames: { en: 'B', ta: 'ஆ' }, governanceStatus: 'incumbent', weightBasis: 'track-record', manifestoVersion: 'v1', active: true }
          ]
        }
      };

      const result = engine.compute([], testQuestions, twoPartyConfig);

      // Equal split: 100/2 = 50
      expect(result.partyScores.PARTY_A).toBe(50);
      expect(result.partyScores.PARTY_B).toBe(50);
    });

    it('should work with N=5 parties', () => {
      const fivePartyConfig: ConfigBundle = {
        ...mockConfig,
        parties: {
          ...mockConfig.parties,
          parties: [
            { id: 'P1', names: { en: 'P1', ta: 'P1' }, fullNames: { en: 'P1', ta: 'P1' }, governanceStatus: 'incumbent', weightBasis: 'track-record', manifestoVersion: 'v1', active: true },
            { id: 'P2', names: { en: 'P2', ta: 'P2' }, fullNames: { en: 'P2', ta: 'P2' }, governanceStatus: 'incumbent', weightBasis: 'track-record', manifestoVersion: 'v1', active: true },
            { id: 'P3', names: { en: 'P3', ta: 'P3' }, fullNames: { en: 'P3', ta: 'P3' }, governanceStatus: 'incumbent', weightBasis: 'track-record', manifestoVersion: 'v1', active: true },
            { id: 'P4', names: { en: 'P4', ta: 'P4' }, fullNames: { en: 'P4', ta: 'P4' }, governanceStatus: 'incumbent', weightBasis: 'track-record', manifestoVersion: 'v1', active: true },
            { id: 'P5', names: { en: 'P5', ta: 'P5' }, fullNames: { en: 'P5', ta: 'P5' }, governanceStatus: 'incumbent', weightBasis: 'track-record', manifestoVersion: 'v1', active: true }
          ]
        }
      };

      const result = engine.compute([], testQuestions, fivePartyConfig);

      // Equal split: 100/5 = 20
      expect(result.partyScores.P1).toBe(20);
      expect(result.partyScores.P2).toBe(20);
      expect(result.partyScores.P3).toBe(20);
      expect(result.partyScores.P4).toBe(20);
      expect(result.partyScores.P5).toBe(20);
    });

    it('should return raw scores, not normalized', () => {
      const result = engine.compute(['q001_a', 'q002_a'], testQuestions, mockConfig);

      // Raw scores should be the sum of weights, not percentages
      expect(result.partyScores.DMK).toBe(5);
      expect(result.partyScores.AIADMK).toBe(8);
      expect(result.partyScores.TVK).toBe(7);

      // Sum should NOT equal 100 (that would be normalized)
      const sum = result.partyScores.DMK + result.partyScores.AIADMK + result.partyScores.TVK;
      expect(sum).toBe(20);
      expect(sum).not.toBe(100);
    });

    it('should throw error for invalid option ID', () => {
      expect(() => engine.compute(['invalid_option'], testQuestions, mockConfig)).toThrow(
        /Option with ID "invalid_option" not found/
      );
    });

    it('should handle all options from same question', () => {
      const result = engine.compute(['q001_a', 'q001_b'], testQuestions, mockConfig);

      // q001_a: DMK=3, AIADMK=5, TVK=2
      // q001_b: DMK=5, AIADMK=2, TVK=4
      // Sum:    DMK=8, AIADMK=7, TVK=6
      expect(result.partyScores).toEqual({
        DMK: 8,
        AIADMK: 7,
        TVK: 6
      });
    });

    it('should handle weights of 0', () => {
      const zeroWeightQuestions: QuestionBank = {
        version: '1.0.0',
        hash: 'test-hash',
        questions: [
          {
            id: 'q003',
            cluster: 'test',
            text: { en: 'Question 3', ta: 'கேள்வி 3' },
            options: [
              {
                id: 'q003_a',
                text: { en: 'Option A', ta: 'விருப்பம் A' },
                partyWeights: { DMK: 0, AIADMK: 0, TVK: 5 },
                axisWeights: { welfare: 0, economy: 0, governance: 3 }
              }
            ]
          }
        ]
      };

      const result = engine.compute(['q003_a'], zeroWeightQuestions, mockConfig);

      expect(result.partyScores).toEqual({
        DMK: 0,
        AIADMK: 0,
        TVK: 5
      });

      expect(result.axisScores).toEqual({
        welfare: 0,
        economy: 0,
        governance: 3
      });
    });
  });
});
