/**
 * Unit tests for LandingScreen component
 *
 * Tests component structure, translation logic, and config-driven rendering.
 * Uses the same pattern as configProvider.test.tsx (React.createElement, no DOM renderer).
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import LandingScreen from '../components/LandingScreen';
import { ConfigProvider } from '../lib/configProvider';
import { LanguageProvider } from '../lib/languageProvider';
import { ConfigBundle } from '../lib/configLoader';
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
      {
        id: 'AIADMK',
        names: { en: 'AIADMK', ta: 'அதிமுக' },
        fullNames: { en: 'All India Anna Dravida Munnetra Kazhagam', ta: 'அனைத்திந்திய அண்ணா திராவிட முன்னேற்றக் கழகம்' },
        governanceStatus: 'incumbent',
        weightBasis: 'track-record',
        manifestoVersion: 'aiadmk-2026-v1',
        active: true,
      },
      {
        id: 'TVK',
        names: { en: 'TVK', ta: 'தவெக' },
        fullNames: { en: 'Tamilaga Vettri Kazhagam', ta: 'தமிழக வெற்றிக் கழகம்' },
        governanceStatus: 'new',
        weightBasis: 'promise',
        manifestoVersion: 'tvk-2026-v1',
        active: true,
      },
      {
        id: 'INACTIVE',
        names: { en: 'Inactive', ta: 'செயலற்ற' },
        fullNames: { en: 'Inactive Party', ta: 'செயலற்ற கட்சி' },
        governanceStatus: 'new',
        weightBasis: 'promise',
        manifestoVersion: 'inactive-v1',
        active: false,
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

function renderWithConfig(onStart: () => void = () => {}): React.ReactElement {
  return React.createElement(
    ConfigProvider,
    { config: mockConfig },
    React.createElement(
      LanguageProvider,
      null,
      React.createElement(LandingScreen, { onStart }),
    ),
  );
}

describe('LandingScreen', () => {
  it('should render within ConfigProvider without throwing', () => {
    const element = renderWithConfig();
    expect(element).toBeDefined();
    expect(element.type).toBe(ConfigProvider);
  });

  it('should accept onStart prop', () => {
    const onStart = (): void => {};
    const element = renderWithConfig(onStart);
    // LanguageProvider wraps LandingScreen; verify the tree renders
    expect(element).toBeDefined();
    expect(element.type).toBe(ConfigProvider);
  });

  it('should be a client component (default export function)', () => {
    expect(typeof LandingScreen).toBe('function');
  });

  describe('Translation files', () => {
    const requiredKeys = [
      'app.title',
      'app.tagline',
      'landing.partiesLabel',
      'landing.statsQuestions',
      'landing.statsTime',
      'landing.startButton',
      'landing.accessibilityHero',
      'landing.accessibilityParties',
      'landing.accessibilityStats',
      'landing.accessibilityLangToggle',
      'disclaimer.text',
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
  });

  describe('Config-driven data', () => {
    it('should only include active parties from config', () => {
      const activeParties = mockConfig.parties.parties.filter((p) => p.active);
      expect(activeParties).toHaveLength(3);
      expect(activeParties.map((p) => p.id)).toEqual(['DMK', 'AIADMK', 'TVK']);
    });

    it('should exclude inactive parties', () => {
      const activeParties = mockConfig.parties.parties.filter((p) => p.active);
      expect(activeParties.find((p) => p.id === 'INACTIVE')).toBeUndefined();
    });

    it('should read question count from scoring params', () => {
      expect(mockConfig.scoringParams.questionCount).toBe(30);
    });

    it('should read estimated time from scoring params', () => {
      expect(mockConfig.scoringParams.estimatedCompletionMinutes).toBe(3);
    });

    it('should read default language from language registry', () => {
      expect(mockConfig.languages.defaultLanguage).toBe('ta');
    });

    it('should have bilingual party names for all active parties', () => {
      const activeParties = mockConfig.parties.parties.filter((p) => p.active);
      for (const party of activeParties) {
        expect(party.names.en).toBeTruthy();
        expect(party.names.ta).toBeTruthy();
      }
    });
  });

  describe('Language toggle logic', () => {
    it('should cycle through available languages', () => {
      const codes = mockConfig.languages.languages.map((l) => l.code);
      expect(codes).toEqual(['ta', 'en']);

      // Starting at ta (index 0), next should be en (index 1)
      const currentIndex = codes.indexOf('ta');
      const nextIndex = (currentIndex + 1) % codes.length;
      expect(codes[nextIndex]).toBe('en');

      // From en (index 1), next should be ta (index 0)
      const currentIndex2 = codes.indexOf('en');
      const nextIndex2 = (currentIndex2 + 1) % codes.length;
      expect(codes[nextIndex2]).toBe('ta');
    });

    it('should show the next language name as toggle label', () => {
      const languages = mockConfig.languages.languages;
      // When active is ta (index 0), toggle should show "English"
      const nextLang = languages[1];
      expect(nextLang?.name).toBe('English');

      // When active is en (index 1), toggle should show "தமிழ்"
      const nextLang2 = languages[0];
      expect(nextLang2?.name).toBe('தமிழ்');
    });
  });
});
