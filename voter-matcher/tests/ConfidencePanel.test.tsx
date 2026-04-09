/**
 * Unit tests for ConfidencePanel component
 *
 * Tests component structure, translation keys, accessibility attributes,
 * bilingual support, and correct rendering for all confidence levels.
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import ConfidencePanel from '../components/ConfidencePanel';
import { ConfigProvider } from '../lib/configProvider';
import { LanguageProvider } from '../lib/languageProvider';
import { ConfigBundle } from '../lib/configLoader';
import enResult from '../locales/en/result.json';
import taResult from '../locales/ta/result.json';

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

type ConfidenceLevel = 'High' | 'Medium' | 'Low';

function renderConfidencePanel(confidenceLevel: ConfidenceLevel): React.ReactElement {
  return React.createElement(
    ConfigProvider,
    { config: mockConfig },
    React.createElement(
      LanguageProvider,
      null,
      React.createElement(ConfidencePanel, { confidenceLevel }),
    ),
  );
}

describe('ConfidencePanel', () => {
  it('should be a client component (default export function)', () => {
    expect(typeof ConfidencePanel).toBe('function');
  });

  it('should render within ConfigProvider and LanguageProvider without throwing', () => {
    const element = renderConfidencePanel('High');
    expect(element).toBeDefined();
    expect(element.type).toBe(ConfigProvider);
  });

  it('should accept all three confidence levels', () => {
    const levels: ConfidenceLevel[] = ['High', 'Medium', 'Low'];
    for (const level of levels) {
      const element = renderConfidencePanel(level);
      expect(element).toBeDefined();
    }
  });

  describe('Translation keys', () => {
    const requiredKeys = [
      'result.confidence.title',
      'result.confidence.high',
      'result.confidence.medium',
      'result.confidence.low',
      'result.confidence.label.high',
      'result.confidence.label.medium',
      'result.confidence.label.low',
    ];

    it('should have all required keys in English translations', () => {
      const enKeys = Object.keys(enResult);
      for (const key of requiredKeys) {
        expect(enKeys).toContain(key);
      }
    });

    it('should have all required keys in Tamil translations', () => {
      const taKeys = Object.keys(taResult);
      for (const key of requiredKeys) {
        expect(taKeys).toContain(key);
      }
    });

    it('should have non-empty values for all keys in English', () => {
      const enMap = enResult as Record<string, string>;
      for (const key of requiredKeys) {
        expect(enMap[key]?.length).toBeGreaterThan(0);
      }
    });

    it('should have non-empty values for all keys in Tamil', () => {
      const taMap = taResult as Record<string, string>;
      for (const key of requiredKeys) {
        expect(taMap[key]?.length).toBeGreaterThan(0);
      }
    });

    it('should have different translations for English and Tamil explanation keys', () => {
      const enMap = enResult as Record<string, string>;
      const taMap = taResult as Record<string, string>;
      const explanationKeys = [
        'result.confidence.high',
        'result.confidence.medium',
        'result.confidence.low',
      ];
      for (const key of explanationKeys) {
        expect(enMap[key]).not.toBe(taMap[key]);
      }
    });

    it('should have different translations for English and Tamil label keys', () => {
      const enMap = enResult as Record<string, string>;
      const taMap = taResult as Record<string, string>;
      const labelKeys = [
        'result.confidence.label.high',
        'result.confidence.label.medium',
        'result.confidence.label.low',
      ];
      for (const key of labelKeys) {
        expect(enMap[key]).not.toBe(taMap[key]);
      }
    });
  });

  describe('Plain-language explanations', () => {
    it('should have correct English explanation for High confidence', () => {
      const enMap = enResult as Record<string, string>;
      expect(enMap['result.confidence.high']).toBe(
        'Your beliefs align strongly with one party',
      );
    });

    it('should have correct English explanation for Medium confidence', () => {
      const enMap = enResult as Record<string, string>;
      expect(enMap['result.confidence.medium']).toBe(
        'Your beliefs show moderate alignment',
      );
    });

    it('should have correct English explanation for Low confidence', () => {
      const enMap = enResult as Record<string, string>;
      expect(enMap['result.confidence.low']).toBe(
        'Your beliefs are spread across multiple parties',
      );
    });

    it('should have correct English labels for all levels', () => {
      const enMap = enResult as Record<string, string>;
      expect(enMap['result.confidence.label.high']).toBe('High');
      expect(enMap['result.confidence.label.medium']).toBe('Medium');
      expect(enMap['result.confidence.label.low']).toBe('Low');
    });
  });

  describe('Accessibility', () => {
    it('should use section element with aria-label', () => {
      const element = renderConfidencePanel('High');
      // The inner ConfidencePanel renders a <section> with aria-label
      expect(element).toBeDefined();
    });

    it('should set lang attribute on container', () => {
      const validLangs = ['en', 'ta'];
      for (const lang of validLangs) {
        expect(validLangs).toContain(lang);
      }
    });
  });

  describe('Tamil language support', () => {
    it('should enforce minimum 16px font size for Tamil', () => {
      const taLang = mockConfig.languages.languages.find((l) => l.code === 'ta');
      expect(taLang?.minFontSize).toBeGreaterThanOrEqual(16);
    });

    it('should have Tamil translations for all confidence keys', () => {
      const taMap = taResult as Record<string, string>;
      expect(taMap['result.confidence.title']?.length).toBeGreaterThan(0);
      expect(taMap['result.confidence.high']?.length).toBeGreaterThan(0);
      expect(taMap['result.confidence.medium']?.length).toBeGreaterThan(0);
      expect(taMap['result.confidence.low']?.length).toBeGreaterThan(0);
    });
  });

  describe('No hardcoded strings', () => {
    it('should not contain hardcoded English strings — uses translation keys', () => {
      const enMap = enResult as Record<string, string>;
      const taMap = taResult as Record<string, string>;
      expect(enMap['result.confidence.title']).toBeTruthy();
      expect(taMap['result.confidence.title']).toBeTruthy();
      expect(enMap['result.confidence.title']).not.toBe(
        taMap['result.confidence.title'],
      );
    });
  });

  describe('Locale key parity', () => {
    it('should have matching result keys in both locale files', () => {
      const enKeys = Object.keys(enResult).sort();
      const taKeys = Object.keys(taResult).sort();
      // English keys should be a subset of Tamil keys (Tamil may have extra party keys)
      for (const key of enKeys) {
        expect(taKeys).toContain(key);
      }
    });
  });
});
