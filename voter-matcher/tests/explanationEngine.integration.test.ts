/**
 * Integration tests for ExplanationEngine with real config data
 */

import { describe, it, expect } from 'vitest';
import { ExplanationEngine } from '@/engines/explanationEngine';
import { ConfigLoader } from '@/lib/configLoader';
import type { ArchetypeResult, Contradiction } from '@/engines/profilingEngine';
import type { ScoreResult } from '@/engines/explanationEngine';
import { join } from 'path';

describe('ExplanationEngine Integration Tests', () => {
  const configLoader = new ConfigLoader(join(process.cwd(), 'config'));
  const config = configLoader.load();
  const engine = new ExplanationEngine();

  describe('generate() with real config', () => {
    it('should generate explanation for DMK match in English', () => {
      const result: ScoreResult = {
        partyScores: { DMK: 45, AIADMK: 35, TVK: 20 },
        rawScores: { DMK: 90, AIADMK: 70, TVK: 40 },
        axisScores: { 
          welfare: 50, 
          governance: 40, 
          economy: 30, 
          poverty: 25,
          social_justice: 20,
          corruption: 15,
          responsibility: 10,
          language_identity: 5,
          federalism: 5
        },
        confidenceScore: 'High',
        confidenceGap: 15,
        answeredCount: 25,
        skippedCount: 5,
        configVersion: config.version
      };

      const archetype: ArchetypeResult = {
        primary: 'security_seeker',
        isAmbiguous: false
      };

      const explanation = engine.generate(result, archetype, [], config, 'en');

      // Verify all fields are present
      expect(explanation.primaryParagraph).toBeDefined();
      expect(explanation.secondaryInsight).toBeDefined();
      expect(explanation.beliefStatements).toBeDefined();
      expect(explanation.archetypeDescription).toBeDefined();

      // Verify content is sourced from registries
      expect(explanation.primaryParagraph).toContain('Dravida Munnetra Kazhagam');
      expect(explanation.primaryParagraph).toContain('45%');
      expect(explanation.archetypeDescription).toContain('government support');
      
      // Verify no hardcoded strings
      expect(explanation.primaryParagraph).not.toContain('TODO');
      expect(explanation.primaryParagraph).not.toContain('placeholder');
    });

    it('should generate explanation for AIADMK match in Tamil', () => {
      const result: ScoreResult = {
        partyScores: { AIADMK: 50, DMK: 30, TVK: 20 },
        rawScores: { AIADMK: 100, DMK: 60, TVK: 40 },
        axisScores: { 
          welfare: 60, 
          poverty: 50,
          governance: 30, 
          economy: 20, 
          social_justice: 15,
          corruption: 10,
          responsibility: 10,
          language_identity: 5,
          federalism: 0
        },
        confidenceScore: 'High',
        confidenceGap: 20,
        answeredCount: 28,
        skippedCount: 2,
        configVersion: config.version
      };

      const archetype: ArchetypeResult = {
        primary: 'security_seeker',
        isAmbiguous: false
      };

      const explanation = engine.generate(result, archetype, [], config, 'ta');

      // Verify Tamil content
      expect(explanation.primaryParagraph).toContain('அனைத்திந்திய அண்ணா திராவிட முன்னேற்றக் கழகம்');
      expect(explanation.primaryParagraph).toContain('50%');
      expect(explanation.archetypeDescription).toContain('நேரடி அரசு ஆதரவு');
      
      // Verify belief statements are in Tamil
      expect(explanation.beliefStatements.length).toBeGreaterThan(0);
      expect(explanation.beliefStatements[0]).toContain('நீங்கள்');
    });

    it('should generate track record notice for TVK (promise-based party)', () => {
      const result: ScoreResult = {
        partyScores: { TVK: 55, DMK: 25, AIADMK: 20 },
        rawScores: { TVK: 110, DMK: 50, AIADMK: 40 },
        axisScores: { 
          corruption: 60,
          economy: 50,
          responsibility: 40,
          governance: 30, 
          social_justice: 20,
          welfare: 15,
          poverty: 10,
          language_identity: 10,
          federalism: 5
        },
        confidenceScore: 'High',
        confidenceGap: 30,
        answeredCount: 30,
        skippedCount: 0,
        configVersion: config.version
      };

      const archetype: ArchetypeResult = {
        primary: 'system_reformer',
        isAmbiguous: false
      };

      const explanation = engine.generate(result, archetype, [], config, 'en');

      // Verify track record notice is present
      expect(explanation.trackRecordNotice).toBeDefined();
      expect(explanation.trackRecordNotice).toContain('TVK');
      expect(explanation.trackRecordNotice).toContain('manifesto promises');
      expect(explanation.trackRecordNotice).toContain('governance track record');
    });

    it('should handle ambiguous archetype classification', () => {
      const result: ScoreResult = {
        partyScores: { DMK: 40, AIADMK: 35, TVK: 25 },
        rawScores: { DMK: 80, AIADMK: 70, TVK: 50 },
        axisScores: { 
          welfare: 45, 
          social_justice: 43,
          governance: 40, 
          economy: 30, 
          poverty: 25,
          corruption: 15,
          responsibility: 10,
          language_identity: 5,
          federalism: 2
        },
        confidenceScore: 'Medium',
        confidenceGap: 5,
        answeredCount: 25,
        skippedCount: 5,
        configVersion: config.version
      };

      const archetype: ArchetypeResult = {
        primary: 'security_seeker',
        secondary: 'equity_builder',
        isAmbiguous: true
      };

      const explanation = engine.generate(result, archetype, [], config, 'en');

      // Verify secondary archetype is mentioned
      expect(explanation.secondaryInsight).toContain('Equity Builder');
      expect(explanation.secondaryInsight).toContain('multifaceted');
    });

    it('should handle contradictions in axis scores', () => {
      const result: ScoreResult = {
        partyScores: { DMK: 40, AIADMK: 35, TVK: 25 },
        rawScores: { DMK: 80, AIADMK: 70, TVK: 50 },
        axisScores: { 
          welfare: 50, 
          economy: 48,
          governance: 30, 
          social_justice: 25,
          poverty: 20,
          corruption: 15,
          responsibility: 10,
          language_identity: 5,
          federalism: 2
        },
        confidenceScore: 'Medium',
        confidenceGap: 5,
        answeredCount: 25,
        skippedCount: 5,
        configVersion: config.version
      };

      const archetype: ArchetypeResult = {
        primary: 'security_seeker',
        isAmbiguous: false
      };

      const contradictions: Contradiction[] = [
        {
          axis1: 'welfare',
          axis2: 'economy',
          score1: 50,
          score2: 48
        }
      ];

      const explanation = engine.generate(result, archetype, contradictions, config, 'en');

      // Verify contradiction is mentioned as nuance
      expect(explanation.secondaryInsight).toContain('Government Support Programs');
      expect(explanation.secondaryInsight).toContain('Economic Growth & Jobs');
      expect(explanation.secondaryInsight).toContain('nuanced');
    });

    it('should generate belief statements from all 9 axes', () => {
      const result: ScoreResult = {
        partyScores: { DMK: 40, AIADMK: 35, TVK: 25 },
        rawScores: { DMK: 80, AIADMK: 70, TVK: 50 },
        axisScores: { 
          language_identity: 60,
          federalism: 55,
          social_justice: 50,
          governance: 45,
          welfare: 40, 
          economy: 35,
          corruption: 30,
          poverty: 25,
          responsibility: 20
        },
        confidenceScore: 'Medium',
        confidenceGap: 5,
        answeredCount: 30,
        skippedCount: 0,
        configVersion: config.version
      };

      const archetype: ArchetypeResult = {
        primary: 'identity_advocate',
        isAmbiguous: false
      };

      const explanation = engine.generate(result, archetype, [], config, 'en');

      // Verify belief statements are generated from top axes
      expect(explanation.beliefStatements.length).toBeGreaterThanOrEqual(2);
      expect(explanation.beliefStatements.length).toBeLessThanOrEqual(4);
      
      // Top axis should be mentioned (lowercase in belief statements)
      expect(explanation.beliefStatements[0].toLowerCase()).toContain('tamil language & cultural identity');
    });

    it('should work with all confidence levels', () => {
      const testCases: Array<{ confidence: 'High' | 'Medium' | 'Low'; gap: number }> = [
        { confidence: 'High', gap: 25 },
        { confidence: 'Medium', gap: 8 },
        { confidence: 'Low', gap: 2 }
      ];

      for (const { confidence, gap } of testCases) {
        const result: ScoreResult = {
          partyScores: { DMK: 40, AIADMK: 35, TVK: 25 },
          rawScores: { DMK: 80, AIADMK: 70, TVK: 50 },
          axisScores: { welfare: 50, economy: 30, social_justice: 20 },
          confidenceScore: confidence,
          confidenceGap: gap,
          answeredCount: 25,
          skippedCount: 5,
          configVersion: config.version
        };

        const archetype: ArchetypeResult = {
          primary: 'security_seeker',
          isAmbiguous: false
        };

        const explanation = engine.generate(result, archetype, [], config, 'en');

        expect(explanation.primaryParagraph).toContain(confidence.toLowerCase());
      }
    });
  });
});
