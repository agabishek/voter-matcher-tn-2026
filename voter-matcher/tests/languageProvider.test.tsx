/**
 * Unit tests for LanguageProvider
 *
 * Tests the LanguageProvider React context, useLanguage hook,
 * t() translation function with interpolation, and localStorage persistence.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { ConfigProvider } from '../lib/configProvider';
import { LanguageProvider, useLanguage } from '../lib/languageProvider';
import { ConfigBundle } from '../lib/configLoader';
import enCommon from '../locales/en/common.json';
import taCommon from '../locales/ta/common.json';
import enQuestionnaire from '../locales/en/questionnaire.json';
import taQuestionnaire from '../locales/ta/questionnaire.json';
import enResult from '../locales/en/result.json';
import taResult from '../locales/ta/result.json';
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

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string): string | null => store[key] ?? null),
    setItem: vi.fn((key: string, value: string): void => { store[key] = value; }),
    removeItem: vi.fn((key: string): void => { delete store[key]; }),
    clear: vi.fn((): void => { store = {}; }),
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

function wrapper({ children }: { children: React.ReactNode }): React.JSX.Element {
  return React.createElement(
    ConfigProvider,
    { config: mockConfig },
    React.createElement(LanguageProvider, null, children),
  );
}

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});

describe('LanguageProvider', () => {
  describe('initialization', () => {
    it('should default to defaultLanguage from Language_Registry when no localStorage value', () => {
      const { result } = renderHook(() => useLanguage(), { wrapper });
      expect(result.current.activeLang).toBe('ta');
    });

    it('should restore language from localStorage if valid', () => {
      localStorageMock.setItem('voter-matcher-lang', 'en');
      const { result } = renderHook(() => useLanguage(), { wrapper });
      expect(result.current.activeLang).toBe('en');
    });

    it('should fall back to defaultLanguage if localStorage has invalid code', () => {
      localStorageMock.setItem('voter-matcher-lang', 'fr');
      const { result } = renderHook(() => useLanguage(), { wrapper });
      expect(result.current.activeLang).toBe('ta');
    });
  });

  describe('setLanguage', () => {
    it('should switch language without page reload (React state update)', () => {
      const { result } = renderHook(() => useLanguage(), { wrapper });
      expect(result.current.activeLang).toBe('ta');

      act(() => {
        result.current.setLanguage('en');
      });

      expect(result.current.activeLang).toBe('en');
    });

    it('should persist language preference to localStorage', () => {
      const { result } = renderHook(() => useLanguage(), { wrapper });

      act(() => {
        result.current.setLanguage('en');
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('voter-matcher-lang', 'en');
    });

    it('should ignore invalid language codes', () => {
      const { result } = renderHook(() => useLanguage(), { wrapper });

      act(() => {
        result.current.setLanguage('fr');
      });

      expect(result.current.activeLang).toBe('ta');
    });
  });

  describe('t() translation function', () => {
    it('should return Tamil translation for default language', () => {
      const { result } = renderHook(() => useLanguage(), { wrapper });
      const translated = result.current.t('app.title');
      expect(translated).toBe(taCommon['app.title']);
    });

    it('should return English translation after switching language', () => {
      const { result } = renderHook(() => useLanguage(), { wrapper });

      act(() => {
        result.current.setLanguage('en');
      });

      const translated = result.current.t('app.title');
      expect(translated).toBe(enCommon['app.title']);
    });

    it('should return the key itself when translation is not found', () => {
      const { result } = renderHook(() => useLanguage(), { wrapper });
      const translated = result.current.t('nonexistent.key');
      expect(translated).toBe('nonexistent.key');
    });

    it('should support template interpolation with {key} syntax', () => {
      const { result } = renderHook(() => useLanguage(), { wrapper });

      act(() => {
        result.current.setLanguage('en');
      });

      const translated = result.current.t('landing.questionsCount', { count: 30 });
      expect(translated).toBe('30 questions');
    });

    it('should support Tamil interpolation', () => {
      const { result } = renderHook(() => useLanguage(), { wrapper });
      const translated = result.current.t('landing.questionsCount', { count: 30 });
      expect(translated).toBe('30 கேள்விகள்');
    });

    it('should handle multiple interpolation values', () => {
      const { result } = renderHook(() => useLanguage(), { wrapper });

      act(() => {
        result.current.setLanguage('en');
      });

      const translated = result.current.t('questionnaire.progress.label', { current: 5, total: 30 });
      expect(translated).toBe('Question 5 of 30');
    });

    it('should return raw template when no values provided for interpolated key', () => {
      const { result } = renderHook(() => useLanguage(), { wrapper });

      act(() => {
        result.current.setLanguage('en');
      });

      const translated = result.current.t('landing.questionsCount');
      expect(translated).toBe('{count} questions');
    });
  });

  describe('translation file coverage', () => {
    it('should include keys from all locale files (common, questionnaire, result, explanation)', () => {
      const { result } = renderHook(() => useLanguage(), { wrapper });

      act(() => {
        result.current.setLanguage('en');
      });

      // common.json key
      expect(result.current.t('app.title')).toBe(enCommon['app.title']);
      // questionnaire.json key
      expect(result.current.t('questionnaire.skip.button')).toBe(enQuestionnaire['questionnaire.skip.button']);
      // result.json key
      expect(result.current.t('result.title')).toBe(enResult['result.title']);
      // explanation.json key
      expect(result.current.t('explanation.primary.label')).toBe(enExplanation['explanation.primary.label']);
    });

    it('should include Tamil keys from all locale files', () => {
      const { result } = renderHook(() => useLanguage(), { wrapper });

      expect(result.current.t('app.title')).toBe(taCommon['app.title']);
      expect(result.current.t('questionnaire.skip.button')).toBe(taQuestionnaire['questionnaire.skip.button']);
      expect(result.current.t('result.title')).toBe(taResult['result.title']);
      expect(result.current.t('explanation.primary.label')).toBe(taExplanation['explanation.primary.label']);
    });

    it('should have matching keys between en and ta for all locale files', () => {
      const enAllKeys = [
        ...Object.keys(enCommon),
        ...Object.keys(enQuestionnaire),
        ...Object.keys(enResult),
        ...Object.keys(enExplanation),
      ].sort();
      const taAllKeys = [
        ...Object.keys(taCommon),
        ...Object.keys(taQuestionnaire),
        ...Object.keys(taResult),
        ...Object.keys(taExplanation),
      ].sort();
      expect(enAllKeys).toEqual(taAllKeys);
    });
  });

  describe('error handling', () => {
    it('should throw when useLanguage is called outside LanguageProvider', () => {
      expect(() => {
        renderHook(() => useLanguage());
      }).toThrow('useLanguage must be used within a LanguageProvider');
    });
  });
});
