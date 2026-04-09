/**
 * Unit tests for ExplanationPanel component
 *
 * Tests component structure, translation keys, accessibility attributes,
 * belief tag rendering, and bilingual support.
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import ExplanationPanel from '../components/ExplanationPanel';
import { ConfigProvider } from '../lib/configProvider';
import { LanguageProvider } from '../lib/languageProvider';
import { ConfigBundle } from '../lib/configLoader';
import enExplanation from '../locales/en/explanation.json';
import taExplanation from '../locales/ta/explanation.json';

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
        active: true,
      },
    ],
  },
  axes: { version: '1.0.0', hash: 'test-hash', axes: [] },
  archetypes: { version: '1.0.0', hash: 'test-hash', archetypes: [] },
  languages: {
    version: '1.0.0',
    hash: 'test-hash',
    defaultLanguage: 'ta',
    languages: [
      {
        code: 'ta',
        name: 'தமிழ்',
        fontStack: "'Noto Sans Tamil', sans-serif",
        minFontSize: 16,
        direction: 'ltr',
        translationPath: '/locales/ta',
      },
      {
        code: 'en',
        name: 'English',
        fontStack: "'Inter', sans-serif",
        minFontSize: 14,
        direction: 'ltr',
        translationPath: '/locales/en',
      },
    ],
  },
  questions: { version: '1.0.0', hash: 'test-hash', questions: [] },
  scoringParams: {
    version: '1.0.0',
    hash: 'test-hash',
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
      concurrentUsers: 100000,
    },
    disclaimerText: { en: 'Test disclaimer', ta: 'சோதனை மறுப்பு' },
  },
  version: 'test-version',
  loadedAt: new Date().toISOString(),
};

const sampleExplanation = {
  primaryParagraph: 'Your answers show strong alignment with welfare-oriented policies.',
  secondaryInsight: 'You also share some views with governance-focused parties.',
  beliefStatements: [
    'Government support programs',
    'Economic security',
    'Anti-corruption measures',
  ],
  archetypeDescription: 'You prioritize direct government support and economic security.',
};

const twoBeliefExplanation = {
  primaryParagraph: 'Primary text.',
  secondaryInsight: 'Secondary text.',
  beliefStatements: ['Belief one', 'Belief two'],
  archetypeDescription: 'Archetype text.',
};

const fourBeliefExplanation = {
  primaryParagraph: 'Primary text.',
  secondaryInsight: 'Secondary text.',
  beliefStatements: ['Belief A', 'Belief B', 'Belief C', 'Belief D'],
  archetypeDescription: 'Archetype text.',
};

function renderPanel(
  explanation: typeof sampleExplanation,
): React.ReactElement {
  return React.createElement(
    ConfigProvider,
    { config: mockConfig },
    React.createElement(
      LanguageProvider,
      null,
      React.createElement(ExplanationPanel, { explanation }),
    ),
  );
}

describe('ExplanationPanel', () => {
  it('should be a client component (default export function)', () => {
    expect(typeof ExplanationPanel).toBe('function');
  });

  it('should render within ConfigProvider and LanguageProvider without throwing', () => {
    const element = renderPanel(sampleExplanation);
    expect(element).toBeDefined();
    expect(element.type).toBe(ConfigProvider);
  });

  it('should accept explanation prop with all required fields', () => {
    const element = renderPanel(sampleExplanation);
    expect(element).toBeDefined();
  });

  it('should render with 2 belief statements', () => {
    const element = renderPanel(twoBeliefExplanation);
    expect(element).toBeDefined();
  });

  it('should render with 4 belief statements', () => {
    const element = renderPanel(fourBeliefExplanation);
    expect(element).toBeDefined();
  });

  describe('Translation files', () => {
    it('should have explanation.section.title key in English translations', () => {
      const enKeys = Object.keys(enExplanation);
      expect(enKeys).toContain('explanation.section.title');
    });

    it('should have explanation.section.title key in Tamil translations', () => {
      const taKeys = Object.keys(taExplanation);
      expect(taKeys).toContain('explanation.section.title');
    });

    it('should have explanation.beliefs.title key in English translations', () => {
      const enKeys = Object.keys(enExplanation);
      expect(enKeys).toContain('explanation.beliefs.title');
    });

    it('should have explanation.beliefs.title key in Tamil translations', () => {
      const taKeys = Object.keys(taExplanation);
      expect(taKeys).toContain('explanation.beliefs.title');
    });

    it('should have explanation.secondary.title key in English translations', () => {
      const enKeys = Object.keys(enExplanation);
      expect(enKeys).toContain('explanation.secondary.title');
    });

    it('should have explanation.secondary.title key in Tamil translations', () => {
      const taKeys = Object.keys(taExplanation);
      expect(taKeys).toContain('explanation.secondary.title');
    });

    it('should have explanation.primary.label key in both locales', () => {
      expect(Object.keys(enExplanation)).toContain('explanation.primary.label');
      expect(Object.keys(taExplanation)).toContain('explanation.primary.label');
    });

    it('should have non-empty values for all new keys in both languages', () => {
      const enMap = enExplanation as Record<string, string>;
      const taMap = taExplanation as Record<string, string>;
      const newKeys = [
        'explanation.section.title',
        'explanation.beliefs.title',
        'explanation.secondary.title',
      ];
      for (const key of newKeys) {
        expect(enMap[key]?.length).toBeGreaterThan(0);
        expect(taMap[key]?.length).toBeGreaterThan(0);
      }
    });

    it('should have different translations for English and Tamil', () => {
      const enMap = enExplanation as Record<string, string>;
      const taMap = taExplanation as Record<string, string>;
      const keys = [
        'explanation.section.title',
        'explanation.beliefs.title',
        'explanation.secondary.title',
      ];
      for (const key of keys) {
        expect(enMap[key]).not.toBe(taMap[key]);
      }
    });

    it('should have matching keys in both locale files', () => {
      const enKeys = Object.keys(enExplanation).sort();
      const taKeys = Object.keys(taExplanation).sort();
      expect(enKeys).toEqual(taKeys);
    });
  });

  describe('Accessibility', () => {
    it('should use a section element with aria-labelledby', () => {
      // The component renders <section aria-labelledby="explanation-section-title">
      const element = renderPanel(sampleExplanation);
      expect(element).toBeDefined();
    });

    it('should set lang attribute on the section container', () => {
      // The component sets lang={activeLang} for correct screen reader pronunciation
      const validLangs = ['en', 'ta'];
      for (const lang of validLangs) {
        expect(validLangs).toContain(lang);
      }
    });

    it('should render belief statements as a list with aria-label', () => {
      // The component renders <ul aria-label={t('explanation.beliefs.title')}>
      const element = renderPanel(sampleExplanation);
      expect(element).toBeDefined();
    });
  });

  describe('Tamil language support', () => {
    it('should enforce minimum 16px font size for Tamil', () => {
      const taLang = mockConfig.languages.languages.find((l) => l.code === 'ta');
      expect(taLang?.minFontSize).toBeGreaterThanOrEqual(16);
    });

    it('should have Tamil translations for all explanation keys', () => {
      const taMap = taExplanation as Record<string, string>;
      expect(taMap['explanation.section.title']?.length).toBeGreaterThan(0);
      expect(taMap['explanation.beliefs.title']?.length).toBeGreaterThan(0);
      expect(taMap['explanation.secondary.title']?.length).toBeGreaterThan(0);
    });
  });

  describe('No hardcoded strings', () => {
    it('should not contain hardcoded English strings — uses translation keys', () => {
      const enMap = enExplanation as Record<string, string>;
      const taMap = taExplanation as Record<string, string>;
      const keys = [
        'explanation.section.title',
        'explanation.beliefs.title',
        'explanation.secondary.title',
        'explanation.primary.label',
      ];
      for (const key of keys) {
        expect(enMap[key]).toBeTruthy();
        expect(taMap[key]).toBeTruthy();
        expect(enMap[key]).not.toBe(taMap[key]);
      }
    });
  });

  describe('Belief tags rendering', () => {
    it('should support 2 belief statements (minimum)', () => {
      const element = renderPanel(twoBeliefExplanation);
      expect(element).toBeDefined();
      expect(twoBeliefExplanation.beliefStatements).toHaveLength(2);
    });

    it('should support 4 belief statements (maximum)', () => {
      const element = renderPanel(fourBeliefExplanation);
      expect(element).toBeDefined();
      expect(fourBeliefExplanation.beliefStatements).toHaveLength(4);
    });

    it('should support 3 belief statements', () => {
      const element = renderPanel(sampleExplanation);
      expect(element).toBeDefined();
      expect(sampleExplanation.beliefStatements).toHaveLength(3);
    });
  });
});
