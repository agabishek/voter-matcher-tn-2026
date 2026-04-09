/**
 * Unit tests for NonPrimaryExplainer component
 *
 * Expert Panel Coverage:
 * - #5 Neutrality Auditor: Framing is "where priorities differ", not disparaging
 * - #10 Tamil Language: All text from engine/locales, bilingual rendering
 * - #19 Youth Advocate: Educational tone verified
 * - #21 Disability: Accessibility attributes verified
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NonPrimaryExplainer from '../components/NonPrimaryExplainer';
import { ConfigProvider } from '../lib/configProvider';
import { LanguageProvider } from '../lib/languageProvider';
import type { ConfigBundle } from '../lib/configLoader';
import type { NonPrimaryInsight } from '../engines/explanationEngine';
import enExplanation from '../locales/en/explanation.json';
import taExplanation from '../locales/ta/explanation.json';

const mockConfig: ConfigBundle = {
  parties: {
    version: '1.0.0', hash: 'h',
    parties: [
      { id: 'DMK', names: { en: 'DMK', ta: 'திமுக' }, fullNames: { en: 'DMK', ta: 'திமுக' }, governanceStatus: 'incumbent', weightBasis: 'track-record', manifestoVersion: 'v1', active: true },
    ],
  },
  axes: { version: '1.0.0', hash: 'h', axes: [] },
  archetypes: { version: '1.0.0', hash: 'h', archetypes: [] },
  languages: {
    version: '1.0.0', hash: 'h', defaultLanguage: 'en',
    languages: [
      { code: 'en', name: 'English', fontStack: "'Inter'", minFontSize: 14, direction: 'ltr', translationPath: '/locales/en' },
      { code: 'ta', name: 'தமிழ்', fontStack: "'Noto Sans Tamil'", minFontSize: 16, direction: 'ltr', translationPath: '/locales/ta' },
    ],
  },
  questions: { version: '1.0.0', hash: 'h', questions: [] },
  scoringParams: {
    version: '1.0.0', hash: 'h', questionCount: 30, optionsPerQuestion: 3,
    weightRange: { min: 0, max: 5 }, minAnsweredThreshold: 0.5, collinearityThreshold: 0.7,
    discriminatingPowerThreshold: 1, confidenceFormula: 'dynamic', estimatedCompletionMinutes: 3,
    performanceTargets: { loadTime4G: 1000, loadTime2G: 3000, scoringTime: 200, concurrentUsers: 100000 },
    disclaimerText: { en: 'Disclaimer', ta: 'மறுப்பு' },
  },
  version: 'v1', loadedAt: new Date().toISOString(),
};

const sampleInsights: NonPrimaryInsight[] = [
  {
    partyId: 'AIADMK',
    partyName: 'AIADMK',
    score: 30,
    divergenceAxes: [
      { axisLabel: 'Government Support Programs', explanation: 'AIADMK emphasizes government support programs, which wasn\'t among your top priorities.' },
      { axisLabel: 'Poverty Reduction', explanation: 'AIADMK emphasizes poverty reduction, which wasn\'t among your top priorities.' },
    ],
    summary: 'Your policy priorities differ from AIADMK\'s key focus areas.',
  },
  {
    partyId: 'TVK',
    partyName: 'TVK',
    score: 25,
    divergenceAxes: [
      { axisLabel: 'Anti-Corruption & Transparency', explanation: 'TVK emphasizes anti-corruption & transparency, which wasn\'t among your top priorities.' },
    ],
    summary: 'Your policy priorities differ from TVK\'s key focus areas.',
  },
];

function renderComponent(insights: readonly NonPrimaryInsight[] = sampleInsights): ReturnType<typeof render> {
  return render(
    React.createElement(ConfigProvider, { config: mockConfig },
      React.createElement(LanguageProvider, null,
        React.createElement(NonPrimaryExplainer, { insights })
      )
    )
  );
}

describe('NonPrimaryExplainer', () => {
  it('renders nothing when insights array is empty', () => {
    const { container } = renderComponent([]);
    expect(container.innerHTML).toBe('');
  });

  it('renders section title from translation keys', () => {
    renderComponent();
    expect(screen.getByText(enExplanation['explanation.nonPrimary.title'])).toBeDefined();
  });

  it('renders party names and scores for each insight', () => {
    renderComponent();
    expect(screen.getByText('AIADMK')).toBeDefined();
    expect(screen.getByText('TVK')).toBeDefined();
    // Score text uses translation key with interpolation
    expect(screen.getByText('30% match')).toBeDefined();
    expect(screen.getByText('25% match')).toBeDefined();
  });

  it('expands details on click and shows divergence axes', () => {
    renderComponent();
    // Click AIADMK to expand
    const aiadmkButton = screen.getByRole('button', { name: /AIADMK/i });
    fireEvent.click(aiadmkButton);

    expect(screen.getByText(/Government Support Programs/)).toBeDefined();
    expect(screen.getByText(/Poverty Reduction/)).toBeDefined();
  });

  it('collapses on second click', () => {
    renderComponent();
    const aiadmkButton = screen.getByRole('button', { name: /AIADMK/i });
    fireEvent.click(aiadmkButton);
    // Expanded — detail visible
    expect(screen.getByText(/Government Support Programs/)).toBeDefined();

    fireEvent.click(aiadmkButton);
    // Collapsed — detail should be gone
    expect(screen.queryByText(/Government Support Programs/)).toBeNull();
  });

  it('only one party expanded at a time', () => {
    renderComponent();
    const aiadmkButton = screen.getByRole('button', { name: /AIADMK/i });
    const tvkButton = screen.getByRole('button', { name: /TVK/i });

    fireEvent.click(aiadmkButton);
    expect(screen.getByText(/Government Support Programs/)).toBeDefined();

    fireEvent.click(tvkButton);
    // AIADMK should collapse, TVK should expand
    expect(screen.queryByText(/Government Support Programs/)).toBeNull();
    expect(screen.getByText(/Anti-Corruption/)).toBeDefined();
  });

  describe('Accessibility', () => {
    it('section has aria-labelledby', () => {
      const { container } = renderComponent();
      const section = container.querySelector('section');
      expect(section?.getAttribute('aria-labelledby')).toBe('non-primary-section-title');
    });

    it('expand buttons have aria-expanded', () => {
      renderComponent();
      const buttons = screen.getAllByRole('button');
      for (const btn of buttons) {
        expect(btn.getAttribute('aria-expanded')).toBeDefined();
      }
    });

    it('section has lang attribute', () => {
      const { container } = renderComponent();
      const section = container.querySelector('section');
      expect(section?.getAttribute('lang')).toBe('en');
    });
  });

  describe('Translation keys', () => {
    const requiredKeys = [
      'explanation.nonPrimary.title',
      'explanation.nonPrimary.divergence',
      'explanation.nonPrimary.score',
    ];

    it('all required keys exist in English and Tamil', () => {
      const en = enExplanation as Record<string, string>;
      const ta = taExplanation as Record<string, string>;
      for (const key of requiredKeys) {
        expect(Object.keys(en)).toContain(key);
        expect(Object.keys(ta)).toContain(key);
      }
    });

    it('English and Tamil translations differ', () => {
      const en = enExplanation as Record<string, string>;
      const ta = taExplanation as Record<string, string>;
      for (const key of requiredKeys) {
        expect(en[key]).not.toBe(ta[key]);
      }
    });
  });
});
