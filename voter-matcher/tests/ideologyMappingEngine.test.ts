import { describe, it, expect } from 'vitest';
import { IdeologyMappingEngine } from '@/engines/ideologyMappingEngine';
import type { ConfigBundle, QuestionBank } from '@/lib/configLoader';

describe('IdeologyMappingEngine', () => {
  const engine = new IdeologyMappingEngine();
  
  // Mock config bundle with minimal data
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

  describe('validate', () => {
    it('should pass validation for a valid question bank', () => {
      const validQuestions: QuestionBank = {
        version: '1.0.0',
        hash: 'test-hash',
        questions: [
          {
            id: 'q001',
            cluster: 'welfare',
            text: { en: 'Test question', ta: 'சோதனை கேள்வி' },
            options: [
              {
                id: 'q001_a',
                text: { en: 'Option A', ta: 'விருப்பம் A' },
                partyWeights: { DMK: 3, AIADMK: 5, TVK: 4 },
                axisWeights: { welfare: 4, economy: 2 }
              },
              {
                id: 'q001_b',
                text: { en: 'Option B', ta: 'விருப்பம் B' },
                partyWeights: { DMK: 5, AIADMK: 3, TVK: 3 },
                axisWeights: { welfare: 3, governance: 4 }
              }
            ]
          }
        ]
      };

      const result = engine.validate(validQuestions, mockConfig);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should throw error for unknown party ID', () => {
      const invalidQuestions: QuestionBank = {
        version: '1.0.0',
        hash: 'test-hash',
        questions: [
          {
            id: 'q001',
            cluster: 'welfare',
            text: { en: 'Test question', ta: 'சோதனை கேள்வி' },
            options: [
              {
                id: 'q001_a',
                text: { en: 'Option A', ta: 'விருப்பம் A' },
                partyWeights: { DMK: 3, AIADMK: 5, TVK: 4, UNKNOWN: 2 },
                axisWeights: { welfare: 4 }
              }
            ]
          }
        ]
      };

      expect(() => engine.validate(invalidQuestions, mockConfig)).toThrow(
        /Unknown party ID "UNKNOWN"/
      );
    });

    it('should throw error for unknown axis ID', () => {
      const invalidQuestions: QuestionBank = {
        version: '1.0.0',
        hash: 'test-hash',
        questions: [
          {
            id: 'q002',
            cluster: 'welfare',
            text: { en: 'Test question', ta: 'சோதனை கேள்வி' },
            options: [
              {
                id: 'q002_a',
                text: { en: 'Option A', ta: 'விருப்பம் A' },
                partyWeights: { DMK: 3, AIADMK: 5, TVK: 4 },
                axisWeights: { welfare: 4, unknown_axis: 3 }
              }
            ]
          }
        ]
      };

      expect(() => engine.validate(invalidQuestions, mockConfig)).toThrow(
        /Unknown axis ID "unknown_axis"/
      );
    });

    it('should throw error for missing active party weight', () => {
      const invalidQuestions: QuestionBank = {
        version: '1.0.0',
        hash: 'test-hash',
        questions: [
          {
            id: 'q003',
            cluster: 'welfare',
            text: { en: 'Test question', ta: 'சோதனை கேள்வி' },
            options: [
              {
                id: 'q003_a',
                text: { en: 'Option A', ta: 'விருப்பம் A' },
                partyWeights: { DMK: 3, AIADMK: 5 }, // Missing TVK
                axisWeights: { welfare: 4 }
              }
            ]
          }
        ]
      };

      expect(() => engine.validate(invalidQuestions, mockConfig)).toThrow(
        /Missing weight for active party "TVK"/
      );
    });

    it('should not require weights for inactive parties', () => {
      const validQuestions: QuestionBank = {
        version: '1.0.0',
        hash: 'test-hash',
        questions: [
          {
            id: 'q004',
            cluster: 'welfare',
            text: { en: 'Test question', ta: 'சோதனை கேள்வி' },
            options: [
              {
                id: 'q004_a',
                text: { en: 'Option A', ta: 'விருப்பம் A' },
                partyWeights: { DMK: 3, AIADMK: 5, TVK: 4 }, // INACTIVE party not required
                axisWeights: { welfare: 4 }
              }
            ]
          }
        ]
      };

      const result = engine.validate(validQuestions, mockConfig);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should throw error for party weight out of range', () => {
      const invalidQuestions: QuestionBank = {
        version: '1.0.0',
        hash: 'test-hash',
        questions: [
          {
            id: 'q005',
            cluster: 'welfare',
            text: { en: 'Test question', ta: 'சோதனை கேள்வி' },
            options: [
              {
                id: 'q005_a',
                text: { en: 'Option A', ta: 'விருப்பம் A' },
                partyWeights: { DMK: 3, AIADMK: 10, TVK: 4 }, // 10 is out of range [0, 5]
                axisWeights: { welfare: 4 }
              }
            ]
          }
        ]
      };

      expect(() => engine.validate(invalidQuestions, mockConfig)).toThrow(
        /Party weight for "AIADMK" is 10, which is outside the valid range/
      );
    });

    it('should throw error for axis weight out of range', () => {
      const invalidQuestions: QuestionBank = {
        version: '1.0.0',
        hash: 'test-hash',
        questions: [
          {
            id: 'q006',
            cluster: 'welfare',
            text: { en: 'Test question', ta: 'சோதனை கேள்வி' },
            options: [
              {
                id: 'q006_a',
                text: { en: 'Option A', ta: 'விருப்பம் A' },
                partyWeights: { DMK: 3, AIADMK: 5, TVK: 4 },
                axisWeights: { welfare: -1 } // -1 is out of range [0, 5]
              }
            ]
          }
        ]
      };

      expect(() => engine.validate(invalidQuestions, mockConfig)).toThrow(
        /Axis weight for "welfare" is -1, which is outside the valid range/
      );
    });

    it('should collect multiple validation errors', () => {
      const invalidQuestions: QuestionBank = {
        version: '1.0.0',
        hash: 'test-hash',
        questions: [
          {
            id: 'q007',
            cluster: 'welfare',
            text: { en: 'Test question', ta: 'சோதனை கேள்வி' },
            options: [
              {
                id: 'q007_a',
                text: { en: 'Option A', ta: 'விருப்பம் A' },
                partyWeights: { DMK: 3, UNKNOWN: 5 }, // Unknown party + missing TVK and AIADMK
                axisWeights: { welfare: 4, invalid_axis: 2 } // Unknown axis
              }
            ]
          }
        ]
      };

      expect(() => engine.validate(invalidQuestions, mockConfig)).toThrow();
      
      try {
        engine.validate(invalidQuestions, mockConfig);
      } catch (error) {
        const errorMessage = (error as Error).message;
        expect(errorMessage).toContain('Unknown party ID "UNKNOWN"');
        expect(errorMessage).toContain('Unknown axis ID "invalid_axis"');
        expect(errorMessage).toContain('Missing weight for active party');
      }
    });
  });

  describe('getWeights', () => {
    const testQuestions: QuestionBank = {
      version: '1.0.0',
      hash: 'test-hash',
      questions: [
        {
          id: 'q001',
          cluster: 'welfare',
          text: { en: 'Test question', ta: 'சோதனை கேள்வி' },
          options: [
            {
              id: 'q001_a',
              text: { en: 'Option A', ta: 'விருப்பம் A' },
              partyWeights: { DMK: 3, AIADMK: 5, TVK: 4 },
              axisWeights: { welfare: 4, economy: 2 }
            },
            {
              id: 'q001_b',
              text: { en: 'Option B', ta: 'விருப்பம் B' },
              partyWeights: { DMK: 5, AIADMK: 3, TVK: 3 },
              axisWeights: { welfare: 3, governance: 4 }
            }
          ]
        }
      ]
    };

    it('should return weights for a valid option ID', () => {
      const weights = engine.getWeights('q001_a', testQuestions);
      
      expect(weights.partyWeights).toEqual({ DMK: 3, AIADMK: 5, TVK: 4 });
      expect(weights.axisWeights).toEqual({ welfare: 4, economy: 2 });
    });

    it('should return weights for another valid option ID', () => {
      const weights = engine.getWeights('q001_b', testQuestions);
      
      expect(weights.partyWeights).toEqual({ DMK: 5, AIADMK: 3, TVK: 3 });
      expect(weights.axisWeights).toEqual({ welfare: 3, governance: 4 });
    });

    it('should throw error for non-existent option ID', () => {
      expect(() => engine.getWeights('q999_z', testQuestions)).toThrow(
        /Option with ID "q999_z" not found in question bank/
      );
    });

    it('should return a copy of weights, not the original object', () => {
      const weights = engine.getWeights('q001_a', testQuestions);
      
      // Modify the returned weights
      weights.partyWeights.DMK = 999;
      weights.axisWeights.welfare = 999;
      
      // Get weights again and verify they are unchanged
      const weightsAgain = engine.getWeights('q001_a', testQuestions);
      expect(weightsAgain.partyWeights.DMK).toBe(3);
      expect(weightsAgain.axisWeights.welfare).toBe(4);
    });
  });
});
