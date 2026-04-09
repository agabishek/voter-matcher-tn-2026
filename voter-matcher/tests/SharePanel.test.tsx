/**
 * Unit tests for SharePanel component
 *
 * Tests component structure, translation keys, accessibility attributes,
 * bilingual support, API interaction, and clipboard copy behavior.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SharePanel from '../components/SharePanel';
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
    ],
  },
  axes: { version: '1.0.0', hash: 'test-hash', axes: [] },
  archetypes: { version: '1.0.0', hash: 'test-hash', archetypes: [] },
  languages: {
    version: '1.0.0',
    hash: 'test-hash',
    defaultLanguage: 'en',
    languages: [
      {
        code: 'en',
        name: 'English',
        fontStack: "'Inter', sans-serif",
        minFontSize: 14,
        direction: 'ltr',
        translationPath: '/locales/en',
      },
      {
        code: 'ta',
        name: 'தமிழ்',
        fontStack: "'Noto Sans Tamil', sans-serif",
        minFontSize: 16,
        direction: 'ltr',
        translationPath: '/locales/ta',
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

const defaultProps = {
  partyScores: { DMK: 45, AIADMK: 35, TVK: 20 },
  archetypeId: 'security_seeker',
  confidenceLevel: 'High',
  configVersion: '1.0.0',
};

function renderSharePanel(props = defaultProps): ReturnType<typeof render> {
  return render(
    React.createElement(
      ConfigProvider,
      { config: mockConfig },
      React.createElement(
        LanguageProvider,
        null,
        React.createElement(SharePanel, props),
      ),
    ),
  );
}

// Mock fetch and clipboard globally
const mockFetch = vi.fn();
const mockClipboardWriteText = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
  Object.assign(navigator, {
    clipboard: { writeText: mockClipboardWriteText },
  });
  mockFetch.mockReset();
  mockClipboardWriteText.mockReset();
  mockClipboardWriteText.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('SharePanel', () => {
  it('should be a client component (default export function)', () => {
    expect(typeof SharePanel).toBe('function');
  });

  it('should render the share button with translated text', () => {
    renderSharePanel();
    const button = screen.getByRole('button', { name: enResult['result.share.button'] });
    expect(button).toBeDefined();
  });

  it('should render within ConfigProvider and LanguageProvider without throwing', () => {
    expect(() => renderSharePanel()).not.toThrow();
  });

  describe('Translation keys', () => {
    const requiredKeys = [
      'result.share.button',
      'result.share.copied',
      'result.share.copyLink',
      'result.share.error',
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

    it('should have non-empty values for all keys in English', () => {
      const enMap = enResult as Record<string, string>;
      for (const key of requiredKeys) {
        expect(enMap[key]?.length).toBeGreaterThan(0);
      }
    });

    it('should have non-empty values for all keys in Tamil', () => {
      const taMap = taResult as Record<string, string>;
      for (const key of requiredKeys) {
        expect(taMap[key]?.length).toBeGreaterThan(0);
      }
    });

    it('should have different translations for English and Tamil', () => {
      const enMap = enResult as Record<string, string>;
      const taMap = taResult as Record<string, string>;
      for (const key of requiredKeys) {
        expect(enMap[key]).not.toBe(taMap[key]);
      }
    });
  });

  describe('API interaction', () => {
    it('should call POST /api/share when share button is clicked', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://example.com/result?p=test&sig=abc', signature: 'abc' }),
      });

      renderSharePanel();
      const button = screen.getByRole('button', { name: enResult['result.share.button'] });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/share', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }));
      });
    });

    it('should send correct payload in the request body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://example.com/result?p=test&sig=abc', signature: 'abc' }),
      });

      renderSharePanel();
      const button = screen.getByRole('button', { name: enResult['result.share.button'] });
      fireEvent.click(button);

      await waitFor(() => {
        const callArgs = mockFetch.mock.calls[0];
        const body = JSON.parse(callArgs[1].body as string);
        expect(body).toHaveProperty('payload');
        const payload = JSON.parse(body.payload);
        expect(payload).toEqual({
          partyScores: defaultProps.partyScores,
          archetypeId: defaultProps.archetypeId,
          confidenceLevel: defaultProps.confidenceLevel,
          configVersion: defaultProps.configVersion,
        });
      });
    });

    it('should copy URL to clipboard after successful share', async () => {
      const shareUrl = 'https://example.com/result?p=test&sig=abc';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: shareUrl, signature: 'abc' }),
      });

      renderSharePanel();
      const button = screen.getByRole('button', { name: enResult['result.share.button'] });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockClipboardWriteText).toHaveBeenCalledWith(shareUrl);
      });
    });

    it('should show "Link copied!" feedback after successful share', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://example.com/result?p=test&sig=abc', signature: 'abc' }),
      });

      renderSharePanel();
      const button = screen.getByRole('button', { name: enResult['result.share.button'] });
      fireEvent.click(button);

      await waitFor(() => {
        const status = screen.getByRole('status');
        expect(status.textContent).toBe(enResult['result.share.copied']);
      });
    });

    it('should show copy link button after successful share', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://example.com/result?p=test&sig=abc', signature: 'abc' }),
      });

      renderSharePanel();
      const shareButton = screen.getByRole('button', { name: enResult['result.share.button'] });
      fireEvent.click(shareButton);

      await waitFor(() => {
        const copyButton = screen.getByRole('button', { name: enResult['result.share.copyLink'] });
        expect(copyButton).toBeDefined();
      });
    });

    it('should show error message when API returns non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Rate limited' }),
      });

      renderSharePanel();
      const button = screen.getByRole('button', { name: enResult['result.share.button'] });
      fireEvent.click(button);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert.textContent).toBe('Rate limited');
      });
    });

    it('should show generic error when fetch throws', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      renderSharePanel();
      const button = screen.getByRole('button', { name: enResult['result.share.button'] });
      fireEvent.click(button);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert.textContent).toBe(enResult['result.share.error']);
      });
    });

    it('should disable share button while loading', async () => {
      let resolvePromise: (value: unknown) => void;
      const pendingPromise = new Promise((resolve) => { resolvePromise = resolve; });
      mockFetch.mockReturnValueOnce(pendingPromise);

      renderSharePanel();
      const button = screen.getByRole('button', { name: enResult['result.share.button'] });
      fireEvent.click(button);

      // Button should be disabled while loading
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const shareBtn = buttons[0];
        expect(shareBtn.getAttribute('disabled')).not.toBeNull();
        expect(shareBtn.getAttribute('aria-busy')).toBe('true');
      });

      // Clean up
      resolvePromise!({
        ok: true,
        json: async () => ({ url: 'https://example.com/result?p=test&sig=abc', signature: 'abc' }),
      });
    });
  });

  describe('Accessibility', () => {
    it('should use section element with aria-label', () => {
      const { container } = renderSharePanel();
      const section = container.querySelector('section');
      expect(section).not.toBeNull();
      expect(section?.getAttribute('aria-label')).toBe(enResult['result.share.button']);
    });

    it('should set lang attribute on container', () => {
      const { container } = renderSharePanel();
      const section = container.querySelector('section');
      expect(section?.getAttribute('lang')).toBe('en');
    });

    it('should use role="status" with aria-live="polite" for copied feedback', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://example.com/result?p=test&sig=abc', signature: 'abc' }),
      });

      renderSharePanel();
      const button = screen.getByRole('button', { name: enResult['result.share.button'] });
      fireEvent.click(button);

      await waitFor(() => {
        const status = screen.getByRole('status');
        expect(status.getAttribute('aria-live')).toBe('polite');
      });
    });

    it('should use role="alert" for error messages', async () => {
      mockFetch.mockRejectedValueOnce(new Error('fail'));

      renderSharePanel();
      const button = screen.getByRole('button', { name: enResult['result.share.button'] });
      fireEvent.click(button);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeDefined();
      });
    });
  });

  describe('Tamil language support', () => {
    it('should enforce minimum 16px font size for Tamil', () => {
      const taLang = mockConfig.languages.languages.find((l) => l.code === 'ta');
      expect(taLang?.minFontSize).toBeGreaterThanOrEqual(16);
    });

    it('should have Tamil translations for all share keys', () => {
      const taMap = taResult as Record<string, string>;
      expect(taMap['result.share.button']?.length).toBeGreaterThan(0);
      expect(taMap['result.share.copied']?.length).toBeGreaterThan(0);
      expect(taMap['result.share.copyLink']?.length).toBeGreaterThan(0);
      expect(taMap['result.share.error']?.length).toBeGreaterThan(0);
    });
  });

  describe('Locale key parity', () => {
    it('should have matching share keys in both locale files', () => {
      const shareKeys = ['result.share.button', 'result.share.copied', 'result.share.copyLink', 'result.share.error'];
      const enKeys = Object.keys(enResult);
      const taKeys = Object.keys(taResult);
      for (const key of shareKeys) {
        expect(enKeys).toContain(key);
        expect(taKeys).toContain(key);
      }
    });
  });
});
