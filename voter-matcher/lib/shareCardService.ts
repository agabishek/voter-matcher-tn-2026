/**
 * ShareCardService — generates tamper-proof, misinformation-resistant share cards
 *
 * Anti-misinformation rules enforced by design:
 * 1. MONOCHROME only — no party colors (all grayscale / zinc palette)
 * 2. TEXT-ONLY party labels — no logos, no images
 * 3. Disclaimer ALWAYS visible at bottom of card
 * 4. Methodology / verify URL always included
 * 5. Card layout prevents easy cropping of disclaimer
 *
 * HMAC-SHA256 signing uses Node.js crypto for server-side operations.
 * The signed URL prevents forgery of result links (Requirement 12 AC 9, Requirement 15 AC 5).
 *
 * @module lib/shareCardService
 */

import { createHmac } from 'crypto';
import type { ConfigBundle, ScoringParams } from './configLoader';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Minimal score result needed for share card generation */
export interface ShareScoreResult {
  readonly partyScores: Readonly<Record<string, number>>;
  readonly confidenceScore: 'High' | 'Medium' | 'Low';
  readonly configVersion: string;
}

/** Minimal archetype result needed for share card generation */
export interface ShareArchetypeResult {
  readonly primary: string;
  readonly secondary?: string;
  readonly isAmbiguous: boolean;
}

/** Configuration for the share card renderer */
export interface ShareCardConfig {
  readonly width: number;
  readonly height: number;
  readonly verifyBaseUrl: string;
}

/** Represents a rendered share card (abstracted from HTMLCanvasElement for testability) */
export interface ShareCardCanvas {
  readonly width: number;
  readonly height: number;
  /** All text items drawn on the canvas, for verification */
  readonly drawnTexts: ReadonlyArray<DrawnText>;
  /** All rectangles drawn on the canvas */
  readonly drawnRects: ReadonlyArray<DrawnRect>;
  /** Whether any non-grayscale color was used */
  readonly usedColor: boolean;
  /** Whether any image/logo was drawn */
  readonly usedImage: boolean;
  /** Raw data URL (base64 PNG) — only populated when backed by a real canvas */
  readonly dataUrl?: string;
}

export interface DrawnText {
  readonly text: string;
  readonly x: number;
  readonly y: number;
  readonly font: string;
  readonly fillStyle: string;
  readonly textAlign: string;
}

export interface DrawnRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly fillStyle: string;
}

// ---------------------------------------------------------------------------
// Color helpers — enforce monochrome palette
// ---------------------------------------------------------------------------

const ZINC_50 = '#fafafa';
const ZINC_100 = '#f4f4f5';
const ZINC_300 = '#d4d4d8';
const ZINC_500 = '#71717a';
const ZINC_700 = '#3f3f46';
const ZINC_800 = '#27272a';
const ZINC_900 = '#18181b';

const ALLOWED_FILLS = new Set([ZINC_50, ZINC_100, ZINC_300, ZINC_500, ZINC_700, ZINC_800, ZINC_900]);

function isGrayscale(color: string): boolean {
  if (ALLOWED_FILLS.has(color)) return true;
  // Accept any #rrggbb where r === g === b
  const hex = color.replace('#', '');
  if (hex.length === 6) {
    return hex.slice(0, 2) === hex.slice(2, 4) && hex.slice(2, 4) === hex.slice(4, 6);
  }
  return false;
}

// ---------------------------------------------------------------------------
// ShareCardService
// ---------------------------------------------------------------------------

const DEFAULT_CARD_CONFIG: ShareCardConfig = {
  width: 600,
  height: 800,
  verifyBaseUrl: 'https://voter-matcher-tn-2026.vercel.app/methodology',
};

export class ShareCardService {
  // -----------------------------------------------------------------------
  // Canvas generation — monochrome, text-only, disclaimer always visible
  // -----------------------------------------------------------------------

  /**
   * Generate a monochrome share card with text-only party labels.
   *
   * Anti-misinformation rules enforced:
   * - All fills are grayscale (zinc palette)
   * - Party names rendered as plain text — no logos, no images
   * - Disclaimer occupies the bottom band and cannot be cropped without
   *   also removing the verify URL (they share the same visual block)
   * - Methodology / verify URL always present
   */
  generateCanvas(
    result: ShareScoreResult,
    archetype: ShareArchetypeResult,
    lang: 'en' | 'ta',
    config: ConfigBundle,
    cardConfig: ShareCardConfig = DEFAULT_CARD_CONFIG,
  ): ShareCardCanvas {
    const { width, height } = cardConfig;

    const drawnTexts: DrawnText[] = [];
    const drawnRects: DrawnRect[] = [];
    let usedColor = false;
    let usedImage = false;

    // Helper to record a fill and check monochrome rule
    const recordFill = (fill: string): void => {
      if (!isGrayscale(fill)) {
        usedColor = true;
      }
    };

    // --- Background ---
    const bgFill = ZINC_50;
    recordFill(bgFill);
    drawnRects.push({ x: 0, y: 0, width, height, fillStyle: bgFill });

    // --- Title ---
    const titleY = 60;
    const titleText = lang === 'ta' ? 'உங்கள் கொள்கை பொருத்தம்' : 'Your Policy Match';
    const titleFont = lang === 'ta' ? 'bold 28px "Noto Sans Tamil", sans-serif' : 'bold 28px "Inter", sans-serif';
    drawnTexts.push({ text: titleText, x: width / 2, y: titleY, font: titleFont, fillStyle: ZINC_900, textAlign: 'center' });
    recordFill(ZINC_900);

    // --- Party scores (text-only, no logos, no party colors) ---
    const parties = config.parties.parties.filter(p => p.active);
    const barAreaTop = 110;
    const barHeight = 36;
    const barGap = 18;
    const barMaxWidth = width - 120;

    for (let i = 0; i < parties.length; i++) {
      const party = parties[i];
      const score = result.partyScores[party.id] ?? 0;
      const y = barAreaTop + i * (barHeight + barGap);

      // Party label (text-only)
      const partyName = party.names[lang] ?? party.names['en'] ?? party.id;
      const labelFont = lang === 'ta' ? '18px "Noto Sans Tamil", sans-serif' : '18px "Inter", sans-serif';
      drawnTexts.push({ text: partyName, x: 30, y: y + 24, font: labelFont, fillStyle: ZINC_800, textAlign: 'left' });
      recordFill(ZINC_800);

      // Score bar background (monochrome)
      const barX = 120;
      drawnRects.push({ x: barX, y, width: barMaxWidth, height: barHeight, fillStyle: ZINC_100 });
      recordFill(ZINC_100);

      // Score bar fill (monochrome)
      const fillWidth = Math.max(0, (score / 100) * barMaxWidth);
      drawnRects.push({ x: barX, y, width: fillWidth, height: barHeight, fillStyle: ZINC_700 });
      recordFill(ZINC_700);

      // Score percentage text
      const scoreText = `${Math.round(score)}%`;
      drawnTexts.push({ text: scoreText, x: barX + barMaxWidth + 10, y: y + 24, font: labelFont, fillStyle: ZINC_800, textAlign: 'left' });
    }

    // --- Archetype ---
    const archetypeY = barAreaTop + parties.length * (barHeight + barGap) + 30;
    const archetypeEntry = config.archetypes.archetypes.find(a => a.id === archetype.primary);
    const archetypeName = archetypeEntry
      ? (archetypeEntry.names[lang] ?? archetypeEntry.names['en'] ?? archetype.primary)
      : archetype.primary;
    const archetypeLabel = lang === 'ta' ? 'உங்கள் வகை:' : 'Your Archetype:';
    const archetypeFont = lang === 'ta' ? 'bold 20px "Noto Sans Tamil", sans-serif' : 'bold 20px "Inter", sans-serif';
    drawnTexts.push({ text: `${archetypeLabel} ${archetypeName}`, x: width / 2, y: archetypeY, font: archetypeFont, fillStyle: ZINC_800, textAlign: 'center' });
    recordFill(ZINC_800);

    // --- Confidence ---
    const confidenceY = archetypeY + 40;
    const confidenceLabels: Record<string, Record<string, string>> = {
      High: { en: 'Confidence: High', ta: 'நம்பிக்கை: உயர்' },
      Medium: { en: 'Confidence: Medium', ta: 'நம்பிக்கை: நடுத்தர' },
      Low: { en: 'Confidence: Low', ta: 'நம்பிக்கை: குறைவு' },
    };
    const confidenceText = confidenceLabels[result.confidenceScore]?.[lang] ?? `Confidence: ${result.confidenceScore}`;
    const confFont = lang === 'ta' ? '16px "Noto Sans Tamil", sans-serif' : '16px "Inter", sans-serif';
    drawnTexts.push({ text: confidenceText, x: width / 2, y: confidenceY, font: confFont, fillStyle: ZINC_500, textAlign: 'center' });
    recordFill(ZINC_500);

    // --- Disclaimer band (bottom, cannot be cropped without losing verify URL) ---
    const disclaimerBandHeight = 160;
    const disclaimerBandY = height - disclaimerBandHeight;

    // Disclaimer background band
    drawnRects.push({ x: 0, y: disclaimerBandY, width, height: disclaimerBandHeight, fillStyle: ZINC_900 });
    recordFill(ZINC_900);

    // Disclaimer text
    const disclaimerText = this.getDisclaimerText(config.scoringParams, lang);
    const disclaimerFont = lang === 'ta' ? '13px "Noto Sans Tamil", sans-serif' : '13px "Inter", sans-serif';
    const disclaimerLines = this.wrapText(disclaimerText, 70);
    let disclaimerLineY = disclaimerBandY + 30;
    for (const line of disclaimerLines) {
      drawnTexts.push({ text: line, x: width / 2, y: disclaimerLineY, font: disclaimerFont, fillStyle: ZINC_300, textAlign: 'center' });
      disclaimerLineY += 20;
    }
    recordFill(ZINC_300);

    // Verify URL (inside disclaimer band — cropping disclaimer also removes URL)
    const verifyY = height - 30;
    const verifyText = lang === 'ta'
      ? `சரிபார்க்க: ${cardConfig.verifyBaseUrl}`
      : `Verify at: ${cardConfig.verifyBaseUrl}`;
    drawnTexts.push({ text: verifyText, x: width / 2, y: verifyY, font: disclaimerFont, fillStyle: ZINC_300, textAlign: 'center' });

    return {
      width,
      height,
      drawnTexts,
      drawnRects,
      usedColor,
      usedImage,
    };
  }

  // -----------------------------------------------------------------------
  // HMAC-SHA256 signing & verification (Node.js crypto)
  // -----------------------------------------------------------------------

  /**
   * Sign a payload string with HMAC-SHA256.
   * @param payload JSON-stringified result data
   * @param secret  Server-side secret key
   * @returns Hex-encoded HMAC signature
   */
  sign(payload: string, secret: string): string {
    return createHmac('sha256', secret).update(payload, 'utf-8').digest('hex');
  }

  /**
   * Verify an HMAC-SHA256 signed URL.
   *
   * Expects the URL to contain query params `p` (payload) and `sig` (signature).
   * Returns true only if the recomputed HMAC matches the provided signature.
   */
  verify(url: string, secret: string): boolean {
    try {
      const parsed = new URL(url);
      const payload = parsed.searchParams.get('p');
      const sig = parsed.searchParams.get('sig');

      if (!payload || !sig) return false;

      const expected = this.sign(payload, secret);
      return this.timingSafeEqual(expected, sig);
    } catch {
      return false;
    }
  }

  // -----------------------------------------------------------------------
  // Data URL conversion
  // -----------------------------------------------------------------------

  /**
   * Convert a ShareCardCanvas to a base64 PNG data URL.
   *
   * In a real browser environment this would call canvas.toDataURL('image/png').
   * For the abstracted ShareCardCanvas, it returns the stored dataUrl or a
   * placeholder indicating the card was generated successfully.
   */
  toDataURL(canvas: ShareCardCanvas): string {
    if (canvas.dataUrl) return canvas.dataUrl;
    // Fallback for test / server environments
    return `data:image/png;base64,SHARE_CARD_${canvas.width}x${canvas.height}`;
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  /** Timing-safe string comparison to prevent timing attacks on HMAC */
  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }

  /** Get disclaimer text from scoring params for the given language */
  private getDisclaimerText(scoringParams: ScoringParams, lang: string): string {
    const text = scoringParams.disclaimerText;
    return (lang === 'ta' ? text.ta : text.en) ?? text.en;
  }

  /** Simple word-wrap for canvas text rendering */
  private wrapText(text: string, maxCharsPerLine: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if (currentLine.length + word.length + 1 > maxCharsPerLine && currentLine.length > 0) {
        lines.push(currentLine.trim());
        currentLine = word;
      } else {
        currentLine += (currentLine.length > 0 ? ' ' : '') + word;
      }
    }
    if (currentLine.length > 0) {
      lines.push(currentLine.trim());
    }
    return lines;
  }
}
