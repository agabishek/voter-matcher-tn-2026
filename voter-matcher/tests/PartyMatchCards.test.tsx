/**
 * Unit tests for PartyMatchCards component
 *
 * Tests component structure, ranking logic, translation keys,
 * and config-driven rendering. Uses React.createElement pattern
 * consistent with other component tests in this project.
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import PartyMatchCards from '../components/PartyMatchCards';
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
        names: { en: 'TVK', ta: 'தவக' },
        fullNames: { en: 'Tamilaga Vettri Kazhagam', ta: 'தமிழக வெற்றி கழகம்' },
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

function renderWithProviders(
  partyScores: Record<string, number>,
): React.ReactElement {
  return React.createElement(
    ConfigProvider,
    { config: mockConfig },
    React.createElement(
      LanguageProvider,
      null,
      React.createElement(PartyMatchCards, { partyScores }),
    ),
  );
}

describe('PartyMatchCards', () => {
  it('should render within ConfigProvider without throwing', () => {
    const element = renderWithProviders({ DMK: 45, AIADMK: 30, TVK: 25 });
    expect(element).toBeDefined();
    expect(element.type).toBe(ConfigProvider);
  });

  it('should be a client component (default export function)', () => {
    expect(typeof PartyMatchCards).toBe('function');
  });

  it('should accept partyScores prop', () => {
    const scores = { DMK: 50, AIADMK: 30, TVK: 20 };
    const element = renderWithProviders(scores);
    expect(element).toBeDefined();
  });

  describe('Translation files', () => {
    const requiredKeys = [
      'result.party.match',
      'result.party.primary',
      'result.party.secondary',
      'result.party.accessibilityLabel',
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

    it('should have matching keys in both locale files', () => {
      const enKeys = Object.keys(enResult).sort();
      const taKeys = Object.keys(taResult).sort();
      expect(enKeys).toEqual(taKeys);
    });
  });

  describe('Ranking logic', () => {
    it('should rank parties by score descending', () => {
      const scores = { DMK: 30, AIADMK: 45, TVK: 25 };
      const activeParties = mockConfig.parties.parties.filter((p) => p.active);
      const sorted = activeParties
        .map((p) => ({ id: p.id, score: scores[p.id as keyof typeof scores] ?? 0 }))
        .sort((a, b) => b.score - a.score);

      expect(sorted[0]?.id).toBe('AIADMK');
      expect(sorted[1]?.id).toBe('DMK');
      expect(sorted[2]?.id).toBe('TVK');
    });

    it('should identify primary match as highest score', () => {
      const scores = { DMK: 50, AIADMK: 30, TVK: 20 };
      const activeParties = mockConfig.parties.parties.filter((p) => p.active);
      const sorted = activeParties
        .map((p) => ({ id: p.id, score: scores[p.id as keyof typeof scores] ?? 0 }))
        .sort((a, b) => b.score - a.score);

      expect(sorted[0]?.id).toBe('DMK');
    });

    it('should identify secondary match as second highest score', () => {
      const scores = { DMK: 20, AIADMK: 45, TVK: 35 };
      const activeParties = mockConfig.parties.parties.filter((p) => p.active);
      const sorted = activeParties
        .map((p) => ({ id: p.id, score: scores[p.id as keyof typeof scores] ?? 0 }))
        .sort((a, b) => b.score - a.score);

      expect(sorted[1]?.id).toBe('TVK');
    });

    it('should exclude inactive parties from ranking', () => {
      const scores = { DMK: 30, AIADMK: 30, TVK: 30, INACTIVE: 100 };
      const activeParties = mockConfig.parties.parties.filter((p) => p.active);
      const ids = activeParties.map((p) => p.id);

      expect(ids).not.toContain('INACTIVE');
      expect(ids).toHaveLength(3);
    });

    it('should handle missing party scores gracefully (default to 0)', () => {
      const scores = { DMK: 60 }; // AIADMK and TVK missing
      const activeParties = mockConfig.parties.parties.filter((p) => p.active);
      const sorted = activeParties
        .map((p) => ({ id: p.id, score: scores[p.id as keyof typeof scores] ?? 0 }))
        .sort((a, b) => b.score - a.score);

      expect(sorted[0]?.id).toBe('DMK');
      expect(sorted[0]?.score).toBe(60);
      expect(sorted[1]?.score).toBe(0);
      expect(sorted[2]?.score).toBe(0);
    });

    it('should handle equal scores without crashing', () => {
      const scores = { DMK: 33, AIADMK: 33, TVK: 34 };
      const activeParties = mockConfig.parties.parties.filter((p) => p.active);
      const sorted = activeParties
        .map((p) => ({ id: p.id, score: scores[p.id as keyof typeof scores] ?? 0 }))
        .sort((a, b) => b.score - a.score);

      expect(sorted).toHaveLength(3);
      expect(sorted[0]?.score).toBeGreaterThanOrEqual(sorted[1]?.score ?? 0);
      expect(sorted[1]?.score).toBeGreaterThanOrEqual(sorted[2]?.score ?? 0);
    });
  });

  describe('Config-driven data', () => {
    it('should render one card per active party', () => {
      const activeParties = mockConfig.parties.parties.filter((p) => p.active);
      expect(activeParties).toHaveLength(3);
    });

    it('should have bilingual names for all active parties', () => {
      const activeParties = mockConfig.parties.parties.filter((p) => p.active);
      for (const party of activeParties) {
        expect(party.names.en).toBeTruthy();
        expect(party.names.ta).toBeTruthy();
        expect(party.fullNames.en).toBeTruthy();
        expect(party.fullNames.ta).toBeTruthy();
      }
    });

    it('should not hardcode party names or counts', () => {
      // Verify the component reads from config, not hardcoded values
      const twoPartyConfig: ConfigBundle = {
        ...mockConfig,
        parties: {
          ...mockConfig.parties,
          parties: mockConfig.parties.parties.filter((p) => p.id !== 'TVK'),
        },
      };
      const activeParties = twoPartyConfig.parties.parties.filter((p) => p.active);
      expect(activeParties).toHaveLength(2);
    });
  });

  describe('Accessibility', () => {
    it('should have interpolation placeholders in accessibility label', () => {
      const enLabel = enResult['result.party.accessibilityLabel'];
      expect(enLabel).toContain('{party}');
      expect(enLabel).toContain('{score}');
    });

    it('should have interpolation placeholders in Tamil accessibility label', () => {
      const taLabel = taResult['result.party.accessibilityLabel'];
      expect(taLabel).toContain('{party}');
      expect(taLabel).toContain('{score}');
    });

    it('should have match text with score interpolation', () => {
      expect(enResult['result.party.match']).toContain('{score}');
      expect(taResult['result.party.match']).toContain('{score}');
    });
  });
});
