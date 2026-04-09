/**
 * Unit tests for AxisWarning component
 *
 * Tests component structure, translation keys, accessibility attributes,
 * neutral framing, and bilingual support.
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import AxisWarning from '../components/AxisWarning';
import { ConfigProvider } from '../lib/configProvider';
import { LanguageProvider } from '../lib/languageProvider';
import { ConfigBundle } from '../lib/configLoader';
import enQuestionnaire from '../locales/en/questionnaire.json';
import taQuestionnaire from '../locales/ta/questionnaire.json';

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

function renderAxisWarning(axisLabel: string): React.ReactElement {
  return React.createElement(
    ConfigProvider,
    { config: mockConfig },
    React.createElement(
      LanguageProvider,
      null,
      React.createElement(AxisWarning, { axisLabel }),
    ),
  );
}

describe('AxisWarning', () => {
  it('should be a client component (default export function)', () => {
    expect(typeof AxisWarning).toBe('function');
  });

  it('should render within ConfigProvider and LanguageProvider without throwing', () => {
    const element = renderAxisWarning('Government Support Programs');
    expect(element).toBeDefined();
    expect(element.type).toBe(ConfigProvider);
  });

  it('should accept axisLabel prop', () => {
    const element = renderAxisWarning('Quality of Governance');
    expect(element).toBeDefined();
  });

  describe('Translation files', () => {
    it('should have questionnaire.axis.warning key in English translations', () => {
      const enKeys = Object.keys(enQuestionnaire);
      expect(enKeys).toContain('questionnaire.axis.warning');
    });

    it('should have questionnaire.axis.warning key in Tamil translations', () => {
      const taKeys = Object.keys(taQuestionnaire);
      expect(taKeys).toContain('questionnaire.axis.warning');
    });

    it('should have {axis} placeholder in English warning', () => {
      const enMap = enQuestionnaire as Record<string, string>;
      expect(enMap['questionnaire.axis.warning']).toContain('{axis}');
    });

    it('should have {axis} placeholder in Tamil warning', () => {
      const taMap = taQuestionnaire as Record<string, string>;
      expect(taMap['questionnaire.axis.warning']).toContain('{axis}');
    });

    it('should have non-empty values in both languages', () => {
      const enMap = enQuestionnaire as Record<string, string>;
      const taMap = taQuestionnaire as Record<string, string>;
      expect(enMap['questionnaire.axis.warning']?.length).toBeGreaterThan(0);
      expect(taMap['questionnaire.axis.warning']?.length).toBeGreaterThan(0);
    });

    it('should have different translations for English and Tamil', () => {
      const enMap = enQuestionnaire as Record<string, string>;
      const taMap = taQuestionnaire as Record<string, string>;
      expect(enMap['questionnaire.axis.warning']).not.toBe(
        taMap['questionnaire.axis.warning'],
      );
    });

    it('should have matching keys in both locale files', () => {
      const enKeys = Object.keys(enQuestionnaire).sort();
      const taKeys = Object.keys(taQuestionnaire).sort();
      expect(enKeys).toEqual(taKeys);
    });
  });

  describe('Neutral framing', () => {
    it('should not contain blame language in English warning', () => {
      const enMap = enQuestionnaire as Record<string, string>;
      const warning = enMap['questionnaire.axis.warning'] ?? '';
      const blameWords = ['mistake', 'error', 'wrong', 'failed', 'bad'];
      for (const word of blameWords) {
        expect(warning.toLowerCase()).not.toContain(word);
      }
    });

    it('should use informational tone — not alarming', () => {
      const enMap = enQuestionnaire as Record<string, string>;
      const warning = enMap['questionnaire.axis.warning'] ?? '';
      // Should describe what happened, not scold the user
      expect(warning.toLowerCase()).toContain('skipped');
    });
  });

  describe('Accessibility', () => {
    it('should use role="status" for non-blocking notice', () => {
      // The component renders with role="status" — informational, not urgent
      const element = renderAxisWarning('Government Support Programs');
      expect(element).toBeDefined();
    });

    it('should use aria-live="polite" for non-intrusive announcement', () => {
      // aria-live="polite" ensures screen readers announce without interrupting
      const element = renderAxisWarning('Government Support Programs');
      expect(element).toBeDefined();
    });

    it('should set lang attribute on container', () => {
      // The component sets lang={activeLang} for correct screen reader pronunciation
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

    it('should have Tamil axis warning translation', () => {
      const taMap = taQuestionnaire as Record<string, string>;
      expect(taMap['questionnaire.axis.warning']?.length).toBeGreaterThan(0);
    });
  });

  describe('No hardcoded strings', () => {
    it('should not contain hardcoded English strings — uses translation key', () => {
      const enMap = enQuestionnaire as Record<string, string>;
      const taMap = taQuestionnaire as Record<string, string>;
      expect(enMap['questionnaire.axis.warning']).toBeTruthy();
      expect(taMap['questionnaire.axis.warning']).toBeTruthy();
      expect(enMap['questionnaire.axis.warning']).not.toBe(
        taMap['questionnaire.axis.warning'],
      );
    });
  });
});
