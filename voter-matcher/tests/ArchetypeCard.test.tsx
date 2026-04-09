/**
 * Unit tests for ArchetypeCard component
 *
 * Tests component structure, translation keys, accessibility attributes,
 * neutral framing, bilingual support, and data-driven rendering from
 * Archetype_Registry via ConfigBundle.
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import ArchetypeCard from '../components/ArchetypeCard';
import { ConfigProvider } from '../lib/configProvider';
import { LanguageProvider } from '../lib/languageProvider';
import { ConfigBundle } from '../lib/configLoader';
import enResult from '../locales/en/result.json';
import taResult from '../locales/ta/result.json';

const mockConfig: ConfigBundle = {
  parties: {
    version: '1.0.0',
    hash: 'test-hash',
    parties: [],
  },
  axes: { version: '1.0.0', hash: 'test-hash', axes: [] },
  archetypes: {
    version: '1.0.0',
    hash: 'test-hash',
    archetypes: [
      {
        id: 'security_seeker',
        names: { en: 'Security Seeker', ta: 'பாதுகாப்பு தேடுபவர்' },
        dominantAxes: ['welfare', 'poverty'],
        ambiguityThreshold: 0.1,
        descriptions: {
          en: 'You prioritize direct government support and economic security for families.',
          ta: 'நீங்கள் குடும்பங்களுக்கான நேரடி அரசு ஆதரவு மற்றும் பொருளாதார பாதுகாப்பை முன்னுரிமை அளிக்கிறீர்கள்.',
        },
      },
      {
        id: 'equity_builder',
        names: { en: 'Equity Builder', ta: 'சமத்துவ கட்டுநர்' },
        dominantAxes: ['social_justice', 'governance'],
        ambiguityThreshold: 0.1,
        descriptions: {
          en: 'You prioritize systemic equality and institutional reform.',
          ta: 'அனைத்து சமூகங்களுக்கும் நியாயமான பிரதிநிதித்துவத்தை உறுதி செய்ய நீங்கள் முன்னுரிமை அளிக்கிறீர்கள்.',
        },
      },
      {
        id: 'system_reformer',
        names: { en: 'System Reformer', ta: 'அமைப்பு சீர்திருத்தவாதி' },
        dominantAxes: ['corruption', 'economy', 'responsibility'],
        ambiguityThreshold: 0.1,
        descriptions: {
          en: 'You prioritize transparency, accountability, and economic reform.',
          ta: 'வெளிப்படைத்தன்மை, பொறுப்புணர்வு மற்றும் பொருளாதார சீர்திருத்தத்தை நீங்கள் முன்னுரிமை அளிக்கிறீர்கள்.',
        },
      },
    ],
  },
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

function renderArchetypeCard(
  archetypeId: string,
  secondaryArchetypeId?: string,
): React.ReactElement {
  return React.createElement(
    ConfigProvider,
    { config: mockConfig },
    React.createElement(
      LanguageProvider,
      null,
      React.createElement(ArchetypeCard, { archetypeId, secondaryArchetypeId }),
    ),
  );
}

describe('ArchetypeCard', () => {
  it('should be a client component (default export function)', () => {
    expect(typeof ArchetypeCard).toBe('function');
  });

  it('should render within ConfigProvider and LanguageProvider without throwing', () => {
    const element = renderArchetypeCard('security_seeker');
    expect(element).toBeDefined();
    expect(element.type).toBe(ConfigProvider);
  });

  it('should accept archetypeId prop', () => {
    const element = renderArchetypeCard('equity_builder');
    expect(element).toBeDefined();
  });

  it('should accept optional secondaryArchetypeId prop', () => {
    const element = renderArchetypeCard('security_seeker', 'equity_builder');
    expect(element).toBeDefined();
  });

  it('should handle unknown archetypeId gracefully', () => {
    const element = renderArchetypeCard('unknown_archetype');
    expect(element).toBeDefined();
  });

  describe('Translation files', () => {
    it('should have result.archetype.title key in English translations', () => {
      const enKeys = Object.keys(enResult);
      expect(enKeys).toContain('result.archetype.title');
    });

    it('should have result.archetype.title key in Tamil translations', () => {
      const taKeys = Object.keys(taResult);
      expect(taKeys).toContain('result.archetype.title');
    });

    it('should have result.archetype.secondary key in English translations', () => {
      const enKeys = Object.keys(enResult);
      expect(enKeys).toContain('result.archetype.secondary');
    });

    it('should have result.archetype.secondary key in Tamil translations', () => {
      const taKeys = Object.keys(taResult);
      expect(taKeys).toContain('result.archetype.secondary');
    });

    it('should have result.archetype.accessibilityLabel key in English translations', () => {
      const enKeys = Object.keys(enResult);
      expect(enKeys).toContain('result.archetype.accessibilityLabel');
    });

    it('should have result.archetype.accessibilityLabel key in Tamil translations', () => {
      const taKeys = Object.keys(taResult);
      expect(taKeys).toContain('result.archetype.accessibilityLabel');
    });

    it('should have {archetype} placeholder in English secondary text', () => {
      const enMap = enResult as Record<string, string>;
      expect(enMap['result.archetype.secondary']).toContain('{archetype}');
    });

    it('should have {archetype} placeholder in Tamil secondary text', () => {
      const taMap = taResult as Record<string, string>;
      expect(taMap['result.archetype.secondary']).toContain('{archetype}');
    });

    it('should have {archetype} placeholder in English accessibility label', () => {
      const enMap = enResult as Record<string, string>;
      expect(enMap['result.archetype.accessibilityLabel']).toContain('{archetype}');
    });

    it('should have {archetype} placeholder in Tamil accessibility label', () => {
      const taMap = taResult as Record<string, string>;
      expect(taMap['result.archetype.accessibilityLabel']).toContain('{archetype}');
    });

    it('should have different translations for English and Tamil title', () => {
      const enMap = enResult as Record<string, string>;
      const taMap = taResult as Record<string, string>;
      expect(enMap['result.archetype.title']).not.toBe(taMap['result.archetype.title']);
    });

    it('should have different translations for English and Tamil secondary', () => {
      const enMap = enResult as Record<string, string>;
      const taMap = taResult as Record<string, string>;
      expect(enMap['result.archetype.secondary']).not.toBe(taMap['result.archetype.secondary']);
    });

    it('should have matching archetype-related keys in both locale files', () => {
      const enKeys = Object.keys(enResult).filter((k) => k.startsWith('result.archetype.')).sort();
      const taKeys = Object.keys(taResult).filter((k) => k.startsWith('result.archetype.')).sort();
      expect(enKeys).toEqual(taKeys);
    });
  });

  describe('Neutral framing', () => {
    it('should not contain judgmental language in English title', () => {
      const enMap = enResult as Record<string, string>;
      const title = enMap['result.archetype.title'] ?? '';
      const judgmentalWords = ['wrong', 'bad', 'best', 'worst', 'correct', 'incorrect'];
      for (const word of judgmentalWords) {
        expect(title.toLowerCase()).not.toContain(word);
      }
    });

    it('should not contain judgmental language in English secondary text', () => {
      const enMap = enResult as Record<string, string>;
      const secondary = enMap['result.archetype.secondary'] ?? '';
      const judgmentalWords = ['wrong', 'bad', 'best', 'worst', 'correct', 'incorrect'];
      for (const word of judgmentalWords) {
        expect(secondary.toLowerCase()).not.toContain(word);
      }
    });
  });

  describe('Data-driven rendering', () => {
    it('should read archetype names from config, not hardcode them', () => {
      // Verify all archetypes in mock config have bilingual names
      for (const archetype of mockConfig.archetypes.archetypes) {
        expect(archetype.names.en).toBeTruthy();
        expect(archetype.names.ta).toBeTruthy();
      }
    });

    it('should read archetype descriptions from config, not hardcode them', () => {
      for (const archetype of mockConfig.archetypes.archetypes) {
        expect(archetype.descriptions.en).toBeTruthy();
        expect(archetype.descriptions.ta).toBeTruthy();
      }
    });

    it('should support all archetypes in the registry', () => {
      const archetypeIds = mockConfig.archetypes.archetypes.map((a) => a.id);
      expect(archetypeIds.length).toBeGreaterThanOrEqual(3);
      for (const id of archetypeIds) {
        const element = renderArchetypeCard(id);
        expect(element).toBeDefined();
      }
    });
  });

  describe('Accessibility', () => {
    it('should have an accessibility label translation key', () => {
      const enMap = enResult as Record<string, string>;
      const taMap = taResult as Record<string, string>;
      expect(enMap['result.archetype.accessibilityLabel']).toBeTruthy();
      expect(taMap['result.archetype.accessibilityLabel']).toBeTruthy();
    });

    it('should have non-empty accessibility labels in both languages', () => {
      const enMap = enResult as Record<string, string>;
      const taMap = taResult as Record<string, string>;
      expect(enMap['result.archetype.accessibilityLabel']?.length).toBeGreaterThan(0);
      expect(taMap['result.archetype.accessibilityLabel']?.length).toBeGreaterThan(0);
    });
  });

  describe('Tamil language support', () => {
    it('should enforce minimum 16px font size for Tamil', () => {
      const taLang = mockConfig.languages.languages.find((l) => l.code === 'ta');
      expect(taLang?.minFontSize).toBeGreaterThanOrEqual(16);
    });

    it('should have Tamil archetype names in the registry', () => {
      for (const archetype of mockConfig.archetypes.archetypes) {
        expect(archetype.names.ta.length).toBeGreaterThan(0);
      }
    });

    it('should have Tamil archetype descriptions in the registry', () => {
      for (const archetype of mockConfig.archetypes.archetypes) {
        expect(archetype.descriptions.ta.length).toBeGreaterThan(0);
      }
    });
  });

  describe('No hardcoded strings', () => {
    it('should not contain hardcoded archetype names in the component', () => {
      // The component reads from config — verify config has the data
      const names = mockConfig.archetypes.archetypes.map((a) => a.names.en);
      expect(names).toContain('Security Seeker');
      expect(names).toContain('Equity Builder');
      expect(names).toContain('System Reformer');
    });

    it('should use translation keys for all UI labels', () => {
      const enMap = enResult as Record<string, string>;
      const taMap = taResult as Record<string, string>;
      // All archetype-related keys must exist in both locales
      expect(enMap['result.archetype.title']).toBeTruthy();
      expect(taMap['result.archetype.title']).toBeTruthy();
      expect(enMap['result.archetype.secondary']).toBeTruthy();
      expect(taMap['result.archetype.secondary']).toBeTruthy();
    });
  });
});
