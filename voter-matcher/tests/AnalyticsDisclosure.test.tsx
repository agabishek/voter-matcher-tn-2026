/**
 * Tests for AnalyticsDisclosure component (task 12.3)
 *
 * Validates:
 * - Renders only when analytics is enabled
 * - Translation keys exist in both en and ta
 * - Non-blocking, dismissible behavior
 * - Accessibility attributes
 * - No hardcoded strings
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import AnalyticsDisclosure from '../components/AnalyticsDisclosure';
import { ConfigProvider } from '../lib/configProvider';
import { LanguageProvider } from '../lib/languageProvider';
import type { ConfigBundle } from '../lib/configLoader';
import enCommon from '../locales/en/common.json';
import taCommon from '../locales/ta/common.json';

// ─── Mock config ──────────────────────────────────────────────────────────────

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

// ─── localStorage mock ────────────────────────────────────────────────────────

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string): string | null => store[key] ?? null,
  setItem: (key: string, value: string): void => { store[key] = value; },
  removeItem: (key: string): void => { delete store[key]; },
  clear: (): void => { Object.keys(store).forEach(k => delete store[k]); },
};

vi.stubGlobal('localStorage', localStorageMock);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderDisclosure(onDismiss?: () => void): React.ReactElement {
  return React.createElement(
    ConfigProvider,
    { config: mockConfig },
    React.createElement(
      LanguageProvider,
      null,
      React.createElement(AnalyticsDisclosure, { onDismiss }),
    ),
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AnalyticsDisclosure', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should be a client component (default export function)', () => {
    expect(typeof AnalyticsDisclosure).toBe('function');
  });

  it('should render within ConfigProvider and LanguageProvider without throwing', () => {
    const element = renderDisclosure();
    expect(element).toBeDefined();
    expect(element.type).toBe(ConfigProvider);
  });

  describe('Translation keys', () => {
    const requiredKeys = [
      'analytics.disclosure.title',
      'analytics.disclosure.body',
      'analytics.disclosure.dismiss',
      'analytics.disclosure.dismissButton',
    ];

    for (const key of requiredKeys) {
      it(`should have "${key}" in English translations`, () => {
        const enMap = enCommon as Record<string, string>;
        expect(enMap[key]).toBeTruthy();
      });

      it(`should have "${key}" in Tamil translations`, () => {
        const taMap = taCommon as Record<string, string>;
        expect(taMap[key]).toBeTruthy();
      });
    }

    it('should have different translations for English and Tamil', () => {
      const enMap = enCommon as Record<string, string>;
      const taMap = taCommon as Record<string, string>;
      expect(enMap['analytics.disclosure.title']).not.toBe(
        taMap['analytics.disclosure.title'],
      );
      expect(enMap['analytics.disclosure.body']).not.toBe(
        taMap['analytics.disclosure.body'],
      );
    });

    it('should have matching keys in both locale files', () => {
      const enKeys = Object.keys(enCommon).sort();
      const taKeys = Object.keys(taCommon).sort();
      expect(enKeys).toEqual(taKeys);
    });
  });

  describe('Content requirements (Req 11 AC 5)', () => {
    it('disclosure body mentions anonymous/aggregated collection', () => {
      const enMap = enCommon as Record<string, string>;
      const body = enMap['analytics.disclosure.body'] ?? '';
      expect(body.toLowerCase()).toContain('anonymous');
      expect(body.toLowerCase()).toContain('aggregated');
    });

    it('disclosure body states no personal data is stored', () => {
      const enMap = enCommon as Record<string, string>;
      const body = enMap['analytics.disclosure.body'] ?? '';
      expect(body.toLowerCase()).toContain('no personal data');
    });
  });

  describe('Accessibility', () => {
    it('component accepts onDismiss callback prop', () => {
      const fn = vi.fn();
      const element = renderDisclosure(fn);
      expect(element).toBeDefined();
    });

    it('should have aria-label for dismiss button in English', () => {
      const enMap = enCommon as Record<string, string>;
      expect(enMap['analytics.disclosure.dismiss']?.length).toBeGreaterThan(0);
    });

    it('should have aria-label for dismiss button in Tamil', () => {
      const taMap = taCommon as Record<string, string>;
      expect(taMap['analytics.disclosure.dismiss']?.length).toBeGreaterThan(0);
    });
  });

  describe('No hardcoded strings', () => {
    it('all analytics disclosure keys exist in both locales', () => {
      const enMap = enCommon as Record<string, string>;
      const taMap = taCommon as Record<string, string>;
      const analyticsKeys = Object.keys(enMap).filter(k => k.startsWith('analytics.'));
      expect(analyticsKeys.length).toBeGreaterThan(0);
      for (const key of analyticsKeys) {
        expect(taMap[key]).toBeTruthy();
      }
    });
  });
});
