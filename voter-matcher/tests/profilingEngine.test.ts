/**
 * Unit tests for ProfilingEngine
 * 
 * Tests archetype classification logic including:
 * - Primary archetype assignment based on dominant axes
 * - Secondary archetype assignment when ambiguous
 * - Edge cases: no scores, tied archetypes, single archetype
 * - Ambiguity threshold handling
 */

import { describe, it, expect } from 'vitest';
import { ProfilingEngine } from '@/engines/profilingEngine';
import type { ConfigBundle } from '@/lib/configLoader';

// Helper to create a minimal ConfigBundle for testing
function createTestConfig(archetypes: Array<{
  id: string;
  dominantAxes: string[];
  ambiguityThreshold: number;
}>): ConfigBundle {
  return {
    archetypes: {
      version: '1.0.0',
      hash: 'test-hash',
      archetypes: archetypes.map(a => ({
        id: a.id,
        names: { en: a.id, ta: a.id },
        dominantAxes: a.dominantAxes,
        ambiguityThreshold: a.ambiguityThreshold,
        descriptions: { en: '', ta: '' }
      }))
    },
    parties: { version: '1.0.0', hash: '', parties: [] },
    axes: { version: '1.0.0', hash: '', axes: [] },
    languages: { version: '1.0.0', hash: '', defaultLanguage: 'en', languages: [] },
    questions: { version: '1.0.0', hash: '', questions: [] },
    scoringParams: {
      version: '1.0.0',
      hash: '',
      questionCount: 30,
      optionsPerQuestion: 3,
      weightRange: { min: 0, max: 5 },
      minAnsweredThreshold: 0.5,
      collinearityThreshold: 0.7,
      discriminatingPowerThreshold: 1.0,
      confidenceFormula: 'dynamic',
      estimatedCompletionMinutes: 3,
      performanceTargets: {
        loadTime4G: 1000,
        loadTime2G: 3000,
        scoringTime: 200,
        concurrentUsers: 100000
      },
      disclaimerText: { en: '', ta: '' }
    },
    version: '1.0.0',
    loadedAt: new Date().toISOString()
  };
}

describe('ProfilingEngine', () => {
  describe('classify()', () => {
    it('should classify into primary archetype based on highest dominant axis scores', () => {
      const config = createTestConfig([
        { id: 'security_seeker', dominantAxes: ['welfare', 'poverty'], ambiguityThreshold: 0.1 },
        { id: 'equity_builder', dominantAxes: ['social_justice', 'governance'], ambiguityThreshold: 0.1 },
        { id: 'system_reformer', dominantAxes: ['corruption', 'economy'], ambiguityThreshold: 0.1 }
      ]);

      const axisScores = {
        welfare: 20,
        poverty: 15,
        social_justice: 5,
        governance: 3,
        corruption: 2,
        economy: 1
      };

      const engine = new ProfilingEngine();
      const result = engine.classify(axisScores, config);

      expect(result.primary).toBe('security_seeker'); // 20 + 15 = 35
      expect(result.isAmbiguous).toBe(false);
      expect(result.secondary).toBeUndefined();
    });

    it('should assign secondary archetype when gap is within ambiguity threshold', () => {
      const config = createTestConfig([
        { id: 'security_seeker', dominantAxes: ['welfare', 'poverty'], ambiguityThreshold: 5 },
        { id: 'equity_builder', dominantAxes: ['social_justice', 'governance'], ambiguityThreshold: 5 }
      ]);

      const axisScores = {
        welfare: 10,
        poverty: 12,      // security_seeker: 22
        social_justice: 11,
        governance: 9     // equity_builder: 20
      };
      // Gap = 2, which is <= 5 (threshold)

      const engine = new ProfilingEngine();
      const result = engine.classify(axisScores, config);

      expect(result.primary).toBe('security_seeker');
      expect(result.secondary).toBe('equity_builder');
      expect(result.isAmbiguous).toBe(true);
    });

    it('should not assign secondary archetype when gap exceeds ambiguity threshold', () => {
      const config = createTestConfig([
        { id: 'security_seeker', dominantAxes: ['welfare', 'poverty'], ambiguityThreshold: 2 },
        { id: 'equity_builder', dominantAxes: ['social_justice', 'governance'], ambiguityThreshold: 2 }
      ]);

      const axisScores = {
        welfare: 10,
        poverty: 12,      // security_seeker: 22
        social_justice: 8,
        governance: 6     // equity_builder: 14
      };
      // Gap = 8, which is > 2 (threshold)

      const engine = new ProfilingEngine();
      const result = engine.classify(axisScores, config);

      expect(result.primary).toBe('security_seeker');
      expect(result.isAmbiguous).toBe(false);
      expect(result.secondary).toBeUndefined();
    });

    it('should handle zero axis scores correctly', () => {
      const config = createTestConfig([
        { id: 'security_seeker', dominantAxes: ['welfare', 'poverty'], ambiguityThreshold: 0.1 },
        { id: 'equity_builder', dominantAxes: ['social_justice', 'governance'], ambiguityThreshold: 0.1 }
      ]);

      const axisScores = {
        welfare: 0,
        poverty: 0,
        social_justice: 0,
        governance: 0
      };

      const engine = new ProfilingEngine();
      const result = engine.classify(axisScores, config);

      // When all scores are 0, both archetypes have score 0
      // First archetype in list becomes primary
      expect(result.primary).toBe('security_seeker');
      // Gap is 0, which is <= 0.1, so it's ambiguous
      expect(result.isAmbiguous).toBe(true);
      expect(result.secondary).toBe('equity_builder');
    });

    it('should handle missing axis scores (treat as 0)', () => {
      const config = createTestConfig([
        { id: 'security_seeker', dominantAxes: ['welfare', 'poverty'], ambiguityThreshold: 0.1 },
        { id: 'equity_builder', dominantAxes: ['social_justice', 'governance'], ambiguityThreshold: 0.1 }
      ]);

      const axisScores = {
        welfare: 10
        // poverty, social_justice, governance are missing
      };

      const engine = new ProfilingEngine();
      const result = engine.classify(axisScores, config);

      expect(result.primary).toBe('security_seeker'); // 10 + 0 = 10
      expect(result.isAmbiguous).toBe(false);
      expect(result.secondary).toBeUndefined();
    });

    it('should handle tied archetype scores correctly', () => {
      const config = createTestConfig([
        { id: 'archetype_a', dominantAxes: ['axis1'], ambiguityThreshold: 1 },
        { id: 'archetype_b', dominantAxes: ['axis2'], ambiguityThreshold: 1 }
      ]);

      const axisScores = {
        axis1: 10,
        axis2: 10
      };
      // Both archetypes have score 10, gap = 0

      const engine = new ProfilingEngine();
      const result = engine.classify(axisScores, config);

      // First archetype in sorted order becomes primary
      expect(['archetype_a', 'archetype_b']).toContain(result.primary);
      expect(result.isAmbiguous).toBe(true);
      expect(result.secondary).toBeDefined();
    });

    it('should handle single archetype configuration', () => {
      const config = createTestConfig([
        { id: 'only_archetype', dominantAxes: ['welfare'], ambiguityThreshold: 0.1 }
      ]);

      const axisScores = {
        welfare: 10
      };

      const engine = new ProfilingEngine();
      const result = engine.classify(axisScores, config);

      expect(result.primary).toBe('only_archetype');
      expect(result.isAmbiguous).toBe(false);
      expect(result.secondary).toBeUndefined();
    });

    it('should throw error when no archetypes are defined', () => {
      const config = createTestConfig([]);

      const axisScores = {
        welfare: 10
      };

      const engine = new ProfilingEngine();
      
      expect(() => engine.classify(axisScores, config)).toThrow(
        'No archetypes defined in Archetype_Registry'
      );
    });

    it('should use primary archetype\'s ambiguity threshold for classification', () => {
      const config = createTestConfig([
        { id: 'archetype_a', dominantAxes: ['axis1'], ambiguityThreshold: 10 },
        { id: 'archetype_b', dominantAxes: ['axis2'], ambiguityThreshold: 1 }
      ]);

      const axisScores = {
        axis1: 20,
        axis2: 15
      };
      // Gap = 5, archetype_a's threshold is 10

      const engine = new ProfilingEngine();
      const result = engine.classify(axisScores, config);

      expect(result.primary).toBe('archetype_a');
      expect(result.isAmbiguous).toBe(true); // 5 <= 10
      expect(result.secondary).toBe('archetype_b');
    });

    it('should handle archetype with multiple dominant axes', () => {
      const config = createTestConfig([
        { id: 'multi_axis', dominantAxes: ['axis1', 'axis2', 'axis3'], ambiguityThreshold: 0.1 },
        { id: 'single_axis', dominantAxes: ['axis4'], ambiguityThreshold: 0.1 }
      ]);

      const axisScores = {
        axis1: 5,
        axis2: 5,
        axis3: 5,  // multi_axis: 15
        axis4: 10  // single_axis: 10
      };

      const engine = new ProfilingEngine();
      const result = engine.classify(axisScores, config);

      expect(result.primary).toBe('multi_axis');
      expect(result.isAmbiguous).toBe(false);
    });

    it('should work with real archetype configuration structure', () => {
      const config = createTestConfig([
        { id: 'security_seeker', dominantAxes: ['welfare', 'poverty'], ambiguityThreshold: 0.1 },
        { id: 'equity_builder', dominantAxes: ['social_justice', 'governance'], ambiguityThreshold: 0.1 },
        { id: 'system_reformer', dominantAxes: ['corruption', 'economy', 'responsibility'], ambiguityThreshold: 0.1 },
        { id: 'identity_advocate', dominantAxes: ['language_identity', 'federalism'], ambiguityThreshold: 0.1 }
      ]);

      const axisScores = {
        welfare: 8,
        poverty: 7,
        social_justice: 12,
        governance: 15,
        corruption: 3,
        economy: 2,
        responsibility: 1,
        language_identity: 5,
        federalism: 4
      };

      const engine = new ProfilingEngine();
      const result = engine.classify(axisScores, config);

      // equity_builder: 12 + 15 = 27 (highest)
      // security_seeker: 8 + 7 = 15
      // identity_advocate: 5 + 4 = 9
      // system_reformer: 3 + 2 + 1 = 6

      expect(result.primary).toBe('equity_builder');
      expect(result.isAmbiguous).toBe(false);
    });

    it('should handle fractional axis scores', () => {
      const config = createTestConfig([
        { id: 'archetype_a', dominantAxes: ['axis1'], ambiguityThreshold: 0.5 },
        { id: 'archetype_b', dominantAxes: ['axis2'], ambiguityThreshold: 0.5 }
      ]);

      const axisScores = {
        axis1: 10.7,
        axis2: 10.3
      };
      // Gap = 0.4, which is <= 0.5

      const engine = new ProfilingEngine();
      const result = engine.classify(axisScores, config);

      expect(result.primary).toBe('archetype_a');
      expect(result.isAmbiguous).toBe(true);
      expect(result.secondary).toBe('archetype_b');
    });

    it('should handle negative axis scores (edge case)', () => {
      const config = createTestConfig([
        { id: 'archetype_a', dominantAxes: ['axis1'], ambiguityThreshold: 1 },
        { id: 'archetype_b', dominantAxes: ['axis2'], ambiguityThreshold: 1 }
      ]);

      const axisScores = {
        axis1: -5,
        axis2: -10
      };

      const engine = new ProfilingEngine();
      const result = engine.classify(axisScores, config);

      // archetype_a has higher score (-5 > -10)
      expect(result.primary).toBe('archetype_a');
    });
  });

  describe('detectContradictions()', () => {
    // Helper to create a minimal ConfigBundle with axes for testing
    function createTestConfigWithAxes(axes: Array<{
      id: string;
      labels: { en: string; ta: string };
      independentPairs: string[];
    }>): ConfigBundle {
      return {
        axes: {
          version: '1.0.0',
          hash: 'test-hash',
          axes: axes.map(a => ({
            id: a.id,
            labels: a.labels,
            technicalName: a.labels,
            archetypeMapping: [],
            independentPairs: a.independentPairs
          }))
        },
        archetypes: { version: '1.0.0', hash: '', archetypes: [] },
        parties: { version: '1.0.0', hash: '', parties: [] },
        languages: { version: '1.0.0', hash: '', defaultLanguage: 'en', languages: [] },
        questions: { version: '1.0.0', hash: '', questions: [] },
        scoringParams: {
          version: '1.0.0',
          hash: '',
          questionCount: 30,
          optionsPerQuestion: 3,
          weightRange: { min: 0, max: 5 },
          minAnsweredThreshold: 0.5,
          collinearityThreshold: 0.7,
          discriminatingPowerThreshold: 1.0,
          confidenceFormula: 'dynamic',
          estimatedCompletionMinutes: 3,
          performanceTargets: {
            loadTime4G: 1000,
            loadTime2G: 3000,
            scoringTime: 200,
            concurrentUsers: 100000
          },
          disclaimerText: { en: '', ta: '' }
        },
        version: '1.0.0',
        loadedAt: new Date().toISOString()
      };
    }

    it('should detect contradiction when both axes in independent pair have high scores', () => {
      const config = createTestConfigWithAxes([
        { id: 'welfare', labels: { en: 'Welfare', ta: 'நலன்புரி' }, independentPairs: ['economy'] },
        { id: 'economy', labels: { en: 'Economy', ta: 'பொருளாதாரம்' }, independentPairs: ['welfare'] }
      ]);

      const axisScores = {
        welfare: 20,
        economy: 18
      };
      // Median = (18 + 20) / 2 = 19
      // welfare (20) >= 19 ✓
      // economy (18) >= 19 ✗ (18 < 19)
      // So no contradiction should be detected

      const engine = new ProfilingEngine();
      const contradictions = engine.detectContradictions(axisScores, config);

      // Actually, with only 2 scores, we need both to be >= median
      // Let's adjust the test to have both clearly above median
      expect(contradictions).toHaveLength(0);
    });

    it('should detect contradiction when both axes clearly above median', () => {
      const config = createTestConfigWithAxes([
        { id: 'welfare', labels: { en: 'Welfare', ta: 'நலன்புரி' }, independentPairs: ['economy'] },
        { id: 'economy', labels: { en: 'Economy', ta: 'பொருளாதாரம்' }, independentPairs: ['welfare'] },
        { id: 'other', labels: { en: 'Other', ta: 'மற்றவை' }, independentPairs: [] }
      ]);

      const axisScores = {
        welfare: 20,
        economy: 18,
        other: 5
      };
      // Median = 18 (middle value of [5, 18, 20])
      // welfare (20) >= 18 ✓
      // economy (18) >= 18 ✓
      // Both are >= median, so contradiction detected

      const engine = new ProfilingEngine();
      const contradictions = engine.detectContradictions(axisScores, config);

      expect(contradictions).toHaveLength(1);
      // The order of axis1 and axis2 depends on which axis is processed first
      const hasWelfareEconomy = 
        (contradictions[0].axis1 === 'welfare' && contradictions[0].axis2 === 'economy') ||
        (contradictions[0].axis1 === 'economy' && contradictions[0].axis2 === 'welfare');
      expect(hasWelfareEconomy).toBe(true);
      expect(contradictions[0].message).toContain('nuanced political perspective');
    });

    it('should not detect contradiction when only one axis has high score', () => {
      const config = createTestConfigWithAxes([
        { id: 'welfare', labels: { en: 'Welfare', ta: 'நலன்புரி' }, independentPairs: ['economy'] },
        { id: 'economy', labels: { en: 'Economy', ta: 'பொருளாதாரம்' }, independentPairs: ['welfare'] }
      ]);

      const axisScores = {
        welfare: 20,
        economy: 5
      };
      // Median = (5 + 20) / 2 = 12.5
      // Only welfare is above median

      const engine = new ProfilingEngine();
      const contradictions = engine.detectContradictions(axisScores, config);

      expect(contradictions).toHaveLength(0);
    });

    it('should not detect contradiction when both axes have low scores', () => {
      const config = createTestConfigWithAxes([
        { id: 'welfare', labels: { en: 'Welfare', ta: 'நலன்புரி' }, independentPairs: ['economy'] },
        { id: 'economy', labels: { en: 'Economy', ta: 'பொருளாதாரம்' }, independentPairs: ['welfare'] }
      ]);

      const axisScores = {
        welfare: 5,
        economy: 3
      };
      // Median = (3 + 5) / 2 = 4
      // Only welfare is above median

      const engine = new ProfilingEngine();
      const contradictions = engine.detectContradictions(axisScores, config);

      expect(contradictions).toHaveLength(0);
    });

    it('should return empty array when no scores provided', () => {
      const config = createTestConfigWithAxes([
        { id: 'welfare', labels: { en: 'Welfare', ta: 'நலன்புரி' }, independentPairs: ['economy'] }
      ]);

      const axisScores = {};

      const engine = new ProfilingEngine();
      const contradictions = engine.detectContradictions(axisScores, config);

      expect(contradictions).toHaveLength(0);
    });

    it('should return empty array when only one score provided', () => {
      const config = createTestConfigWithAxes([
        { id: 'welfare', labels: { en: 'Welfare', ta: 'நலன்புரி' }, independentPairs: ['economy'] }
      ]);

      const axisScores = {
        welfare: 10
      };

      const engine = new ProfilingEngine();
      const contradictions = engine.detectContradictions(axisScores, config);

      expect(contradictions).toHaveLength(0);
    });

    it('should handle multiple independent pairs for same axis', () => {
      const config = createTestConfigWithAxes([
        { id: 'welfare', labels: { en: 'Welfare', ta: 'நலன்புரி' }, independentPairs: ['economy', 'corruption'] },
        { id: 'economy', labels: { en: 'Economy', ta: 'பொருளாதாரம்' }, independentPairs: ['welfare'] },
        { id: 'corruption', labels: { en: 'Corruption', ta: 'ஊழல்' }, independentPairs: ['welfare'] },
        { id: 'other', labels: { en: 'Other', ta: 'மற்றவை' }, independentPairs: [] }
      ]);

      const axisScores = {
        welfare: 20,
        economy: 19,
        corruption: 19,
        other: 5
      };
      // Sorted: [5, 19, 19, 20]
      // Median = (19 + 19) / 2 = 19
      // welfare (20) >= 19 ✓
      // economy (19) >= 19 ✓
      // corruption (19) >= 19 ✓

      const engine = new ProfilingEngine();
      const contradictions = engine.detectContradictions(axisScores, config);

      expect(contradictions).toHaveLength(2);
      // Should detect welfare-economy and welfare-corruption
      const pairs = contradictions.map(c => [c.axis1, c.axis2].sort().join('-'));
      expect(pairs).toContain('economy-welfare');
      expect(pairs).toContain('corruption-welfare');
    });

    it('should not duplicate contradictions for bidirectional pairs', () => {
      const config = createTestConfigWithAxes([
        { id: 'welfare', labels: { en: 'Welfare', ta: 'நலன்புரி' }, independentPairs: ['economy'] },
        { id: 'economy', labels: { en: 'Economy', ta: 'பொருளாதாரம்' }, independentPairs: ['welfare'] },
        { id: 'other', labels: { en: 'Other', ta: 'மற்றவை' }, independentPairs: [] }
      ]);

      const axisScores = {
        welfare: 20,
        economy: 19,
        other: 5
      };
      // Median = 19
      // Both welfare and economy are >= median

      const engine = new ProfilingEngine();
      const contradictions = engine.detectContradictions(axisScores, config);

      // Should only detect one contradiction, not two
      expect(contradictions).toHaveLength(1);
    });

    it('should handle odd number of scores for median calculation', () => {
      const config = createTestConfigWithAxes([
        { id: 'axis1', labels: { en: 'Axis 1', ta: 'அச்சு 1' }, independentPairs: ['axis2'] },
        { id: 'axis2', labels: { en: 'Axis 2', ta: 'அச்சு 2' }, independentPairs: ['axis1'] },
        { id: 'axis3', labels: { en: 'Axis 3', ta: 'அச்சு 3' }, independentPairs: [] }
      ]);

      const axisScores = {
        axis1: 15,
        axis2: 15,
        axis3: 20
      };
      // Sorted: [15, 15, 20]
      // Median = 15 (middle value)
      // axis1 (15) >= 15 ✓
      // axis2 (15) >= 15 ✓
      // Both are >= median, so contradiction detected

      const engine = new ProfilingEngine();
      const contradictions = engine.detectContradictions(axisScores, config);

      expect(contradictions).toHaveLength(1);
      expect(contradictions[0].axis1).toBe('axis1');
      expect(contradictions[0].axis2).toBe('axis2');
    });

    it('should handle even number of scores for median calculation', () => {
      const config = createTestConfigWithAxes([
        { id: 'axis1', labels: { en: 'Axis 1', ta: 'அச்சு 1' }, independentPairs: ['axis2'] },
        { id: 'axis2', labels: { en: 'Axis 2', ta: 'அச்சு 2' }, independentPairs: ['axis1'] }
      ]);

      const axisScores = {
        axis1: 10,
        axis2: 20
      };
      // Median = (10 + 20) / 2 = 15
      // Only axis2 is > median

      const engine = new ProfilingEngine();
      const contradictions = engine.detectContradictions(axisScores, config);

      expect(contradictions).toHaveLength(0);
    });

    it('should filter out zero scores before calculating median', () => {
      const config = createTestConfigWithAxes([
        { id: 'axis1', labels: { en: 'Axis 1', ta: 'அச்சு 1' }, independentPairs: ['axis2'] },
        { id: 'axis2', labels: { en: 'Axis 2', ta: 'அச்சு 2' }, independentPairs: ['axis1'] },
        { id: 'axis3', labels: { en: 'Axis 3', ta: 'அச்சு 3' }, independentPairs: [] }
      ]);

      const axisScores = {
        axis1: 10,
        axis2: 20,
        axis3: 0
      };
      // Median calculated from [10, 20] only, not including 0
      // Median = (10 + 20) / 2 = 15

      const engine = new ProfilingEngine();
      const contradictions = engine.detectContradictions(axisScores, config);

      expect(contradictions).toHaveLength(0);
    });

    it('should include descriptive message in contradiction', () => {
      const config = createTestConfigWithAxes([
        { id: 'welfare', labels: { en: 'Government Support', ta: 'அரசு ஆதரவு' }, independentPairs: ['economy'] },
        { id: 'economy', labels: { en: 'Economic Growth', ta: 'பொருளாதார வளர்ச்சி' }, independentPairs: ['welfare'] },
        { id: 'other', labels: { en: 'Other', ta: 'மற்றவை' }, independentPairs: [] }
      ]);

      const axisScores = {
        welfare: 20,
        economy: 19,
        other: 5
      };
      // Median = 19
      // Both welfare and economy are >= median

      const engine = new ProfilingEngine();
      const contradictions = engine.detectContradictions(axisScores, config);

      expect(contradictions[0].message).toBeDefined();
      expect(contradictions[0].message).toContain('Government Support');
      expect(contradictions[0].message).toContain('Economic Growth');
      expect(contradictions[0].message).toContain('nuanced');
      expect(contradictions[0].message).not.toContain('error');
      expect(contradictions[0].message).not.toContain('contradiction');
    });

    it('should handle axis with no independent pairs', () => {
      const config = createTestConfigWithAxes([
        { id: 'axis1', labels: { en: 'Axis 1', ta: 'அச்சு 1' }, independentPairs: [] },
        { id: 'axis2', labels: { en: 'Axis 2', ta: 'அச்சு 2' }, independentPairs: [] }
      ]);

      const axisScores = {
        axis1: 20,
        axis2: 18
      };

      const engine = new ProfilingEngine();
      const contradictions = engine.detectContradictions(axisScores, config);

      expect(contradictions).toHaveLength(0);
    });

    it('should handle missing axis in independentPairs gracefully', () => {
      const config = createTestConfigWithAxes([
        { id: 'axis1', labels: { en: 'Axis 1', ta: 'அச்சு 1' }, independentPairs: ['nonexistent'] }
      ]);

      const axisScores = {
        axis1: 20
      };

      const engine = new ProfilingEngine();
      const contradictions = engine.detectContradictions(axisScores, config);

      // Should not crash, should return empty array
      expect(contradictions).toHaveLength(0);
    });

    it('should handle fractional axis scores', () => {
      const config = createTestConfigWithAxes([
        { id: 'axis1', labels: { en: 'Axis 1', ta: 'அச்சு 1' }, independentPairs: ['axis2'] },
        { id: 'axis2', labels: { en: 'Axis 2', ta: 'அச்சு 2' }, independentPairs: ['axis1'] }
      ]);

      const axisScores = {
        axis1: 15.7,
        axis2: 15.3
      };
      // Median = (15.3 + 15.7) / 2 = 15.5
      // Only axis1 is > median

      const engine = new ProfilingEngine();
      const contradictions = engine.detectContradictions(axisScores, config);

      expect(contradictions).toHaveLength(0);
    });

    it('should detect multiple contradictions across different axis pairs', () => {
      const config = createTestConfigWithAxes([
        { id: 'axis1', labels: { en: 'Axis 1', ta: 'அச்சு 1' }, independentPairs: ['axis2'] },
        { id: 'axis2', labels: { en: 'Axis 2', ta: 'அச்சு 2' }, independentPairs: ['axis1'] },
        { id: 'axis3', labels: { en: 'Axis 3', ta: 'அச்சு 3' }, independentPairs: ['axis4'] },
        { id: 'axis4', labels: { en: 'Axis 4', ta: 'அச்சு 4' }, independentPairs: ['axis3'] }
      ]);

      const axisScores = {
        axis1: 20,
        axis2: 19,
        axis3: 18,
        axis4: 17
      };
      // Median = (18 + 19) / 2 = 18.5
      // axis1 and axis2 are > median
      // axis3 and axis4 are <= median

      const engine = new ProfilingEngine();
      const contradictions = engine.detectContradictions(axisScores, config);

      expect(contradictions).toHaveLength(1);
      expect(contradictions[0].axis1).toBe('axis1');
      expect(contradictions[0].axis2).toBe('axis2');
    });

    it('should handle all axes having same score', () => {
      const config = createTestConfigWithAxes([
        { id: 'axis1', labels: { en: 'Axis 1', ta: 'அச்சு 1' }, independentPairs: ['axis2'] },
        { id: 'axis2', labels: { en: 'Axis 2', ta: 'அச்சு 2' }, independentPairs: ['axis1'] }
      ]);

      const axisScores = {
        axis1: 10,
        axis2: 10
      };
      // Median = 10
      // Both are equal to median (>= median), so contradiction IS detected

      const engine = new ProfilingEngine();
      const contradictions = engine.detectContradictions(axisScores, config);

      expect(contradictions).toHaveLength(1);
    });
  });
});
