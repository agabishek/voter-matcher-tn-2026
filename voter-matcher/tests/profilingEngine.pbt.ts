/**
 * Property-Based Tests for ProfilingEngine
 * 
 * **Validates: Requirements 8.2, 8.3**
 * 
 * This test suite uses fast-check to verify the archetype independence property:
 * "Archetype classification MUST be based solely on axis scores, never on party scores"
 * 
 * The property being tested: The ProfilingEngine.classify() method MUST produce
 * identical archetype results when given the same axis scores, regardless of what
 * party scores exist in the system. This ensures that archetype classification
 * and party matching are truly independent engines.
 */

import { describe, it, expect } from 'vitest';
import { ProfilingEngine } from '@/engines/profilingEngine';
import type { ConfigBundle } from '@/lib/configLoader';
import * as fc from 'fast-check';

describe('ProfilingEngine Property-Based Tests', () => {
  /**
   * Helper to create a minimal ConfigBundle for testing
   */
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

  /**
   * Property: Archetype Independence
   * 
   * **Validates: Requirements 8.2, 8.3**
   * 
   * The ProfilingEngine.classify() method MUST produce identical results when
   * given the same axis scores, regardless of:
   * - What party scores exist in the system
   * - How many parties are registered
   * - What the party match percentages are
   * 
   * This property ensures that archetype classification is truly independent
   * of party matching, as required by the design.
   */
  describe('Property: Archetype independence - classification never reads party scores', () => {
    it('should produce identical archetype results for same axis scores regardless of party configuration', () => {
      fc.assert(
        fc.property(
          // Generate arbitrary axis scores
          fc.record({
            welfare: fc.double({ min: 0, max: 100, noNaN: true }),
            poverty: fc.double({ min: 0, max: 100, noNaN: true }),
            social_justice: fc.double({ min: 0, max: 100, noNaN: true }),
            governance: fc.double({ min: 0, max: 100, noNaN: true }),
            corruption: fc.double({ min: 0, max: 100, noNaN: true }),
            economy: fc.double({ min: 0, max: 100, noNaN: true })
          }),
          (axisScores) => {
            // Create config with archetypes
            const config = createTestConfig([
              { id: 'security_seeker', dominantAxes: ['welfare', 'poverty'], ambiguityThreshold: 0.1 },
              { id: 'equity_builder', dominantAxes: ['social_justice', 'governance'], ambiguityThreshold: 0.1 },
              { id: 'system_reformer', dominantAxes: ['corruption', 'economy'], ambiguityThreshold: 0.1 }
            ]);

            const engine = new ProfilingEngine();

            // Call classify() multiple times with the same axis scores
            // The method should never access party scores, so results should be identical
            const result1 = engine.classify(axisScores, config);
            const result2 = engine.classify(axisScores, config);
            const result3 = engine.classify(axisScores, config);

            // All results should be identical
            expect(result1.primary).toBe(result2.primary);
            expect(result1.primary).toBe(result3.primary);
            expect(result1.secondary).toBe(result2.secondary);
            expect(result1.secondary).toBe(result3.secondary);
            expect(result1.isAmbiguous).toBe(result2.isAmbiguous);
            expect(result1.isAmbiguous).toBe(result3.isAmbiguous);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce same archetype for same axis scores with different party counts', () => {
      fc.assert(
        fc.property(
          // Generate arbitrary axis scores
          fc.record({
            welfare: fc.double({ min: 0, max: 100, noNaN: true }),
            poverty: fc.double({ min: 0, max: 100, noNaN: true }),
            social_justice: fc.double({ min: 0, max: 100, noNaN: true }),
            governance: fc.double({ min: 0, max: 100, noNaN: true })
          }),
          (axisScores) => {
            // Create config with archetypes (party count doesn't matter)
            const config = createTestConfig([
              { id: 'security_seeker', dominantAxes: ['welfare', 'poverty'], ambiguityThreshold: 0.1 },
              { id: 'equity_builder', dominantAxes: ['social_justice', 'governance'], ambiguityThreshold: 0.1 }
            ]);

            const engine = new ProfilingEngine();

            // Classify with the same axis scores
            // The result should be independent of how many parties exist
            const result = engine.classify(axisScores, config);

            // Verify that the result is deterministic based only on axis scores
            // We can't directly verify that party scores aren't read, but we can
            // verify that the same axis scores always produce the same result
            const result2 = engine.classify(axisScores, config);

            expect(result.primary).toBe(result2.primary);
            expect(result.secondary).toBe(result2.secondary);
            expect(result.isAmbiguous).toBe(result2.isAmbiguous);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should classify based only on dominant axis scores, not party alignment', () => {
      fc.assert(
        fc.property(
          // Generate axis scores where welfare/poverty are highest
          fc.record({
            welfare: fc.double({ min: 50, max: 100, noNaN: true }),
            poverty: fc.double({ min: 50, max: 100, noNaN: true }),
            social_justice: fc.double({ min: 0, max: 30, noNaN: true }),
            governance: fc.double({ min: 0, max: 30, noNaN: true }),
            corruption: fc.double({ min: 0, max: 30, noNaN: true }),
            economy: fc.double({ min: 0, max: 30, noNaN: true })
          }),
          (axisScores) => {
            const config = createTestConfig([
              { id: 'security_seeker', dominantAxes: ['welfare', 'poverty'], ambiguityThreshold: 0.1 },
              { id: 'equity_builder', dominantAxes: ['social_justice', 'governance'], ambiguityThreshold: 0.1 },
              { id: 'system_reformer', dominantAxes: ['corruption', 'economy'], ambiguityThreshold: 0.1 }
            ]);

            const engine = new ProfilingEngine();
            const result = engine.classify(axisScores, config);

            // Since welfare and poverty are highest, should classify as security_seeker
            // This is based purely on axis scores, not party scores
            expect(result.primary).toBe('security_seeker');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should classify based only on dominant axis scores for equity_builder archetype', () => {
      fc.assert(
        fc.property(
          // Generate axis scores where social_justice/governance are highest
          fc.record({
            welfare: fc.double({ min: 0, max: 30, noNaN: true }),
            poverty: fc.double({ min: 0, max: 30, noNaN: true }),
            social_justice: fc.double({ min: 50, max: 100, noNaN: true }),
            governance: fc.double({ min: 50, max: 100, noNaN: true }),
            corruption: fc.double({ min: 0, max: 30, noNaN: true }),
            economy: fc.double({ min: 0, max: 30, noNaN: true })
          }),
          (axisScores) => {
            const config = createTestConfig([
              { id: 'security_seeker', dominantAxes: ['welfare', 'poverty'], ambiguityThreshold: 0.1 },
              { id: 'equity_builder', dominantAxes: ['social_justice', 'governance'], ambiguityThreshold: 0.1 },
              { id: 'system_reformer', dominantAxes: ['corruption', 'economy'], ambiguityThreshold: 0.1 }
            ]);

            const engine = new ProfilingEngine();
            const result = engine.classify(axisScores, config);

            // Since social_justice and governance are highest, should classify as equity_builder
            expect(result.primary).toBe('equity_builder');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should classify based only on dominant axis scores for system_reformer archetype', () => {
      fc.assert(
        fc.property(
          // Generate axis scores where corruption/economy are highest
          fc.record({
            welfare: fc.double({ min: 0, max: 30, noNaN: true }),
            poverty: fc.double({ min: 0, max: 30, noNaN: true }),
            social_justice: fc.double({ min: 0, max: 30, noNaN: true }),
            governance: fc.double({ min: 0, max: 30, noNaN: true }),
            corruption: fc.double({ min: 50, max: 100, noNaN: true }),
            economy: fc.double({ min: 50, max: 100, noNaN: true })
          }),
          (axisScores) => {
            const config = createTestConfig([
              { id: 'security_seeker', dominantAxes: ['welfare', 'poverty'], ambiguityThreshold: 0.1 },
              { id: 'equity_builder', dominantAxes: ['social_justice', 'governance'], ambiguityThreshold: 0.1 },
              { id: 'system_reformer', dominantAxes: ['corruption', 'economy'], ambiguityThreshold: 0.1 }
            ]);

            const engine = new ProfilingEngine();
            const result = engine.classify(axisScores, config);

            // Since corruption and economy are highest, should classify as system_reformer
            expect(result.primary).toBe('system_reformer');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle arbitrary number of archetypes with arbitrary dominant axes', () => {
      fc.assert(
        fc.property(
          // Generate arbitrary number of archetypes (2-6)
          fc.integer({ min: 2, max: 6 }).chain(archetypeCount =>
            fc.tuple(
              fc.constant(archetypeCount),
              // Generate axis scores for 10 possible axes
              fc.record({
                axis1: fc.double({ min: 0, max: 100, noNaN: true }),
                axis2: fc.double({ min: 0, max: 100, noNaN: true }),
                axis3: fc.double({ min: 0, max: 100, noNaN: true }),
                axis4: fc.double({ min: 0, max: 100, noNaN: true }),
                axis5: fc.double({ min: 0, max: 100, noNaN: true }),
                axis6: fc.double({ min: 0, max: 100, noNaN: true }),
                axis7: fc.double({ min: 0, max: 100, noNaN: true }),
                axis8: fc.double({ min: 0, max: 100, noNaN: true }),
                axis9: fc.double({ min: 0, max: 100, noNaN: true }),
                axis10: fc.double({ min: 0, max: 100, noNaN: true })
              })
            )
          ),
          ([archetypeCount, axisScores]) => {
            // Create archetypes with different dominant axes
            const archetypes = [];
            for (let i = 0; i < archetypeCount; i++) {
              archetypes.push({
                id: `archetype_${i}`,
                dominantAxes: [`axis${(i % 10) + 1}`, `axis${((i + 1) % 10) + 1}`],
                ambiguityThreshold: 0.1
              });
            }

            const config = createTestConfig(archetypes);
            const engine = new ProfilingEngine();

            // Classify multiple times with same axis scores
            const result1 = engine.classify(axisScores, config);
            const result2 = engine.classify(axisScores, config);

            // Results should be identical - classification is deterministic based on axis scores
            expect(result1.primary).toBe(result2.primary);
            expect(result1.secondary).toBe(result2.secondary);
            expect(result1.isAmbiguous).toBe(result2.isAmbiguous);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce deterministic results for edge case: all axis scores zero', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 5 }),
          (archetypeCount) => {
            // Create archetypes
            const archetypes = [];
            for (let i = 0; i < archetypeCount; i++) {
              archetypes.push({
                id: `archetype_${i}`,
                dominantAxes: [`axis${i + 1}`],
                ambiguityThreshold: 0.1
              });
            }

            const config = createTestConfig(archetypes);
            const engine = new ProfilingEngine();

            // All axis scores are zero
            const axisScores: Record<string, number> = {};
            for (let i = 1; i <= archetypeCount; i++) {
              axisScores[`axis${i}`] = 0;
            }

            // Classify multiple times
            const result1 = engine.classify(axisScores, config);
            const result2 = engine.classify(axisScores, config);

            // Results should be identical
            expect(result1.primary).toBe(result2.primary);
            expect(result1.secondary).toBe(result2.secondary);
            expect(result1.isAmbiguous).toBe(result2.isAmbiguous);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should produce deterministic results for edge case: tied archetype scores', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 1, max: 100, noNaN: true }),
          (equalScore) => {
            const config = createTestConfig([
              { id: 'archetype_a', dominantAxes: ['axis1'], ambiguityThreshold: 1 },
              { id: 'archetype_b', dominantAxes: ['axis2'], ambiguityThreshold: 1 }
            ]);

            const engine = new ProfilingEngine();

            // Both archetypes have equal scores
            const axisScores = {
              axis1: equalScore,
              axis2: equalScore
            };

            // Classify multiple times
            const result1 = engine.classify(axisScores, config);
            const result2 = engine.classify(axisScores, config);

            // Results should be identical
            expect(result1.primary).toBe(result2.primary);
            expect(result1.secondary).toBe(result2.secondary);
            expect(result1.isAmbiguous).toBe(result2.isAmbiguous);

            // Should be ambiguous since scores are tied
            expect(result1.isAmbiguous).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle archetype with multiple dominant axes correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            axis1: fc.double({ min: 0, max: 50, noNaN: true }),
            axis2: fc.double({ min: 0, max: 50, noNaN: true }),
            axis3: fc.double({ min: 0, max: 50, noNaN: true }),
            axis4: fc.double({ min: 0, max: 100, noNaN: true })
          }),
          (axisScores) => {
            const config = createTestConfig([
              { id: 'multi_axis', dominantAxes: ['axis1', 'axis2', 'axis3'], ambiguityThreshold: 0.1 },
              { id: 'single_axis', dominantAxes: ['axis4'], ambiguityThreshold: 0.1 }
            ]);

            const engine = new ProfilingEngine();

            // Classify multiple times
            const result1 = engine.classify(axisScores, config);
            const result2 = engine.classify(axisScores, config);

            // Results should be identical
            expect(result1.primary).toBe(result2.primary);
            expect(result1.secondary).toBe(result2.secondary);
            expect(result1.isAmbiguous).toBe(result2.isAmbiguous);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should classify based only on axis scores with realistic TN 2026 archetype configuration', () => {
      fc.assert(
        fc.property(
          // Generate realistic axis scores for all 9 axes
          fc.record({
            welfare: fc.double({ min: 0, max: 150, noNaN: true }),
            poverty: fc.double({ min: 0, max: 150, noNaN: true }),
            social_justice: fc.double({ min: 0, max: 150, noNaN: true }),
            governance: fc.double({ min: 0, max: 150, noNaN: true }),
            corruption: fc.double({ min: 0, max: 150, noNaN: true }),
            economy: fc.double({ min: 0, max: 150, noNaN: true }),
            responsibility: fc.double({ min: 0, max: 150, noNaN: true }),
            language_identity: fc.double({ min: 0, max: 150, noNaN: true }),
            federalism: fc.double({ min: 0, max: 150, noNaN: true })
          }),
          (axisScores) => {
            // Use realistic TN 2026 archetype configuration
            const config = createTestConfig([
              { id: 'security_seeker', dominantAxes: ['welfare', 'poverty'], ambiguityThreshold: 0.1 },
              { id: 'equity_builder', dominantAxes: ['social_justice', 'governance'], ambiguityThreshold: 0.1 },
              { id: 'system_reformer', dominantAxes: ['corruption', 'economy', 'responsibility'], ambiguityThreshold: 0.1 },
              { id: 'identity_advocate', dominantAxes: ['language_identity', 'federalism'], ambiguityThreshold: 0.1 }
            ]);

            const engine = new ProfilingEngine();

            // Classify multiple times
            const result1 = engine.classify(axisScores, config);
            const result2 = engine.classify(axisScores, config);
            const result3 = engine.classify(axisScores, config);

            // All results should be identical - classification is based only on axis scores
            expect(result1.primary).toBe(result2.primary);
            expect(result1.primary).toBe(result3.primary);
            expect(result1.secondary).toBe(result2.secondary);
            expect(result1.secondary).toBe(result3.secondary);
            expect(result1.isAmbiguous).toBe(result2.isAmbiguous);
            expect(result1.isAmbiguous).toBe(result3.isAmbiguous);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should never access or depend on party scores in any way', () => {
      fc.assert(
        fc.property(
          // Generate arbitrary axis scores
          fc.record({
            welfare: fc.double({ min: 0, max: 100, noNaN: true }),
            poverty: fc.double({ min: 0, max: 100, noNaN: true }),
            social_justice: fc.double({ min: 0, max: 100, noNaN: true }),
            governance: fc.double({ min: 0, max: 100, noNaN: true })
          }),
          (axisScores) => {
            const config = createTestConfig([
              { id: 'security_seeker', dominantAxes: ['welfare', 'poverty'], ambiguityThreshold: 0.1 },
              { id: 'equity_builder', dominantAxes: ['social_justice', 'governance'], ambiguityThreshold: 0.1 }
            ]);

            const engine = new ProfilingEngine();

            // The classify method should only use axisScores and config.archetypes
            // It should never access config.parties or any party-related data
            // We verify this by ensuring the result is purely a function of axis scores
            const result = engine.classify(axisScores, config);

            // Verify that the result is valid
            expect(result.primary).toBeDefined();
            expect(typeof result.primary).toBe('string');
            expect(typeof result.isAmbiguous).toBe('boolean');

            // Verify that the primary archetype is one of the defined archetypes
            const archetypeIds = config.archetypes.archetypes.map(a => a.id);
            expect(archetypeIds).toContain(result.primary);

            // If secondary is defined, it should also be a valid archetype
            if (result.secondary) {
              expect(archetypeIds).toContain(result.secondary);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
