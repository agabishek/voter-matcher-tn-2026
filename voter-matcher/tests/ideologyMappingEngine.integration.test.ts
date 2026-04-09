import { describe, it, expect } from 'vitest';
import { IdeologyMappingEngine } from '@/engines/ideologyMappingEngine';
import { ConfigLoader } from '@/lib/configLoader';
import { join } from 'path';

describe('IdeologyMappingEngine - Integration Tests', () => {
  const engine = new IdeologyMappingEngine();
  const configDir = join(process.cwd(), 'config');
  const loader = new ConfigLoader(configDir);
  
  describe('validate with real config files', () => {
    it('should successfully validate the actual question bank against real registries', () => {
      const config = loader.load();
      
      // This should not throw - the actual config files should be valid
      const result = engine.validate(config.questions, config);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should verify all questions have weights for all active parties', () => {
      const config = loader.load();
      
      const activePartyIds = config.parties.parties
        .filter(party => party.active)
        .map(party => party.id);
      
      // Check each question's options
      for (const question of config.questions.questions) {
        for (const option of question.options) {
          for (const partyId of activePartyIds) {
            expect(option.partyWeights).toHaveProperty(partyId);
            expect(typeof option.partyWeights[partyId]).toBe('number');
          }
        }
      }
    });
    
    it('should verify all axis IDs in questions exist in Axis_Registry', () => {
      const config = loader.load();
      
      const validAxisIds = new Set(config.axes.axes.map(axis => axis.id));
      
      for (const question of config.questions.questions) {
        for (const option of question.options) {
          for (const axisId of Object.keys(option.axisWeights)) {
            expect(validAxisIds.has(axisId)).toBe(true);
          }
        }
      }
    });
    
    it('should verify all party IDs in questions exist in Party_Registry', () => {
      const config = loader.load();
      
      const validPartyIds = new Set(config.parties.parties.map(party => party.id));
      
      for (const question of config.questions.questions) {
        for (const option of question.options) {
          for (const partyId of Object.keys(option.partyWeights)) {
            expect(validPartyIds.has(partyId)).toBe(true);
          }
        }
      }
    });
    
    it('should verify all weights are within the configured range', () => {
      const config = loader.load();
      
      const { min, max } = config.scoringParams.weightRange;
      
      for (const question of config.questions.questions) {
        for (const option of question.options) {
          // Check party weights
          for (const weight of Object.values(option.partyWeights)) {
            expect(weight).toBeGreaterThanOrEqual(min);
            expect(weight).toBeLessThanOrEqual(max);
          }
          
          // Check axis weights
          for (const weight of Object.values(option.axisWeights)) {
            expect(weight).toBeGreaterThanOrEqual(min);
            expect(weight).toBeLessThanOrEqual(max);
          }
        }
      }
    });
  });
  
  describe('getWeights with real config files', () => {
    it('should retrieve weights for actual option IDs', () => {
      const config = loader.load();
      
      // Test with the first option of the first question
      const firstQuestion = config.questions.questions[0];
      const firstOption = firstQuestion.options[0];
      
      const weights = engine.getWeights(firstOption.id, config.questions);
      
      expect(weights.partyWeights).toBeDefined();
      expect(weights.axisWeights).toBeDefined();
      expect(Object.keys(weights.partyWeights).length).toBeGreaterThan(0);
      expect(Object.keys(weights.axisWeights).length).toBeGreaterThan(0);
    });
    
    it('should retrieve correct weights for q001_a', () => {
      const config = loader.load();
      
      const weights = engine.getWeights('q001_a', config.questions);
      
      // Based on the actual questions.json file
      expect(weights.partyWeights).toEqual({ DMK: 2, AIADMK: 5, TVK: 3 });
      expect(weights.axisWeights).toEqual({ welfare: 4, poverty: 3 });
    });
    
    it('should retrieve correct weights for q001_b', () => {
      const config = loader.load();
      
      const weights = engine.getWeights('q001_b', config.questions);
      
      // Based on the actual questions.json file
      expect(weights.partyWeights).toEqual({ DMK: 5, AIADMK: 2, TVK: 2 });
      expect(weights.axisWeights).toEqual({ welfare: 3, governance: 4 });
    });
  });
});
