/**
 * Unit tests for ExplanationEngine
 */

import { describe, it, expect } from 'vitest';
import { ExplanationEngine } from '@/engines/explanationEngine';
import type { ManifestoData } from '@/engines/explanationEngine';
import type { ConfigBundle } from '@/lib/configLoader';
import type { ArchetypeResult, Contradiction } from '@/engines/profilingEngine';
import type { ScoreResult } from '@/engines/explanationEngine';

// Mock ConfigBundle with minimal data
const mockConfig: ConfigBundle = {
  parties: {
    version: '1.0.0',
    hash: 'test-hash',
    parties: [
      {
        id: 'DMK',
        names: { en: 'DMK', ta: 'திமுக' },
        fullNames: { en: 'Dravida Munnetra Kazhagam', ta: 'திராவிட முன்னேற்றக் கழகம்' },
        governanceStatus: 'incumbent',
        weightBasis: 'track-record',
        manifestoVersion: 'dmk-2026-v1',
        active: true
      },
      {
        id: 'AIADMK',
        names: { en: 'AIADMK', ta: 'அதிமுக' },
        fullNames: { en: 'All India Anna Dravida Munnetra Kazhagam', ta: 'அனைத்திந்திய அண்ணா திராவிட முன்னேற்றக் கழகம்' },
        governanceStatus: 'incumbent',
        weightBasis: 'track-record',
        manifestoVersion: 'aiadmk-2026-v1',
        active: true
      },
      {
        id: 'TVK',
        names: { en: 'TVK', ta: 'தவெக' },
        fullNames: { en: 'Tamilaga Vettri Kazhagam', ta: 'தமிழக வெற்றிக் கழகம்' },
        governanceStatus: 'new',
        weightBasis: 'promise',
        manifestoVersion: 'tvk-2026-v1',
        active: true
      }
    ]
  },
  axes: {
    version: '1.0.0',
    hash: 'test-hash',
    axes: [
      {
        id: 'welfare',
        labels: { en: 'Government Support Programs', ta: 'அரசு நலத் திட்டங்கள்' },
        technicalName: { en: 'Welfare', ta: 'நலன்புரி' },
        archetypeMapping: ['security_seeker'],
        independentPairs: ['economy']
      },
      {
        id: 'economy',
        labels: { en: 'Economic Growth & Jobs', ta: 'பொருளாதார வளர்ச்சி மற்றும் வேலைவாய்ப்பு' },
        technicalName: { en: 'Economy', ta: 'பொருளாதாரம்' },
        archetypeMapping: ['system_reformer'],
        independentPairs: ['welfare']
      },
      {
        id: 'social_justice',
        labels: { en: 'Social Justice & Reservation', ta: 'சமூக நீதி மற்றும் இட ஒதுக்கீடு' },
        technicalName: { en: 'Social Justice', ta: 'சமூக நீதி' },
        archetypeMapping: ['equity_builder'],
        independentPairs: []
      }
    ]
  },
  archetypes: {
    version: '1.0.0',
    hash: 'test-hash',
    archetypes: [
      {
        id: 'security_seeker',
        names: { en: 'Security Seeker', ta: 'பாதுகாப்பு தேடுபவர்' },
        dominantAxes: ['welfare'],
        ambiguityThreshold: 0.1,
        descriptions: {
          en: 'You prioritize direct government support and economic security.',
          ta: 'நீங்கள் நேரடி அரசு ஆதரவு மற்றும் பொருளாதார பாதுகாப்பை முன்னுரிமை அளிக்கிறீர்கள்.'
        }
      },
      {
        id: 'equity_builder',
        names: { en: 'Equity Builder', ta: 'சமத்துவ கட்டுநர்' },
        dominantAxes: ['social_justice'],
        ambiguityThreshold: 0.1,
        descriptions: {
          en: 'You prioritize systemic equality and institutional reform.',
          ta: 'நீங்கள் அமைப்பு ரீதியான சமத்துவம் மற்றும் நிறுவன சீர்திருத்தத்தை முன்னுரிமை அளிக்கிறீர்கள்.'
        }
      }
    ]
  },
  languages: {
    version: '1.0.0',
    hash: 'test-hash',
    defaultLanguage: 'ta',
    languages: []
  },
  questions: {
    version: '1.0.0',
    hash: 'test-hash',
    questions: []
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
    disclaimerText: { en: 'Test disclaimer', ta: 'சோதனை மறுப்பு' }
  },
  version: '1.0.0',
  loadedAt: new Date().toISOString()
};

describe('ExplanationEngine', () => {
  const engine = new ExplanationEngine();

  describe('generate()', () => {
    it('should generate complete explanation with all required fields', () => {
      const result: ScoreResult = {
        partyScores: { DMK: 45, AIADMK: 35, TVK: 20 },
        rawScores: { DMK: 90, AIADMK: 70, TVK: 40 },
        axisScores: { welfare: 50, economy: 30, social_justice: 20 },
        confidenceScore: 'High',
        confidenceGap: 15,
        answeredCount: 25,
        skippedCount: 5,
        configVersion: '1.0.0'
      };

      const archetype: ArchetypeResult = {
        primary: 'security_seeker',
        isAmbiguous: false
      };

      const contradictions: Contradiction[] = [];

      const explanation = engine.generate(result, archetype, contradictions, mockConfig, 'en');

      expect(explanation.primaryParagraph).toBeDefined();
      expect(explanation.primaryParagraph).toContain('Dravida Munnetra Kazhagam');
      expect(explanation.primaryParagraph).toContain('45%');
      expect(explanation.secondaryInsight).toBeDefined();
      expect(explanation.beliefStatements).toHaveLength(3);
      expect(explanation.archetypeDescription).toBe('You prioritize direct government support and economic security.');
      expect(explanation.trackRecordNotice).toBeUndefined(); // DMK is track-record based
    });

    it('should generate Tamil explanation when lang is "ta"', () => {
      const result: ScoreResult = {
        partyScores: { DMK: 45, AIADMK: 35, TVK: 20 },
        rawScores: { DMK: 90, AIADMK: 70, TVK: 40 },
        axisScores: { welfare: 50, economy: 30, social_justice: 20 },
        confidenceScore: 'High',
        confidenceGap: 15,
        answeredCount: 25,
        skippedCount: 5,
        configVersion: '1.0.0'
      };

      const archetype: ArchetypeResult = {
        primary: 'security_seeker',
        isAmbiguous: false
      };

      const explanation = engine.generate(result, archetype, [], mockConfig, 'ta');

      expect(explanation.primaryParagraph).toContain('திராவிட முன்னேற்றக் கழகம்');
      expect(explanation.primaryParagraph).toContain('45%');
      expect(explanation.archetypeDescription).toBe('நீங்கள் நேரடி அரசு ஆதரவு மற்றும் பொருளாதார பாதுகாப்பை முன்னுரிமை அளிக்கிறீர்கள்.');
    });

    it('should include track record notice for promise-based parties', () => {
      const result: ScoreResult = {
        partyScores: { TVK: 50, DMK: 30, AIADMK: 20 },
        rawScores: { TVK: 100, DMK: 60, AIADMK: 40 },
        axisScores: { welfare: 50, economy: 30, social_justice: 20 },
        confidenceScore: 'High',
        confidenceGap: 20,
        answeredCount: 25,
        skippedCount: 5,
        configVersion: '1.0.0'
      };

      const archetype: ArchetypeResult = {
        primary: 'security_seeker',
        isAmbiguous: false
      };

      const explanation = engine.generate(result, archetype, [], mockConfig, 'en');

      expect(explanation.trackRecordNotice).toBeDefined();
      expect(explanation.trackRecordNotice).toContain('TVK');
      expect(explanation.trackRecordNotice).toContain('manifesto promises');
    });

    it('should mention secondary archetype when ambiguous', () => {
      const result: ScoreResult = {
        partyScores: { DMK: 45, AIADMK: 35, TVK: 20 },
        rawScores: { DMK: 90, AIADMK: 70, TVK: 40 },
        axisScores: { welfare: 50, economy: 30, social_justice: 20 },
        confidenceScore: 'Medium',
        confidenceGap: 10,
        answeredCount: 25,
        skippedCount: 5,
        configVersion: '1.0.0'
      };

      const archetype: ArchetypeResult = {
        primary: 'security_seeker',
        secondary: 'equity_builder',
        isAmbiguous: true
      };

      const explanation = engine.generate(result, archetype, [], mockConfig, 'en');

      expect(explanation.secondaryInsight).toContain('Equity Builder');
      expect(explanation.secondaryInsight).toContain('multifaceted');
    });

    it('should mention contradictions in secondary insight', () => {
      const result: ScoreResult = {
        partyScores: { DMK: 45, AIADMK: 35, TVK: 20 },
        rawScores: { DMK: 90, AIADMK: 70, TVK: 40 },
        axisScores: { welfare: 50, economy: 45, social_justice: 20 },
        confidenceScore: 'Medium',
        confidenceGap: 10,
        answeredCount: 25,
        skippedCount: 5,
        configVersion: '1.0.0'
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
          score2: 45
        }
      ];

      const explanation = engine.generate(result, archetype, contradictions, mockConfig, 'en');

      expect(explanation.secondaryInsight).toContain('Government Support Programs');
      expect(explanation.secondaryInsight).toContain('Economic Growth & Jobs');
      expect(explanation.secondaryInsight).toContain('nuanced');
    });

    it('should generate belief statements from top axes', () => {
      const result: ScoreResult = {
        partyScores: { DMK: 45, AIADMK: 35, TVK: 20 },
        rawScores: { DMK: 90, AIADMK: 70, TVK: 40 },
        axisScores: { welfare: 50, economy: 30, social_justice: 20 },
        confidenceScore: 'High',
        confidenceGap: 15,
        answeredCount: 25,
        skippedCount: 5,
        configVersion: '1.0.0'
      };

      const archetype: ArchetypeResult = {
        primary: 'security_seeker',
        isAmbiguous: false
      };

      const explanation = engine.generate(result, archetype, [], mockConfig, 'en');

      expect(explanation.beliefStatements).toHaveLength(3);
      expect(explanation.beliefStatements[0]).toContain('government support programs');
      expect(explanation.beliefStatements[1]).toContain('economic growth & jobs');
      expect(explanation.beliefStatements[2]).toContain('social justice & reservation');
    });

    it('should handle Low confidence appropriately', () => {
      const result: ScoreResult = {
        partyScores: { DMK: 35, AIADMK: 33, TVK: 32 },
        rawScores: { DMK: 70, AIADMK: 66, TVK: 64 },
        axisScores: { welfare: 30, economy: 30, social_justice: 30 },
        confidenceScore: 'Low',
        confidenceGap: 2,
        answeredCount: 25,
        skippedCount: 5,
        configVersion: '1.0.0'
      };

      const archetype: ArchetypeResult = {
        primary: 'security_seeker',
        isAmbiguous: false
      };

      const explanation = engine.generate(result, archetype, [], mockConfig, 'en');

      expect(explanation.primaryParagraph).toContain('low confidence');
      expect(explanation.primaryParagraph).toContain('distributed across multiple parties');
    });

    it('should throw error if top party not found in registry', () => {
      const result: ScoreResult = {
        partyScores: { UNKNOWN: 50, DMK: 30, AIADMK: 20 },
        rawScores: { UNKNOWN: 100, DMK: 60, AIADMK: 40 },
        axisScores: { welfare: 50 },
        confidenceScore: 'High',
        confidenceGap: 20,
        answeredCount: 25,
        skippedCount: 5,
        configVersion: '1.0.0'
      };

      const archetype: ArchetypeResult = {
        primary: 'security_seeker',
        isAmbiguous: false
      };

      expect(() => {
        engine.generate(result, archetype, [], mockConfig, 'en');
      }).toThrow('Top party UNKNOWN not found in Party_Registry');
    });

    it('should throw error if primary archetype not found in registry', () => {
      const result: ScoreResult = {
        partyScores: { DMK: 50, AIADMK: 30, TVK: 20 },
        rawScores: { DMK: 100, AIADMK: 60, TVK: 40 },
        axisScores: { welfare: 50 },
        confidenceScore: 'High',
        confidenceGap: 20,
        answeredCount: 25,
        skippedCount: 5,
        configVersion: '1.0.0'
      };

      const archetype: ArchetypeResult = {
        primary: 'unknown_archetype',
        isAmbiguous: false
      };

      expect(() => {
        engine.generate(result, archetype, [], mockConfig, 'en');
      }).toThrow('Primary archetype unknown_archetype not found in Archetype_Registry');
    });
  });
});

// ─── Shared test fixtures ────────────────────────────────────────────────────

const baseResult: ScoreResult = {
  partyScores: { DMK: 45, AIADMK: 35, TVK: 20 },
  rawScores: { DMK: 90, AIADMK: 70, TVK: 40 },
  axisScores: { welfare: 50, economy: 30, social_justice: 20 },
  confidenceScore: 'High',
  confidenceGap: 15,
  answeredCount: 25,
  skippedCount: 5,
  configVersion: '1.0.0',
};

const baseArchetype: ArchetypeResult = {
  primary: 'security_seeker',
  isAmbiguous: false,
};

const mockManifestoData: ManifestoData = {
  DMK: {
    economy: {
      en: 'IT parks in tier-2 cities and AI Mission 2.0.',
      ta: 'இரண்டாம் நிலை நகரங்களில் IT பூங்காக்கள் மற்றும் AI Mission 2.0.',
    },
    socialJustice: {
      en: '69% reservation protected constitutionally.',
      ta: '69% இட ஒதுக்கீடு அரசியலமைப்பு ரீதியாக பாதுகாக்கப்பட்டது.',
    },
    governance: {
      en: 'Dravidian Model 2.0 – transparent, accessible governance.',
      ta: 'திராவிட மாடல் 2.0 – வெளிப்படையான, எளிமையான ஆட்சி.',
    },
    welfare: {
      en: 'Kalaignar Magalir Urimai Thittam – ₹1,000/month for women heads.',
      ta: 'கலைஞர் மகளிர் உரிமைத் திட்டம் – குடும்பத் தலைவிகளுக்கு மாதம் ₹1,000.',
    },
    poverty: {
      en: 'Housing for all Adi Dravidar families by 2030.',
      ta: '2030க்குள் அனைத்து ஆதிதிராவிட குடும்பங்களுக்கும் வீடு.',
    },
    responsibility: {
      en: 'State as primary provider and enabler.',
      ta: 'அரசு முதன்மை வழங்குநராகவும் செயல்படுத்துபவராகவும்.',
    },
  },
  TVK: {
    economy: {
      en: 'Interest-free loans up to ₹25 lakh for young entrepreneurs.',
      ta: 'இளம் தொழில்முனைவோருக்கு ₹25 லட்சம் வரை வட்டியில்லா கடன்.',
    },
    socialJustice: {
      en: '75% local jobs reservation for Tamil people.',
      ta: 'தமிழர்களுக்கு 75% உள்ளூர் வேலைவாய்ப்பு இட ஒதுக்கீடு.',
    },
    governance: {
      en: 'Transparent TNPSC exams on strict schedule.',
      ta: 'கண்டிப்பான அட்டவணையில் வெளிப்படையான TNPSC தேர்வுகள்.',
    },
    welfare: {
      en: '₹2,500/month for women heads of households.',
      ta: 'குடும்பத் தலைவிகளுக்கு மாதம் ₹2,500.',
    },
    poverty: {
      en: 'Free higher education for children of small farmers.',
      ta: 'சிறு விவசாயிகளின் குழந்தைகளுக்கு இலவச உயர்கல்வி.',
    },
    responsibility: {
      en: 'Balanced – state provides safety net but empowers individuals.',
      ta: 'சமநிலை – அரசு பாதுகாப்பு வலை வழங்கும் ஆனால் தனிநபர்களை மேம்படுத்தும்.',
    },
  },
};

// ─── Task 4.2: Demographic context injection ─────────────────────────────────

describe('ExplanationEngine – generateWithDemographics()', () => {
  const engine = new ExplanationEngine();

  it('returns no demographicHighlights when ageGroup is omitted', () => {
    const explanation = engine.generateWithDemographics(
      baseResult, baseArchetype, [], mockConfig, 'en'
    );
    expect(explanation.demographicHighlights).toBeUndefined();
  });

  it('returns no demographicHighlights when manifestoData is omitted', () => {
    const explanation = engine.generateWithDemographics(
      baseResult, baseArchetype, [], mockConfig, 'en', 'youth'
    );
    expect(explanation.demographicHighlights).toEqual([]);
  });

  it('surfaces economy/socialJustice highlights for youth age group (en)', () => {
    const explanation = engine.generateWithDemographics(
      baseResult, baseArchetype, [], mockConfig, 'en', 'youth', mockManifestoData
    );
    expect(explanation.demographicHighlights).toBeDefined();
    expect(explanation.demographicHighlights!.length).toBeGreaterThanOrEqual(1);
    expect(explanation.demographicHighlights!.length).toBeLessThanOrEqual(2);
    // First highlight should be economy (first axis for youth)
    expect(explanation.demographicHighlights![0]).toContain('IT parks');
  });

  it('surfaces welfare/governance highlights for adult age group (en)', () => {
    const explanation = engine.generateWithDemographics(
      baseResult, baseArchetype, [], mockConfig, 'en', 'adult', mockManifestoData
    );
    expect(explanation.demographicHighlights).toBeDefined();
    expect(explanation.demographicHighlights!.length).toBeGreaterThanOrEqual(1);
    expect(explanation.demographicHighlights!.length).toBeLessThanOrEqual(2);
    // First highlight should be welfare (first axis for adult)
    expect(explanation.demographicHighlights![0]).toContain('₹1,000');
  });

  it('surfaces poverty/welfare highlights for senior age group (en)', () => {
    const explanation = engine.generateWithDemographics(
      baseResult, baseArchetype, [], mockConfig, 'en', 'senior', mockManifestoData
    );
    expect(explanation.demographicHighlights).toBeDefined();
    expect(explanation.demographicHighlights!.length).toBeGreaterThanOrEqual(1);
    expect(explanation.demographicHighlights!.length).toBeLessThanOrEqual(2);
    // First highlight should be poverty (first axis for senior)
    expect(explanation.demographicHighlights![0]).toContain('Housing');
  });

  it('returns Tamil highlights when lang is "ta"', () => {
    const explanation = engine.generateWithDemographics(
      baseResult, baseArchetype, [], mockConfig, 'ta', 'youth', mockManifestoData
    );
    expect(explanation.demographicHighlights).toBeDefined();
    expect(explanation.demographicHighlights!.length).toBeGreaterThanOrEqual(1);
    // Tamil text should contain Tamil characters
    expect(explanation.demographicHighlights![0]).toMatch(/[\u0B80-\u0BFF]/);
  });

  it('returns empty array when party has no manifesto entry', () => {
    const resultWithUnknownParty: ScoreResult = {
      ...baseResult,
      partyScores: { UNKNOWN: 60, DMK: 25, AIADMK: 15 },
      rawScores: { UNKNOWN: 120, DMK: 50, AIADMK: 30 },
    };
    // UNKNOWN party not in mockConfig, so generate() would throw — use DMK result
    // but pass manifesto without DMK to simulate missing entry
    const sparseManifesto: ManifestoData = { TVK: mockManifestoData['TVK']! };
    const explanation = engine.generateWithDemographics(
      baseResult, baseArchetype, [], mockConfig, 'en', 'youth', sparseManifesto
    );
    expect(explanation.demographicHighlights).toEqual([]);
  });

  it('never returns more than 2 highlights regardless of axes available', () => {
    // All axes have data — should still cap at 2
    const explanation = engine.generateWithDemographics(
      baseResult, baseArchetype, [], mockConfig, 'en', 'youth', mockManifestoData
    );
    expect(explanation.demographicHighlights!.length).toBeLessThanOrEqual(2);
  });

  it('generate() (no ageGroup) still works and returns no demographicHighlights', () => {
    const explanation = engine.generate(baseResult, baseArchetype, [], mockConfig, 'en');
    expect(explanation.demographicHighlights).toBeUndefined();
    expect(explanation.primaryParagraph).toContain('Dravida Munnetra Kazhagam');
  });
});
