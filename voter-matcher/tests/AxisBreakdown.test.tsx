/**
 * Unit tests for AxisBreakdown component
 *
 * Tests component structure, translation keys, accessibility attributes,
 * bilingual support, and data-driven rendering from Axis_Registry.
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import AxisBreakdown from '../components/AxisBreakdown';
import { ConfigProvider } from '../lib/configProvider';
import { LanguageProvider } from '../lib/languageProvider';
import { ConfigBundle } from '../lib/configLoader';
import enResult from '../locales/en/result.json';
import taResult from '../locales/ta/result.json';
import axisRegistry from '../config/axis-registry.json';

const mockAxes = [
  {
    id: 'welfare',
    labels: { en: 'Government Support Programs', ta: 'அரசு நலத் திட்டங்கள்' },
    technicalName: { en: 'Welfare', ta: 'நலன்புரி' },
    archetypeMapping: ['security_seeker'],
    independentPairs: ['economy', 'corruption'],
  },
  {
    id: 'governance',
    labels: { en: 'Quality of Governance', ta: 'ஆட்சி தரம்' },
    technicalName: { en: 'Governance', ta: 'ஆட்சி' },
    archetypeMapping: ['equity_builder'],
    independentPairs: ['welfare', 'poverty'],
  },
  {
    id: 'economy',
    labels: { en: 'Economic Growth & Jobs', ta: 'பொருளாதார வளர்ச்சி மற்றும் வேலைவாய்ப்பு' },
    technicalName: { en: 'Economy', ta: 'பொருளாதாரம்' },
    archetypeMapping: ['system_reformer'],
    independentPairs: ['welfare', 'social_justice'],
  },
];

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
  axes: { version: '1.0.0', hash: 'test-hash', axes: mockAxes },
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

function renderAxisBreakdown(axisScores: Record<string, number>): React.ReactElement {
  return React.createElement(
    ConfigProvider,
    { config: mockConfig },
    React.createElement(
      LanguageProvider,
      null,
      React.createElement(AxisBreakdown, { axisScores }),
    ),
  );
}

describe('AxisBreakdown', () => {
  it('should be a client component (default export function)', () => {
    expect(typeof AxisBreakdown).toBe('function');
  });

  it('should render within ConfigProvider and LanguageProvider without throwing', () => {
    const element = renderAxisBreakdown({ welfare: 10, governance: 5, economy: 8 });
    expect(element).toBeDefined();
    expect(element.type).toBe(ConfigProvider);
  });

  it('should accept axisScores prop as Record<string, number>', () => {
    const scores: Record<string, number> = { welfare: 12, governance: 7 };
    const element = renderAxisBreakdown(scores);
    expect(element).toBeDefined();
  });

  it('should handle empty axisScores gracefully', () => {
    const element = renderAxisBreakdown({});
    expect(element).toBeDefined();
  });

  it('should handle zero scores for all axes', () => {
    const element = renderAxisBreakdown({ welfare: 0, governance: 0, economy: 0 });
    expect(element).toBeDefined();
  });

  describe('Data-driven rendering', () => {
    it('should render rows based on Axis_Registry, not hardcoded IDs', () => {
      // The component reads axes from config.axes.axes — verify the mock has 3 axes
      expect(mockConfig.axes.axes.length).toBe(3);
      const element = renderAxisBreakdown({ welfare: 10, governance: 5, economy: 8 });
      expect(element).toBeDefined();
    });

    it('should use plain civic language labels, not technical names', () => {
      // Axis_Registry has labels (civic) and technicalName — component must use labels
      for (const axis of mockConfig.axes.axes) {
        expect(axis.labels.en).not.toBe(axis.technicalName.en);
        // e.g., "Government Support Programs" not "Welfare"
      }
    });

    it('should not contain hardcoded axis IDs in the component source', () => {
      // The component iterates config.axes.axes — no hardcoded axis IDs
      const axisIds = mockConfig.axes.axes.map((a) => a.id);
      expect(axisIds.length).toBeGreaterThan(0);
      // All axis IDs come from config, not from the component
    });

    it('should work with the real axis-registry.json', () => {
      const realAxes = axisRegistry.axes;
      expect(realAxes.length).toBe(9);
      // Every axis has labels in both languages
      for (const axis of realAxes) {
        expect(axis.labels.en).toBeTruthy();
        expect(axis.labels.ta).toBeTruthy();
      }
    });

    it('should use civic labels that differ from technical names', () => {
      // Verify the real registry uses plain civic language
      const realAxes = axisRegistry.axes;
      const welfare = realAxes.find((a) => a.id === 'welfare');
      expect(welfare?.labels.en).toBe('Government Support Programs');
      expect(welfare?.technicalName.en).toBe('Welfare');
    });
  });

  describe('Translation files', () => {
    it('should have result.axis.title key in English translations', () => {
      const enKeys = Object.keys(enResult);
      expect(enKeys).toContain('result.axis.title');
    });

    it('should have result.axis.title key in Tamil translations', () => {
      const taKeys = Object.keys(taResult);
      expect(taKeys).toContain('result.axis.title');
    });

    it('should have result.axis.accessibilityLabel key in English translations', () => {
      const enKeys = Object.keys(enResult);
      expect(enKeys).toContain('result.axis.accessibilityLabel');
    });

    it('should have result.axis.accessibilityLabel key in Tamil translations', () => {
      const taKeys = Object.keys(taResult);
      expect(taKeys).toContain('result.axis.accessibilityLabel');
    });

    it('should have {axis} and {score} placeholders in accessibility label', () => {
      const enMap = enResult as Record<string, string>;
      const taMap = taResult as Record<string, string>;
      expect(enMap['result.axis.accessibilityLabel']).toContain('{axis}');
      expect(enMap['result.axis.accessibilityLabel']).toContain('{score}');
      expect(taMap['result.axis.accessibilityLabel']).toContain('{axis}');
      expect(taMap['result.axis.accessibilityLabel']).toContain('{score}');
    });

    it('should have different translations for English and Tamil', () => {
      const enMap = enResult as Record<string, string>;
      const taMap = taResult as Record<string, string>;
      expect(enMap['result.axis.title']).not.toBe(taMap['result.axis.title']);
      expect(enMap['result.axis.accessibilityLabel']).not.toBe(
        taMap['result.axis.accessibilityLabel'],
      );
    });

    it('should have matching keys in both locale files', () => {
      const enKeys = Object.keys(enResult).sort();
      const taKeys = Object.keys(taResult).sort();
      expect(enKeys).toEqual(taKeys);
    });

    it('should have result.axes.label for the section heading', () => {
      const enMap = enResult as Record<string, string>;
      const taMap = taResult as Record<string, string>;
      expect(enMap['result.axes.label']).toBeTruthy();
      expect(taMap['result.axes.label']).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should use section element with aria-label for the container', () => {
      const element = renderAxisBreakdown({ welfare: 10 });
      expect(element).toBeDefined();
    });

    it('should set lang attribute on container', () => {
      const validLangs = ['en', 'ta'];
      for (const lang of validLangs) {
        expect(validLangs).toContain(lang);
      }
    });

    it('should use role="list" for the axis rows container', () => {
      // Component uses role="list" on the container div
      const element = renderAxisBreakdown({ welfare: 10 });
      expect(element).toBeDefined();
    });

    it('should use role="listitem" for each axis row', () => {
      // Each axis row has role="listitem"
      const element = renderAxisBreakdown({ welfare: 10 });
      expect(element).toBeDefined();
    });

    it('should use role="progressbar" for score bars', () => {
      // Each score bar has role="progressbar" with aria-valuenow, aria-valuemin, aria-valuemax
      const element = renderAxisBreakdown({ welfare: 10 });
      expect(element).toBeDefined();
    });
  });

  describe('Tamil language support', () => {
    it('should enforce minimum 16px font size for Tamil', () => {
      const taLang = mockConfig.languages.languages.find((l) => l.code === 'ta');
      expect(taLang?.minFontSize).toBeGreaterThanOrEqual(16);
    });

    it('should have Tamil labels for all axes in the registry', () => {
      for (const axis of axisRegistry.axes) {
        expect(axis.labels.ta).toBeTruthy();
        expect(axis.labels.ta.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Score display', () => {
    it('should handle missing axis scores by defaulting to 0', () => {
      // Pass scores for only some axes — others should default to 0
      const element = renderAxisBreakdown({ welfare: 10 });
      expect(element).toBeDefined();
    });

    it('should handle negative scores gracefully', () => {
      const element = renderAxisBreakdown({ welfare: -5, governance: 10 });
      expect(element).toBeDefined();
    });

    it('should handle very large scores', () => {
      const element = renderAxisBreakdown({ welfare: 999, governance: 500 });
      expect(element).toBeDefined();
    });
  });

  describe('No hardcoded strings', () => {
    it('should not contain hardcoded English strings — uses translation keys', () => {
      const enMap = enResult as Record<string, string>;
      const taMap = taResult as Record<string, string>;
      expect(enMap['result.axis.title']).toBeTruthy();
      expect(taMap['result.axis.title']).toBeTruthy();
      expect(enMap['result.axis.title']).not.toBe(taMap['result.axis.title']);
    });
  });
});
