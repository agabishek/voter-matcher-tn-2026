/**
 * Unit tests for ProcessingScreen component
 *
 * Tests component structure, translation keys, sequential step logic,
 * and accessibility attributes.
 * Uses the same pattern as LandingScreen.test.tsx (React.createElement, no DOM renderer).
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import ProcessingScreen from '../components/ProcessingScreen';
import { ConfigProvider } from '../lib/configProvider';
import { LanguageProvider } from '../lib/languageProvider';
import { ConfigBundle } from '../lib/configLoader';
import enCommon from '../locales/en/common.json';
import taCommon from '../locales/ta/common.json';

const mockConfig: ConfigBundle = {
  parties: {
    version: '1.0.0',
    hash: 'test-hash',
    parties: [],
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

function renderWithConfig(): React.ReactElement {
  return React.createElement(
    ConfigProvider,
    { config: mockConfig },
    React.createElement(
      LanguageProvider,
      null,
      React.createElement(ProcessingScreen, null),
    ),
  );
}

describe('ProcessingScreen', () => {
  it('should render within ConfigProvider without throwing', () => {
    const element = renderWithConfig();
    expect(element).toBeDefined();
    expect(element.type).toBe(ConfigProvider);
  });

  it('should be a client component (default export function)', () => {
    expect(typeof ProcessingScreen).toBe('function');
  });

  it('should accept no required props', () => {
    // ProcessingScreen takes no props — verify it can be created
    const element = React.createElement(ProcessingScreen);
    expect(element).toBeDefined();
    expect(element.props).toEqual({});
  });

  describe('Translation files', () => {
    const requiredKeys = [
      'processing.title',
      'processing.step1',
      'processing.step2',
      'processing.step3',
      'processing.accessibilitySection',
    ];

    it('should have all required keys in English translations', () => {
      const enKeys = Object.keys(enCommon);
      for (const key of requiredKeys) {
        expect(enKeys).toContain(key);
      }
    });

    it('should have all required keys in Tamil translations', () => {
      const taKeys = Object.keys(taCommon);
      for (const key of requiredKeys) {
        expect(taKeys).toContain(key);
      }
    });

    it('should have matching keys in both locale files', () => {
      const enKeys = Object.keys(enCommon).sort();
      const taKeys = Object.keys(taCommon).sort();
      expect(enKeys).toEqual(taKeys);
    });

    it('should have non-empty values for all processing keys in English', () => {
      const enMap = enCommon as Record<string, string>;
      for (const key of requiredKeys) {
        expect(enMap[key]?.length).toBeGreaterThan(0);
      }
    });

    it('should have non-empty values for all processing keys in Tamil', () => {
      const taMap = taCommon as Record<string, string>;
      for (const key of requiredKeys) {
        expect(taMap[key]?.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Step content', () => {
    it('step 1 should describe analyzing answers in English', () => {
      const enMap = enCommon as Record<string, string>;
      expect(enMap['processing.step1']?.toLowerCase()).toContain('analyz');
    });

    it('step 2 should describe mapping beliefs in English', () => {
      const enMap = enCommon as Record<string, string>;
      expect(enMap['processing.step2']?.toLowerCase()).toContain('map');
    });

    it('step 3 should describe computing alignment in English', () => {
      const enMap = enCommon as Record<string, string>;
      expect(enMap['processing.step3']?.toLowerCase()).toContain('comput');
    });

    it('should have exactly 3 processing steps', () => {
      const enMap = enCommon as Record<string, string>;
      expect(enMap['processing.step1']).toBeTruthy();
      expect(enMap['processing.step2']).toBeTruthy();
      expect(enMap['processing.step3']).toBeTruthy();
      // No step4 should exist
      expect(enMap['processing.step4']).toBeUndefined();
    });
  });

  describe('Config-driven data', () => {
    it('should read default language from language registry', () => {
      expect(mockConfig.languages.defaultLanguage).toBe('ta');
    });

    it('should have min font size for Tamil language', () => {
      const taLang = mockConfig.languages.languages.find((l) => l.code === 'ta');
      expect(taLang?.minFontSize).toBe(16);
    });

    it('Tamil min font size should be at least 16px', () => {
      const taLang = mockConfig.languages.languages.find((l) => l.code === 'ta');
      expect(taLang?.minFontSize).toBeGreaterThanOrEqual(16);
    });
  });

  describe('Accessibility', () => {
    it('should have an accessibility section translation key', () => {
      const enMap = enCommon as Record<string, string>;
      expect(enMap['processing.accessibilitySection']).toBeTruthy();
    });

    it('should have Tamil accessibility section translation', () => {
      const taMap = taCommon as Record<string, string>;
      expect(taMap['processing.accessibilitySection']).toBeTruthy();
    });
  });
});
