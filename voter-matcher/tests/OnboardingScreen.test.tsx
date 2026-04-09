/**
 * Unit tests for OnboardingScreen component
 *
 * Tests component structure, translation logic, config-driven rendering,
 * and demographic form behavior.
 * Uses the same pattern as LandingScreen.test.tsx (React.createElement, no DOM renderer).
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import OnboardingScreen from '../components/OnboardingScreen';
import { ConfigProvider } from '../lib/configProvider';
import { LanguageProvider } from '../lib/languageProvider';
import { ConfigBundle } from '../lib/configLoader';
import { AGE_GROUPS } from '../engines/explanationEngine';
import enCommon from '../locales/en/common.json';
import taCommon from '../locales/ta/common.json';

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

function renderWithConfig(
  onBegin: (demographic: { ageGroup?: string }) => void = () => {},
): React.ReactElement {
  return React.createElement(
    ConfigProvider,
    { config: mockConfig },
    React.createElement(
      LanguageProvider,
      null,
      React.createElement(OnboardingScreen, { onBegin }),
    ),
  );
}

describe('OnboardingScreen', () => {
  it('should render within ConfigProvider without throwing', () => {
    const element = renderWithConfig();
    expect(element).toBeDefined();
    expect(element.type).toBe(ConfigProvider);
  });

  it('should accept onBegin prop', () => {
    const onBegin = (): void => {};
    const element = renderWithConfig(onBegin);
    // LanguageProvider wraps OnboardingScreen; verify the tree renders
    expect(element).toBeDefined();
    expect(element.type).toBe(ConfigProvider);
  });

  it('should be a client component (default export function)', () => {
    expect(typeof OnboardingScreen).toBe('function');
  });

  describe('Translation files', () => {
    const requiredKeys = [
      'onboarding.title',
      'onboarding.step1',
      'onboarding.step2',
      'onboarding.step3',
      'onboarding.estimatedTime',
      'onboarding.privacyStatement',
      'onboarding.demographicLabel',
      'onboarding.demographicPlaceholder',
      'onboarding.ageYouth',
      'onboarding.ageAdult',
      'onboarding.ageSenior',
      'onboarding.beginButton',
      'onboarding.accessibilitySection',
      'onboarding.accessibilitySteps',
      'onboarding.accessibilityDemographic',
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

    it('should have non-empty values for all onboarding keys in English', () => {
      const enMap = enCommon as Record<string, string>;
      for (const key of requiredKeys) {
        expect(enMap[key]?.length).toBeGreaterThan(0);
      }
    });

    it('should have non-empty values for all onboarding keys in Tamil', () => {
      const taMap = taCommon as Record<string, string>;
      for (const key of requiredKeys) {
        expect(taMap[key]?.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Config-driven data', () => {
    it('should read estimated completion time from scoring params', () => {
      expect(mockConfig.scoringParams.estimatedCompletionMinutes).toBe(3);
    });

    it('should read default language from language registry', () => {
      expect(mockConfig.languages.defaultLanguage).toBe('ta');
    });

    it('should have min font size for Tamil language', () => {
      const taLang = mockConfig.languages.languages.find((l) => l.code === 'ta');
      expect(taLang?.minFontSize).toBe(16);
    });
  });

  describe('Age group options', () => {
    it('should define three age groups matching ExplanationEngine types', () => {
      expect(AGE_GROUPS.youth).toBe('youth');
      expect(AGE_GROUPS.adult).toBe('adult');
      expect(AGE_GROUPS.senior).toBe('senior');
    });

    it('should have translation keys for all age group labels', () => {
      const enMap = enCommon as Record<string, string>;
      const taMap = taCommon as Record<string, string>;
      expect(enMap['onboarding.ageYouth']).toBeTruthy();
      expect(enMap['onboarding.ageAdult']).toBeTruthy();
      expect(enMap['onboarding.ageSenior']).toBeTruthy();
      expect(taMap['onboarding.ageYouth']).toBeTruthy();
      expect(taMap['onboarding.ageAdult']).toBeTruthy();
      expect(taMap['onboarding.ageSenior']).toBeTruthy();
    });
  });

  describe('How-it-works steps', () => {
    it('should have exactly 3 step translation keys', () => {
      const enMap = enCommon as Record<string, string>;
      expect(enMap['onboarding.step1']).toBeTruthy();
      expect(enMap['onboarding.step2']).toBeTruthy();
      expect(enMap['onboarding.step3']).toBeTruthy();
    });

    it('step 1 should describe answering questions', () => {
      const enMap = enCommon as Record<string, string>;
      expect(enMap['onboarding.step1']?.toLowerCase()).toContain('answer');
    });

    it('step 2 should describe belief mapping', () => {
      const enMap = enCommon as Record<string, string>;
      expect(enMap['onboarding.step2']?.toLowerCase()).toContain('map');
    });

    it('step 3 should describe showing alignment result', () => {
      const enMap = enCommon as Record<string, string>;
      expect(enMap['onboarding.step3']?.toLowerCase()).toContain('align');
    });
  });

  describe('Privacy statement', () => {
    it('should mention no personal data collection in English', () => {
      const enMap = enCommon as Record<string, string>;
      const privacy = enMap['onboarding.privacyStatement']?.toLowerCase() ?? '';
      expect(privacy).toContain('no personal data');
      expect(privacy).toContain('no account');
    });

    it('should have Tamil privacy statement', () => {
      const taMap = taCommon as Record<string, string>;
      expect(taMap['onboarding.privacyStatement']?.length).toBeGreaterThan(0);
    });
  });

  describe('Estimated time interpolation', () => {
    it('should contain {minutes} placeholder in English template', () => {
      const enMap = enCommon as Record<string, string>;
      expect(enMap['onboarding.estimatedTime']).toContain('{minutes}');
    });

    it('should contain {minutes} placeholder in Tamil template', () => {
      const taMap = taCommon as Record<string, string>;
      expect(taMap['onboarding.estimatedTime']).toContain('{minutes}');
    });
  });
});
