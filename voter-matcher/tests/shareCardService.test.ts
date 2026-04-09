/**
 * Tests for ShareCardService
 *
 * Covers:
 * - HMAC-SHA256 sign/verify round-trip
 * - Tampered payload fails verification
 * - Canvas generation produces valid output
 * - Anti-misinformation rules (monochrome, no logos, disclaimer present)
 */

import { describe, it, expect } from 'vitest';
import {
  ShareCardService,
  type ShareScoreResult,
  type ShareArchetypeResult,
  type ShareCardConfig,
} from '../lib/shareCardService';
import type { ConfigBundle } from '../lib/configLoader';

// ---------------------------------------------------------------------------
// Helpers — minimal ConfigBundle stub for share card tests
// ---------------------------------------------------------------------------

function makeConfig(): ConfigBundle {
  return {
    parties: {
      version: '1.0.0',
      hash: 'test',
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
      ],
    },
    axes: {
      version: '1.0.0',
      hash: 'test',
      axes: [],
    },
    archetypes: {
      version: '1.0.0',
      hash: 'test',
      archetypes: [
        {
          id: 'security_seeker',
          names: { en: 'Security Seeker', ta: 'பாதுகாப்பு தேடுபவர்' },
          dominantAxes: ['welfare', 'poverty'],
          ambiguityThreshold: 0.10,
          descriptions: {
            en: 'You prioritize direct government support.',
            ta: 'நீங்கள் நேரடி அரசு ஆதரவை முன்னுரிமை அளிக்கிறீர்கள்.',
          },
        },
      ],
    },
    languages: {
      version: '1.0.0',
      hash: 'test',
      defaultLanguage: 'ta',
      languages: [],
    },
    questions: {
      version: '1.0.0',
      hash: 'test',
      questions: [],
    },
    scoringParams: {
      version: '1.0.0',
      hash: 'test',
      questionCount: 30,
      optionsPerQuestion: 3,
      weightRange: { min: 0, max: 5 },
      minAnsweredThreshold: 0.5,
      collinearityThreshold: 0.7,
      discriminatingPowerThreshold: 1,
      confidenceFormula: 'dynamic',
      estimatedCompletionMinutes: 3,
      performanceTargets: { loadTime4G: 1000, loadTime2G: 3000, scoringTime: 200, concurrentUsers: 100000 },
      disclaimerText: {
        en: 'These results reflect your stated policy preferences and are not a voting recommendation. This tool is independent and not affiliated with any political party.',
        ta: 'இந்த முடிவுகள் உங்கள் கொள்கை விருப்பங்களை மட்டுமே பிரதிபலிக்கின்றன. இது வாக்களிக்க பரிந்துரை அல்ல. எந்த கட்சியுடனும் தொடர்பில்லை.',
      },
    },
    version: 'test-v1',
    loadedAt: new Date().toISOString(),
  };
}

function makeResult(overrides?: Partial<ShareScoreResult>): ShareScoreResult {
  return {
    partyScores: { DMK: 45, AIADMK: 30, TVK: 25 },
    confidenceScore: 'High',
    configVersion: 'test-v1',
    ...overrides,
  };
}

function makeArchetype(overrides?: Partial<ShareArchetypeResult>): ShareArchetypeResult {
  return {
    primary: 'security_seeker',
    isAmbiguous: false,
    ...overrides,
  };
}

const SECRET = 'test-secret-key-for-hmac';

// ---------------------------------------------------------------------------
// HMAC-SHA256 Sign / Verify
// ---------------------------------------------------------------------------

describe('ShareCardService — HMAC-SHA256', () => {
  const svc = new ShareCardService();

  it('sign/verify round-trip succeeds', () => {
    const payload = JSON.stringify({ partyScores: { DMK: 45, AIADMK: 30, TVK: 25 } });
    const sig = svc.sign(payload, SECRET);

    const url = `https://votematch.tn/result?p=${encodeURIComponent(payload)}&sig=${sig}`;
    expect(svc.verify(url, SECRET)).toBe(true);
  });

  it('tampered payload fails verification', () => {
    const payload = JSON.stringify({ partyScores: { DMK: 45, AIADMK: 30, TVK: 25 } });
    const sig = svc.sign(payload, SECRET);

    // Tamper with the payload
    const tampered = JSON.stringify({ partyScores: { DMK: 99, AIADMK: 1, TVK: 0 } });
    const url = `https://votematch.tn/result?p=${encodeURIComponent(tampered)}&sig=${sig}`;
    expect(svc.verify(url, SECRET)).toBe(false);
  });

  it('tampered signature fails verification', () => {
    const payload = JSON.stringify({ partyScores: { DMK: 45 } });
    const url = `https://votematch.tn/result?p=${encodeURIComponent(payload)}&sig=deadbeef`;
    expect(svc.verify(url, SECRET)).toBe(false);
  });

  it('missing query params returns false', () => {
    expect(svc.verify('https://votematch.tn/result', SECRET)).toBe(false);
    expect(svc.verify('https://votematch.tn/result?p=hello', SECRET)).toBe(false);
    expect(svc.verify('https://votematch.tn/result?sig=abc', SECRET)).toBe(false);
  });

  it('invalid URL returns false', () => {
    expect(svc.verify('not-a-url', SECRET)).toBe(false);
  });

  it('different secrets produce different signatures', () => {
    const payload = 'test-payload';
    const sig1 = svc.sign(payload, 'secret-a');
    const sig2 = svc.sign(payload, 'secret-b');
    expect(sig1).not.toBe(sig2);
  });

  it('same payload + same secret always produces same signature', () => {
    const payload = 'deterministic-test';
    const sig1 = svc.sign(payload, SECRET);
    const sig2 = svc.sign(payload, SECRET);
    expect(sig1).toBe(sig2);
  });
});

// ---------------------------------------------------------------------------
// Canvas generation
// ---------------------------------------------------------------------------

describe('ShareCardService — Canvas generation', () => {
  const svc = new ShareCardService();
  const config = makeConfig();
  const result = makeResult();
  const archetype = makeArchetype();

  it('produces a canvas with correct dimensions', () => {
    const canvas = svc.generateCanvas(result, archetype, 'en', config);
    expect(canvas.width).toBe(600);
    expect(canvas.height).toBe(800);
  });

  it('renders all party names as text', () => {
    const canvas = svc.generateCanvas(result, archetype, 'en', config);
    const texts = canvas.drawnTexts.map(t => t.text);
    expect(texts.some(t => t.includes('DMK'))).toBe(true);
    expect(texts.some(t => t.includes('AIADMK'))).toBe(true);
    expect(texts.some(t => t.includes('TVK'))).toBe(true);
  });

  it('renders party names in Tamil when lang=ta', () => {
    const canvas = svc.generateCanvas(result, archetype, 'ta', config);
    const texts = canvas.drawnTexts.map(t => t.text);
    expect(texts.some(t => t.includes('திமுக'))).toBe(true);
    expect(texts.some(t => t.includes('அதிமுக'))).toBe(true);
    expect(texts.some(t => t.includes('தவெக'))).toBe(true);
  });

  it('renders score percentages for each party', () => {
    const canvas = svc.generateCanvas(result, archetype, 'en', config);
    const texts = canvas.drawnTexts.map(t => t.text);
    expect(texts.some(t => t === '45%')).toBe(true);
    expect(texts.some(t => t === '30%')).toBe(true);
    expect(texts.some(t => t === '25%')).toBe(true);
  });

  it('renders archetype name', () => {
    const canvas = svc.generateCanvas(result, archetype, 'en', config);
    const texts = canvas.drawnTexts.map(t => t.text);
    expect(texts.some(t => t.includes('Security Seeker'))).toBe(true);
  });

  it('renders confidence level', () => {
    const canvas = svc.generateCanvas(result, archetype, 'en', config);
    const texts = canvas.drawnTexts.map(t => t.text);
    expect(texts.some(t => t.includes('Confidence: High'))).toBe(true);
  });

  it('accepts custom card config dimensions', () => {
    const customConfig: ShareCardConfig = { width: 400, height: 600, verifyBaseUrl: 'https://example.com' };
    const canvas = svc.generateCanvas(result, archetype, 'en', config, customConfig);
    expect(canvas.width).toBe(400);
    expect(canvas.height).toBe(600);
  });
});

// ---------------------------------------------------------------------------
// Anti-misinformation rules
// ---------------------------------------------------------------------------

describe('ShareCardService — Anti-misinformation rules', () => {
  const svc = new ShareCardService();
  const config = makeConfig();
  const result = makeResult();
  const archetype = makeArchetype();

  it('uses MONOCHROME only — no party colors', () => {
    const canvas = svc.generateCanvas(result, archetype, 'en', config);
    expect(canvas.usedColor).toBe(false);

    // Verify all fill styles are from the allowed zinc/grayscale palette
    const allowedFills = new Set([
      '#fafafa', '#f4f4f5', '#d4d4d8', '#71717a',
      '#3f3f46', '#27272a', '#18181b',
    ]);
    for (const rect of canvas.drawnRects) {
      expect(allowedFills.has(rect.fillStyle)).toBe(true);
    }
  });

  it('uses TEXT-ONLY party labels — no logos, no images', () => {
    const canvas = svc.generateCanvas(result, archetype, 'en', config);
    expect(canvas.usedImage).toBe(false);
  });

  it('disclaimer is ALWAYS visible at bottom of card', () => {
    const canvas = svc.generateCanvas(result, archetype, 'en', config);
    const texts = canvas.drawnTexts.map(t => t.text);

    // Disclaimer text must be present (may be wrapped across lines)
    const allText = texts.join(' ');
    expect(allText).toContain('not a voting recommendation');
    expect(allText).toContain('not affiliated with any political party');
  });

  it('disclaimer is present in Tamil when lang=ta', () => {
    const canvas = svc.generateCanvas(result, archetype, 'ta', config);
    const allText = canvas.drawnTexts.map(t => t.text).join(' ');
    expect(allText).toContain('வாக்களிக்க பரிந்துரை அல்ல');
  });

  it('verify URL is always included', () => {
    const canvas = svc.generateCanvas(result, archetype, 'en', config);
    const texts = canvas.drawnTexts.map(t => t.text);
    expect(texts.some(t => t.includes('Verify at:'))).toBe(true);
    expect(texts.some(t => t.includes('votematch.tn/methodology'))).toBe(true);
  });

  it('verify URL and disclaimer share the same bottom band (anti-crop)', () => {
    const canvas = svc.generateCanvas(result, archetype, 'en', config);

    // Find the dark bottom band
    const bottomBand = canvas.drawnRects.find(
      r => r.y + r.height === canvas.height && r.fillStyle === '#18181b'
    );
    expect(bottomBand).toBeDefined();

    // Verify URL must be inside the bottom band
    const verifyText = canvas.drawnTexts.find(t => t.text.includes('Verify at:'));
    expect(verifyText).toBeDefined();
    expect(verifyText!.y).toBeGreaterThanOrEqual(bottomBand!.y);
    expect(verifyText!.y).toBeLessThanOrEqual(canvas.height);

    // Disclaimer text must also be inside the bottom band
    const disclaimerTexts = canvas.drawnTexts.filter(t =>
      t.text.includes('not a voting recommendation') || t.text.includes('not affiliated')
    );
    for (const dt of disclaimerTexts) {
      expect(dt.y).toBeGreaterThanOrEqual(bottomBand!.y);
    }
  });

  it('monochrome rule holds for Tamil language too', () => {
    const canvas = svc.generateCanvas(result, archetype, 'ta', config);
    expect(canvas.usedColor).toBe(false);
    expect(canvas.usedImage).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// toDataURL
// ---------------------------------------------------------------------------

describe('ShareCardService — toDataURL', () => {
  const svc = new ShareCardService();

  it('returns a data URL string', () => {
    const canvas = svc.generateCanvas(makeResult(), makeArchetype(), 'en', makeConfig());
    const dataUrl = svc.toDataURL(canvas);
    expect(dataUrl).toContain('data:image/png');
  });

  it('returns stored dataUrl when present', () => {
    const canvas = {
      width: 100,
      height: 100,
      drawnTexts: [],
      drawnRects: [],
      usedColor: false,
      usedImage: false,
      dataUrl: 'data:image/png;base64,REAL_DATA',
    };
    expect(svc.toDataURL(canvas)).toBe('data:image/png;base64,REAL_DATA');
  });
});
