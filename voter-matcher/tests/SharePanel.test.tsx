/**
 * Unit tests for SharePanel component (receipt-style share card)
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
    version: '1.0.0', hash: 'test-hash',
    parties: [
      { id: 'DMK', names: { en: 'DMK', ta: 'திமுக' }, fullNames: { en: 'DMK', ta: 'திமுக' }, governanceStatus: 'incumbent', weightBasis: 'track-record', manifestoVersion: 'v1', active: true },
      { id: 'AIADMK', names: { en: 'AIADMK', ta: 'அதிமுக' }, fullNames: { en: 'AIADMK', ta: 'அதிமுக' }, governanceStatus: 'incumbent', weightBasis: 'track-record', manifestoVersion: 'v1', active: true },
      { id: 'TVK', names: { en: 'TVK', ta: 'தவெக' }, fullNames: { en: 'TVK', ta: 'தவெக' }, governanceStatus: 'new', weightBasis: 'promise', manifestoVersion: 'v1', active: true },
    ],
  },
  axes: { version: '1.0.0', hash: 'test-hash', axes: [] },
  archetypes: {
    version: '1.0.0', hash: 'test-hash',
    archetypes: [
      { id: 'security_seeker', names: { en: 'Security Seeker', ta: 'பாதுகாப்பு தேடுபவர்' }, dominantAxes: [], ambiguityThreshold: 0.1, descriptions: { en: '', ta: '' } },
    ],
  },
  languages: {
    version: '1.0.0', hash: 'test-hash', defaultLanguage: 'en',
    languages: [
      { code: 'en', name: 'English', fontStack: "'Inter', sans-serif", minFontSize: 14, direction: 'ltr', translationPath: '/locales/en' },
      { code: 'ta', name: 'தமிழ்', fontStack: "'Noto Sans Tamil', sans-serif", minFontSize: 16, direction: 'ltr', translationPath: '/locales/ta' },
    ],
  },
  questions: { version: '1.0.0', hash: 'test-hash', questions: [] },
  scoringParams: {
    version: '1.0.0', hash: 'test-hash', questionCount: 30, optionsPerQuestion: 3,
    weightRange: { min: 0, max: 5 }, minAnsweredThreshold: 0.5, collinearityThreshold: 0.7,
    discriminatingPowerThreshold: 1.0, confidenceFormula: 'dynamic', estimatedCompletionMinutes: 3,
    performanceTargets: { loadTime4G: 1000, loadTime2G: 3000, scoringTime: 200, concurrentUsers: 100000 },
    disclaimerText: { en: 'Test disclaimer text', ta: 'சோதனை மறுப்பு' },
  },
  version: 'test-version', loadedAt: new Date().toISOString(),
};

const defaultProps = {
  partyScores: { DMK: 45, AIADMK: 35, TVK: 20 },
  archetypeId: 'security_seeker',
  confidenceLevel: 'High',
  configVersion: '1.0.0',
};

function renderSharePanel(props = defaultProps): ReturnType<typeof render> {
  return render(
    React.createElement(ConfigProvider, { config: mockConfig },
      React.createElement(LanguageProvider, null,
        React.createElement(SharePanel, props)
      )
    )
  );
}

const mockClipboardWriteText = vi.fn();

beforeEach(() => {
  Object.assign(navigator, { clipboard: { writeText: mockClipboardWriteText } });
  mockClipboardWriteText.mockReset().mockResolvedValue(undefined);
  // Mock canvas getContext for jsdom
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
    fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', textAlign: 'left',
    fillRect: vi.fn(), strokeRect: vi.fn(), fillText: vi.fn(),
    beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(),
    setLineDash: vi.fn(), roundRect: vi.fn(), fill: vi.fn(), save: vi.fn(),
    restore: vi.fn(), clip: vi.fn(), drawImage: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 50 }),
  }) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,TEST');
  HTMLCanvasElement.prototype.toBlob = vi.fn().mockImplementation(function(this: HTMLCanvasElement, cb: BlobCallback) { cb(new Blob(['test'], { type: 'image/png' })); });

  // Mock Image so onload fires immediately (jsdom doesn't load images)
  const OrigImage = globalThis.Image;
  vi.stubGlobal('Image', class MockImage {
    crossOrigin = '';
    src = '';
    width = 24;
    height = 24;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor() {
      setTimeout(() => { if (this.onload) this.onload(); }, 0);
    }
  });
});

afterEach(() => { vi.restoreAllMocks(); });

describe('SharePanel', () => {
  it('renders the generate button initially', () => {
    renderSharePanel();
    expect(screen.getByRole('button', { name: /generate share card/i })).toBeDefined();
  });

  it('shows card preview after clicking generate', async () => {
    renderSharePanel();
    fireEvent.click(screen.getByRole('button', { name: /generate share card/i }));
    await waitFor(() => {
      const img = screen.getByRole('img');
      expect(img).toBeDefined();
      expect(img.getAttribute('src')).toContain('data:image/png');
    });
  });

  it('shows WhatsApp, download, and copy buttons after generating', async () => {
    renderSharePanel();
    fireEvent.click(screen.getByRole('button', { name: /generate share card/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: enResult['result.share.button'] })).toBeDefined();
      expect(screen.getByRole('button', { name: /download/i })).toBeDefined();
      expect(screen.getByRole('button', { name: enResult['result.share.copyLink'] })).toBeDefined();
    });
  });

  it('copies website URL when copy link is clicked', async () => {
    renderSharePanel();
    fireEvent.click(screen.getByRole('button', { name: /generate share card/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: enResult['result.share.copyLink'] })).toBeDefined();
    });
    fireEvent.click(screen.getByRole('button', { name: enResult['result.share.copyLink'] }));
    await waitFor(() => {
      expect(mockClipboardWriteText).toHaveBeenCalledWith('https://voter-matcher-tn-2026.vercel.app');
    });
  });

  describe('Translation keys', () => {
    const requiredKeys = [
      'result.share.button', 'result.share.copied', 'result.share.copyLink',
      'result.share.error', 'result.share.message',
    ];

    it('all required keys exist in English and Tamil', () => {
      for (const key of requiredKeys) {
        expect(Object.keys(enResult)).toContain(key);
        expect(Object.keys(taResult)).toContain(key);
      }
    });

    it('English and Tamil translations differ', () => {
      const en = enResult as Record<string, string>;
      const ta = taResult as Record<string, string>;
      for (const key of requiredKeys) {
        expect(en[key]).not.toBe(ta[key]);
      }
    });
  });

  describe('Accessibility', () => {
    it('uses section with aria-label and lang', () => {
      const { container } = renderSharePanel();
      const section = container.querySelector('section');
      expect(section?.getAttribute('aria-label')).toBe(enResult['result.share.button']);
      expect(section?.getAttribute('lang')).toBe('en');
    });
  });
});
