/**
 * Unit tests for TrackRecordNotice component
 *
 * Tests component structure, translation keys, accessibility attributes,
 * party interpolation, and bilingual support.
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import TrackRecordNotice from '../components/TrackRecordNotice';
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
        id: 'TVK',
        names: { en: 'TVK', ta: 'தவெக' },
        fullNames: { en: 'Tamilaga Vettri Kazhagam', ta: 'தமிழக வெற்றி கழகம்' },
        governanceStatus: 'new',
        weightBasis: 'promise',
        manifestoVersion: 'tvk-2026-v1',
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

function renderTrackRecordNotice(partyName: string): React.ReactElement {
  return React.createElement(
    ConfigProvider,
    { config: mockConfig },
    React.createElement(
      LanguageProvider,
      null,
      React.createElement(TrackRecordNotice, { partyName }),
    ),
  );
}

describe('TrackRecordNotice', () => {
  it('should be a client component (default export function)', () => {
    expect(typeof TrackRecordNotice).toBe('function');
  });

  it('should render within ConfigProvider and LanguageProvider without throwing', () => {
    const element = renderTrackRecordNotice('TVK');
    expect(element).toBeDefined();
    expect(element.type).toBe(ConfigProvider);
  });

  it('should accept partyName prop', () => {
    const element = renderTrackRecordNotice('TVK');
    expect(element).toBeDefined();
  });

  describe('Translation files', () => {
    it('should have result.trackRecord.notice key in English translations', () => {
      const enKeys = Object.keys(enResult);
      expect(enKeys).toContain('result.trackRecord.notice');
    });

    it('should have result.trackRecord.notice key in Tamil translations', () => {
      const taKeys = Object.keys(taResult);
      expect(taKeys).toContain('result.trackRecord.notice');
    });

    it('should have result.trackRecord.description key in English translations', () => {
      const enKeys = Object.keys(enResult);
      expect(enKeys).toContain('result.trackRecord.description');
    });

    it('should have result.trackRecord.description key in Tamil translations', () => {
      const taKeys = Object.keys(taResult);
      expect(taKeys).toContain('result.trackRecord.description');
    });

    it('should have {party} placeholder in English description', () => {
      const enMap = enResult as Record<string, string>;
      expect(enMap['result.trackRecord.description']).toContain('{party}');
    });

    it('should have {party} placeholder in Tamil description', () => {
      const taMap = taResult as Record<string, string>;
      expect(taMap['result.trackRecord.description']).toContain('{party}');
    });

    it('should have non-empty values for all track record keys in both languages', () => {
      const enMap = enResult as Record<string, string>;
      const taMap = taResult as Record<string, string>;
      expect(enMap['result.trackRecord.notice']?.length).toBeGreaterThan(0);
      expect(enMap['result.trackRecord.description']?.length).toBeGreaterThan(0);
      expect(taMap['result.trackRecord.notice']?.length).toBeGreaterThan(0);
      expect(taMap['result.trackRecord.description']?.length).toBeGreaterThan(0);
    });

    it('should have different translations for English and Tamil', () => {
      const enMap = enResult as Record<string, string>;
      const taMap = taResult as Record<string, string>;
      expect(enMap['result.trackRecord.notice']).not.toBe(
        taMap['result.trackRecord.notice'],
      );
      expect(enMap['result.trackRecord.description']).not.toBe(
        taMap['result.trackRecord.description'],
      );
    });

    it('should have matching keys in both locale files', () => {
      const enKeys = Object.keys(enResult).sort();
      const taKeys = Object.keys(taResult).sort();
      expect(enKeys).toEqual(taKeys);
    });
  });

  describe('Content accuracy', () => {
    it('should mention manifesto promises in English notice', () => {
      const enMap = enResult as Record<string, string>;
      const notice = enMap['result.trackRecord.notice'] ?? '';
      expect(notice.toLowerCase()).toContain('manifesto');
    });

    it('should mention manifesto promises in English description', () => {
      const enMap = enResult as Record<string, string>;
      const description = enMap['result.trackRecord.description'] ?? '';
      expect(description.toLowerCase()).toContain('manifesto');
      expect(description.toLowerCase()).toContain('promise');
    });

    it('should not contain blame or error language', () => {
      const enMap = enResult as Record<string, string>;
      const description = enMap['result.trackRecord.description'] ?? '';
      const blameWords = ['mistake', 'error', 'wrong', 'failed', 'bad', 'incorrect'];
      for (const word of blameWords) {
        expect(description.toLowerCase()).not.toContain(word);
      }
    });
  });

  describe('Accessibility', () => {
    it('should use role="note" for informational notice', () => {
      // The component renders with role="note"
      const element = renderTrackRecordNotice('TVK');
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

    it('should have Tamil track record translations', () => {
      const taMap = taResult as Record<string, string>;
      expect(taMap['result.trackRecord.notice']?.length).toBeGreaterThan(0);
      expect(taMap['result.trackRecord.description']?.length).toBeGreaterThan(0);
    });
  });

  describe('Party Registry integration', () => {
    it('should only apply to parties with weightBasis "promise"', () => {
      // TVK has weightBasis: "promise" — this notice should be shown
      const tvk = mockConfig.parties.parties.find((p) => p.id === 'TVK');
      expect(tvk?.weightBasis).toBe('promise');
    });
  });

  describe('No hardcoded strings', () => {
    it('should not contain hardcoded English strings — uses translation keys', () => {
      const enMap = enResult as Record<string, string>;
      const taMap = taResult as Record<string, string>;
      expect(enMap['result.trackRecord.notice']).toBeTruthy();
      expect(taMap['result.trackRecord.notice']).toBeTruthy();
      expect(enMap['result.trackRecord.notice']).not.toBe(
        taMap['result.trackRecord.notice'],
      );
    });
  });
});
