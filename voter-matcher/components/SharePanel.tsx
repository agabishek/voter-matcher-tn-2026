'use client';

/**
 * SharePanel — Receipt-style share card image + WhatsApp sharing
 *
 * Generates a visual "receipt card" (like a UPI payment confirmation)
 * using HTML Canvas, then shares it as an image via WhatsApp/native share.
 *
 * Expert Panel Review:
 * - #18 Misinformation: Disclaimer baked into image, can't be cropped
 * - #9 Mobile UX: Receipt metaphor is familiar to Indian mobile users
 * - #25 Visual Design: Dark theme, party-neutral monochrome bars
 * - #19 Youth: Shareable, visually appealing, includes CTA
 * - #6 Privacy: No personal data — only scores and archetype
 *
 * @module components/SharePanel
 */

import React, { useState, useCallback, useRef } from 'react';
import { useLanguage } from '@/lib/languageProvider';
import { useConfig } from '@/lib/configProvider';

interface SharePanelProps {
  readonly partyScores: Record<string, number>;
  readonly archetypeId: string;
  readonly confidenceLevel: string;
  readonly configVersion: string;
}

type ShareState = 'idle' | 'generating' | 'ready' | 'shared' | 'copied' | 'error';

const SITE_URL = 'https://voter-matcher-tn-2026.vercel.app';

/** Party brand colors for the share card bars */
const PARTY_COLORS: Record<string, string> = {
  DMK: '#E63946',
  AIADMK: '#F4A261',
  TVK: '#457B9D',
};

/** Dimmed party colors for non-top parties */
const PARTY_COLORS_DIM: Record<string, string> = {
  DMK: 'rgba(230,57,70,0.5)',
  AIADMK: 'rgba(244,162,97,0.5)',
  TVK: 'rgba(69,123,157,0.5)',
};

/** Draw the receipt-style share card on a canvas and return it */
function drawReceiptCard(
  partyScores: Record<string, number>,
  archetypeId: string,
  confidenceLevel: string,
  partyNames: Record<string, string>,
  archetypeName: string,
  lang: 'en' | 'ta',
  disclaimerText: string,
  partyImages: Record<string, HTMLImageElement>,
): HTMLCanvasElement {
  const W = 540;
  const H = 740;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  const sorted = Object.entries(partyScores).sort(([, a], [, b]) => b - a);
  const topPartyId = sorted[0]?.[0] ?? '';
  const topScore = Math.round(sorted[0]?.[1] ?? 0);

  const fontMain = lang === 'ta' ? '"Noto Sans Tamil", sans-serif' : '"Inter", Arial, sans-serif';
  const setFont = (size: number, weight: string): void => {
    ctx.font = `${weight} ${size}px ${fontMain}`;
  };

  // === Background ===
  ctx.fillStyle = '#0f0f14';
  ctx.fillRect(0, 0, W, H);

  // === Dotted receipt border ===
  ctx.strokeStyle = '#2e2e3e';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.strokeRect(18, 18, W - 36, H - 36);
  ctx.setLineDash([]);

  // === Header ===
  let y = 52;
  ctx.textAlign = 'center';
  setFont(28, 'normal');
  ctx.fillText('🗳️', W / 2, y);
  y += 34;

  ctx.fillStyle = '#e4e4e7';
  setFont(17, '600');
  ctx.fillText(lang === 'ta' ? 'உங்கள் கொள்கை பொருத்தம்' : 'Your Policy Match', W / 2, y);
  y += 14;

  // === Dashed separator ===
  ctx.strokeStyle = '#2e2e3e';
  ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(44, y); ctx.lineTo(W - 44, y); ctx.stroke();
  ctx.setLineDash([]);
  y += 22;

  // === Top match: symbol + name + score ===
  ctx.fillStyle = '#a78bfa';
  setFont(12, '500');
  ctx.fillText(lang === 'ta' ? 'முதன்மை பொருத்தம்' : 'TOP MATCH', W / 2, y);
  y += 20;

  // Draw top party symbol if available
  const topImg = partyImages[topPartyId];
  if (topImg) {
    const imgSize = 40;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(W / 2 - imgSize / 2, y - 4, imgSize, imgSize, 8);
    ctx.clip();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(W / 2 - imgSize / 2, y - 4, imgSize, imgSize);
    ctx.drawImage(topImg, W / 2 - imgSize / 2 + 2, y - 2, imgSize - 4, imgSize - 4);
    ctx.restore();
    y += imgSize + 8;
  }

  ctx.fillStyle = '#ffffff';
  setFont(26, '700');
  ctx.fillText(partyNames[topPartyId] ?? topPartyId, W / 2, y);
  y += 32;

  // Big score with party color
  ctx.fillStyle = PARTY_COLORS[topPartyId] ?? '#a78bfa';
  setFont(40, '700');
  ctx.fillText(`${topScore}%`, W / 2, y);
  y += 18;

  // === Separator ===
  ctx.strokeStyle = '#2e2e3e';
  ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(44, y); ctx.lineTo(W - 44, y); ctx.stroke();
  ctx.setLineDash([]);
  y += 20;

  // === Party score row — only the top-matched party ===
  const LX = 44; // left margin
  const RX = W - 44; // right margin
  const barW = RX - LX;
  const barH = 22;
  const symbolSize = 24;

  {
    const partyId = topPartyId;
    const score = sorted[0]?.[1] ?? 0;
    const roundedScore = Math.round(score);
    const name = partyNames[partyId] ?? partyId;
    const color = PARTY_COLORS[partyId] ?? '#a78bfa';
    const img = partyImages[partyId];
    const textX = img ? LX + symbolSize + 8 : LX;

    // Draw party symbol
    if (img) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(LX, y, symbolSize, symbolSize, 4);
      ctx.clip();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(LX, y, symbolSize, symbolSize);
      ctx.drawImage(img, LX + 1, y + 1, symbolSize - 2, symbolSize - 2);
      ctx.restore();
    }

    // Party name
    ctx.textAlign = 'left';
    ctx.fillStyle = '#e4e4e7';
    setFont(14, '600');
    ctx.fillText(name, textX, y + 17);

    // Score (right-aligned)
    ctx.textAlign = 'right';
    ctx.fillStyle = color;
    setFont(14, '600');
    ctx.fillText(`${roundedScore}%`, RX, y + 17);
    ctx.textAlign = 'left';

    y += 28;

    // Bar background
    ctx.fillStyle = '#1e1e28';
    ctx.beginPath(); ctx.roundRect(LX, y, barW, barH, 5); ctx.fill();

    // Bar fill with party color
    const fillW = Math.max(4, (score / 100) * barW);
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.roundRect(LX, y, fillW, barH, 5); ctx.fill();

    y += barH + 16;
  }

  // === Archetype ===
  y += 2;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#71717a';
  setFont(11, '500');
  ctx.fillText(lang === 'ta' ? 'உங்கள் அரசியல் சிந்தனை வகை' : 'YOUR POLITICAL PROFILE', W / 2, y);
  y += 20;

  ctx.fillStyle = '#e4e4e7';
  setFont(15, '600');
  ctx.fillText(archetypeName, W / 2, y);
  y += 14;

  // Confidence
  const confLabels: Record<string, Record<string, string>> = {
    High: { en: 'High Confidence', ta: 'உயர் நம்பிக்கை' },
    Medium: { en: 'Medium Confidence', ta: 'நடுத்தர நம்பிக்கை' },
    Low: { en: 'Broad Match', ta: 'பரவலான பொருத்தம்' },
  };
  ctx.fillStyle = '#52525b';
  setFont(11, '400');
  ctx.fillText(confLabels[confidenceLevel]?.[lang] ?? confidenceLevel, W / 2, y + 14);
  y += 26;

  // === CTA separator ===
  ctx.strokeStyle = '#2e2e3e';
  ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(44, y); ctx.lineTo(W - 44, y); ctx.stroke();
  ctx.setLineDash([]);
  y += 20;

  // CTA
  ctx.fillStyle = '#a78bfa';
  setFont(12, '600');
  ctx.fillText(
    lang === 'ta' ? 'உங்களுக்கு எந்த கட்சி பொருந்தும்? கண்டறியுங்கள் 👇' : 'Which party matches YOU? Find out 👇',
    W / 2, y,
  );
  y += 20;

  ctx.fillStyle = '#e4e4e7';
  setFont(13, '700');
  ctx.fillText(SITE_URL.replace('https://', ''), W / 2, y);
  y += 22;

  // === Disclaimer ===
  ctx.fillStyle = '#3f3f46';
  setFont(9, '400');
  const lines = wrapText(ctx, disclaimerText, W - 96);
  for (const line of lines) {
    ctx.fillText(line, W / 2, y);
    y += 12;
  }

  return canvas;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export default function SharePanel({
  partyScores,
  archetypeId,
  confidenceLevel,
}: SharePanelProps): React.JSX.Element {
  const { activeLang, t } = useLanguage();
  const config = useConfig();
  const [state, setState] = useState<ShareState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isTamil = activeLang === 'ta';
  const baseFontClass = isTamil ? 'text-base' : 'text-sm';
  const tamilMinStyle: React.CSSProperties | undefined = isTamil
    ? { fontSize: '16px' }
    : undefined;
  const lang = activeLang as 'en' | 'ta';

  const getPartyNames = useCallback((): Record<string, string> => {
    const names: Record<string, string> = {};
    for (const p of config.parties.parties) {
      names[p.id] = p.names[lang] ?? p.names.en ?? p.id;
    }
    return names;
  }, [config, lang]);

  const getArchetypeName = useCallback((): string => {
    const entry = config.archetypes.archetypes.find(a => a.id === archetypeId);
    return entry?.names[lang] ?? entry?.names.en ?? archetypeId;
  }, [config, archetypeId, lang]);

  /** Load a party symbol image */
  const loadImage = useCallback((src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = (): void => resolve(img);
      img.onerror = (): void => reject(new Error(`Failed to load ${src}`));
      img.src = src;
    });
  }, []);

  /** Party symbol paths */
  const SYMBOL_PATHS: Record<string, string> = {
    DMK: '/flags/dmk.svg',
    AIADMK: '/flags/aiadmk.svg',
    TVK: '/flags/tvk.png',
  };

  /** Generate the receipt card image (loads symbols first) */
  const generateCard = useCallback(async (): Promise<HTMLCanvasElement> => {
    // Load all party symbol images in parallel
    const partyImages: Record<string, HTMLImageElement> = {};
    const loadPromises = Object.entries(SYMBOL_PATHS).map(async ([pid, src]) => {
      try {
        partyImages[pid] = await loadImage(src);
      } catch {
        // Symbol not available — card will render without it
      }
    });
    await Promise.all(loadPromises);

    const disclaimer = config.scoringParams.disclaimerText[lang] ?? config.scoringParams.disclaimerText.en;
    const canvas = drawReceiptCard(
      partyScores, archetypeId, confidenceLevel,
      getPartyNames(), getArchetypeName(), lang, disclaimer, partyImages,
    );
    canvasRef.current = canvas;
    setPreviewUrl(canvas.toDataURL('image/png'));
    return canvas;
  }, [partyScores, archetypeId, confidenceLevel, config, lang, getPartyNames, getArchetypeName, loadImage]);

  /** Convert canvas to shareable Blob */
  const canvasToBlob = useCallback((canvas: HTMLCanvasElement): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create image'));
      }, 'image/png');
    });
  }, []);

  /** Fallback: WhatsApp text-only share */
  const handleWhatsAppText = useCallback((): void => {
    const sorted = Object.entries(partyScores).sort(([, a], [, b]) => b - a);
    const topPartyId = sorted[0]?.[0] ?? '';
    const topScore = Math.round(sorted[0]?.[1] ?? 0);
    const partyName = getPartyNames()[topPartyId] ?? topPartyId;
    const archName = getArchetypeName();

    const msg = t('result.share.message')
      .replace('{party}', partyName)
      .replace('{score}', String(topScore))
      .replace('{archetype}', archName)
      .replace('{url}', SITE_URL);

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
    setState('shared');
  }, [partyScores, getPartyNames, getArchetypeName, t]);

  /** Share as image via Web Share API (WhatsApp picks this up as image) */
  const handleShareImage = useCallback(async (): Promise<void> => {
    setState('generating');
    setErrorMessage('');
    try {
      const canvas = await generateCard();
      const blob = await canvasToBlob(canvas);
      const file = new File([blob], 'voter-match-result.png', { type: 'image/png' });

      if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          text: lang === 'ta'
            ? `🗳️ நான் TN 2026 வாக்காளர் பொருத்தம் வினாடி வினா எடுத்தேன்! நீங்களும் முயற்சியுங்கள் 👇 ${SITE_URL}`
            : `🗳️ I took the TN 2026 Voter Matcher! Try it yourself 👇 ${SITE_URL}`,
          files: [file],
        });
        setState('shared');
      } else {
        handleWhatsAppText();
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setState('ready');
        return;
      }
      handleWhatsAppText();
    }
  }, [generateCard, canvasToBlob, lang, handleWhatsAppText]);

  /** Download the card image */
  const handleDownload = useCallback(async (): Promise<void> => {
    const canvas = canvasRef.current ?? await generateCard();
    const link = document.createElement('a');
    link.download = 'voter-match-result.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [generateCard]);

  /** Copy website URL */
  const handleCopyLink = useCallback(async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(SITE_URL);
      setState('copied');
    } catch {
      setErrorMessage(t('result.share.error'));
      setState('error');
    }
  }, [t]);

  /** Generate preview on first render interaction */
  const handleGeneratePreview = useCallback(async (): Promise<void> => {
    setState('generating');
    await generateCard();
    setState('ready');
  }, [generateCard]);

  return (
    <section
      aria-label={t('result.share.button')}
      lang={activeLang}
      className={`vm-card w-full max-w-2xl mx-auto ${baseFontClass}`}
      style={tamilMinStyle}
    >
      <div className="flex flex-col items-center gap-3">

        {/* Before generation: show "Generate Share Card" button */}
        {(state === 'idle') && (
          <button
            type="button"
            onClick={handleGeneratePreview}
            className="btn-glow w-full max-w-xs px-6 py-3 rounded-lg font-medium"
            style={tamilMinStyle}
          >
            {lang === 'ta' ? '📋 பகிர்வு அட்டை உருவாக்கு' : '📋 Generate Share Card'}
          </button>
        )}

        {/* Card preview */}
        {previewUrl && (
          <div className="w-full flex justify-center">
            <img
              src={previewUrl}
              alt={lang === 'ta' ? 'உங்கள் முடிவு அட்டை' : 'Your result card'}
              className="rounded-lg shadow-lg"
              style={{ maxWidth: '320px', width: '100%' }}
            />
          </div>
        )}

        {/* Action buttons after card is generated */}
        {state !== 'idle' && state !== 'generating' && (
          <>
            {/* Primary: Share image via WhatsApp / native share */}
            <button
              type="button"
              onClick={handleShareImage}
              className="flex items-center justify-center gap-2 w-full max-w-xs px-6 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
              style={{ background: '#25D366', color: '#fff', ...tamilMinStyle }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {t('result.share.button')}
            </button>

            {/* Download image */}
            <button
              type="button"
              onClick={handleDownload}
              className={`px-4 py-2 rounded-lg transition-colors ${baseFontClass}`}
              style={{ border: '1px solid var(--border)', color: 'var(--foreground)', background: 'transparent', ...tamilMinStyle }}
            >
              {lang === 'ta' ? '⬇️ படத்தை பதிவிறக்கு' : '⬇️ Download Image'}
            </button>

            {/* Copy link */}
            <button
              type="button"
              onClick={handleCopyLink}
              className={`px-4 py-1.5 rounded transition-colors ${baseFontClass}`}
              style={{ color: 'var(--muted)', background: 'transparent', textDecoration: 'underline', ...tamilMinStyle }}
            >
              {t('result.share.copyLink')}
            </button>
          </>
        )}

        {/* Loading state */}
        {state === 'generating' && (
          <p style={{ color: 'var(--muted)', ...tamilMinStyle }}>
            {lang === 'ta' ? 'உருவாக்குகிறது...' : 'Generating...'}
          </p>
        )}

        {/* Feedback */}
        {state === 'shared' && (
          <p role="status" aria-live="polite" className="font-medium" style={{ color: '#4ade80', ...tamilMinStyle }}>
            ✓ {lang === 'ta' ? 'பகிரப்பட்டது' : 'Shared'}
          </p>
        )}
        {state === 'copied' && (
          <p role="status" aria-live="polite" className="font-medium" style={{ color: '#4ade80', ...tamilMinStyle }}>
            ✓ {t('result.share.copied')}
          </p>
        )}
        {state === 'error' && errorMessage && (
          <p role="alert" className="font-medium" style={{ color: '#f87171', ...tamilMinStyle }}>
            {errorMessage}
          </p>
        )}
      </div>
    </section>
  );
}
