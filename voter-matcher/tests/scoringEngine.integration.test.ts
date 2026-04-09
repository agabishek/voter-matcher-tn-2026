import { describe, it, expect } from 'vitest';
import { ScoringEngine } from '@/engines/scoringEngine';
import { ConfigLoader } from '@/lib/configLoader';
import { join } from 'path';

describe('ScoringEngine Integration', () => {
  const engine = new ScoringEngine();
  const configDir = join(process.cwd(), 'config');
  const loader = new ConfigLoader(configDir);
  const config = loader.load();

  it('should work with real config files', () => {
    // Verify we have the expected parties from party-registry.json
    const activeParties = config.parties.parties.filter(p => p.active);
    expect(activeParties.length).toBe(3);
    expect(activeParties.map(p => p.id)).toEqual(['DMK', 'AIADMK', 'TVK']);

    // Verify we have the expected axes from axis-registry.json
    const axisIds = config.axes.axes.map(a => a.id);
    expect(axisIds).toContain('welfare');
    expect(axisIds).toContain('economy');
    expect(axisIds).toContain('governance');
  });

  it('should handle zero-input with real config', () => {
    const result = engine.compute([], config.questions, config);

    // Should have equal split for 3 parties: 100/3
    const expectedShare = 100 / 3;
    expect(result.partyScores.DMK).toBeCloseTo(expectedShare, 5);
    expect(result.partyScores.AIADMK).toBeCloseTo(expectedShare, 5);
    expect(result.partyScores.TVK).toBeCloseTo(expectedShare, 5);

    // All axis scores should be 0
    for (const axisId of config.axes.axes.map(a => a.id)) {
      expect(result.axisScores[axisId]).toBe(0);
    }
  });

  it('should initialize all parties and axes from real config', () => {
    const result = engine.compute([], config.questions, config);

    // Should have scores for all active parties
    expect(result.partyScores).toHaveProperty('DMK');
    expect(result.partyScores).toHaveProperty('AIADMK');
    expect(result.partyScores).toHaveProperty('TVK');

    // Should have scores for all axes
    for (const axis of config.axes.axes) {
      expect(result.axisScores).toHaveProperty(axis.id);
    }
  });

  it('should only include active parties in zero-input case', () => {
    const result = engine.compute([], config.questions, config);

    // Should only have 3 parties (all active)
    expect(Object.keys(result.partyScores)).toHaveLength(3);
  });

  it('should compute confidence from normalized scores', () => {
    // Get raw scores
    const rawResult = engine.compute([], config.questions, config);
    
    // Normalize them
    const normalized = engine.normalize(rawResult.partyScores);
    
    // Compute confidence
    const confidence = engine.computeConfidence(normalized);
    
    // With equal split (N=3), gap should be 0 → Low confidence
    expect(confidence.level).toBe('Low');
    expect(confidence.gap).toBeCloseTo(0, 5);
    expect(confidence.thresholds.high).toBeCloseTo(100/3 + 12, 10);
    expect(confidence.thresholds.medium).toBeCloseTo(100/3 + 2, 10);
  });

  it('should demonstrate full scoring workflow with real config', () => {
    // Simulate selecting first option from first 5 questions
    const firstFiveQuestions = config.questions.questions.slice(0, 5);
    const selectedOptions = firstFiveQuestions.map(q => q.options[0].id);
    
    // Compute raw scores
    const rawResult = engine.compute(selectedOptions, config.questions, config);
    
    // Normalize scores
    const normalized = engine.normalize(rawResult.partyScores);
    
    // Verify normalization
    const sum = Object.values(normalized).reduce((acc, val) => acc + val, 0);
    expect(sum).toBe(100);
    
    // Compute confidence
    const confidence = engine.computeConfidence(normalized);
    
    // Confidence should be one of the three levels
    expect(['High', 'Medium', 'Low']).toContain(confidence.level);
    
    // Gap should be non-negative
    expect(confidence.gap).toBeGreaterThanOrEqual(0);
    
    // Thresholds should be properly ordered
    expect(confidence.thresholds.high).toBeGreaterThan(confidence.thresholds.medium);
  });
});
