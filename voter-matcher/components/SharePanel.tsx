'use client';

/**
 * SharePanel — "Share your results" button that calls POST /api/share
 * to get a signed share URL, then lets the user copy it to clipboard.
 *
 * All user-facing text comes from translation keys in result.json.
 * No hardcoded strings. Tamil minimum 16px enforced.
 *
 * @module components/SharePanel
 */

import React, { useState, useCallback } from 'react';
import { useLanguage } from '@/lib/languageProvider';

interface SharePanelProps {
  readonly partyScores: Record<string, number>;
  readonly archetypeId: string;
  readonly confidenceLevel: string;
  readonly configVersion: string;
}

interface ShareApiResponse {
  readonly url: string;
  readonly signature: string;
}

interface ShareApiError {
  readonly error: string;
}

type ShareState = 'idle' | 'loading' | 'copied' | 'error';

function buildPayload(props: SharePanelProps): string {
  return JSON.stringify({
    partyScores: props.partyScores,
    archetypeId: props.archetypeId,
    confidenceLevel: props.confidenceLevel,
    configVersion: props.configVersion,
  });
}

function isShareApiResponse(value: unknown): value is ShareApiResponse {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return typeof obj['url'] === 'string' && typeof obj['signature'] === 'string';
}

export default function SharePanel({
  partyScores,
  archetypeId,
  confidenceLevel,
  configVersion,
}: SharePanelProps): React.JSX.Element {
  const { activeLang, t } = useLanguage();
  const [state, setState] = useState<ShareState>('idle');
  const [shareUrl, setShareUrl] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const isTamil = activeLang === 'ta';
  const baseFontClass = isTamil ? 'text-base' : 'text-sm';
  const tamilMinStyle: React.CSSProperties | undefined = isTamil
    ? { fontSize: '16px' }
    : undefined;

  const handleShare = useCallback(async (): Promise<void> => {
    setState('loading');
    setErrorMessage('');

    try {
      const payload = buildPayload({ partyScores, archetypeId, confidenceLevel, configVersion });
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload }),
      });

      if (!response.ok) {
        const errorBody: unknown = await response.json().catch(() => ({}));
        const msg = typeof errorBody === 'object' && errorBody !== null
          ? (errorBody as ShareApiError).error ?? t('result.share.error')
          : t('result.share.error');
        setErrorMessage(msg);
        setState('error');
        return;
      }

      const data: unknown = await response.json();
      if (!isShareApiResponse(data)) {
        setErrorMessage(t('result.share.error'));
        setState('error');
        return;
      }

      setShareUrl(data.url);
      await navigator.clipboard.writeText(data.url);
      setState('copied');
    } catch {
      setErrorMessage(t('result.share.error'));
      setState('error');
    }
  }, [partyScores, archetypeId, confidenceLevel, configVersion, t]);

  const handleCopyLink = useCallback(async (): Promise<void> => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setState('copied');
    } catch {
      setErrorMessage(t('result.share.error'));
      setState('error');
    }
  }, [shareUrl, t]);

  return (
    <section
      aria-label={t('result.share.button')}
      lang={activeLang}
      className={`vm-card w-full max-w-2xl mx-auto ${baseFontClass}`}
      style={tamilMinStyle}
    >
      <div className="flex flex-col items-center gap-3">
        {/* Share button */}
        <button
          type="button"
          onClick={handleShare}
          disabled={state === 'loading'}
          aria-busy={state === 'loading'}
          className="btn-glow px-6 py-2.5 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          style={tamilMinStyle}
        >
          {state === 'loading' ? '…' : t('result.share.button')}
        </button>

        {/* Copy link button — shown after a successful share */}
        {shareUrl && state !== 'loading' && (
          <button
            type="button"
            onClick={handleCopyLink}
            className={`px-4 py-1.5 rounded transition-colors ${baseFontClass}`}
            style={{
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
              background: 'transparent',
              ...tamilMinStyle,
            }}
          >
            {t('result.share.copyLink')}
          </button>
        )}

        {/* "Link copied!" feedback */}
        {state === 'copied' && (
          <p
            role="status"
            aria-live="polite"
            className="font-medium"
            style={{ color: '#4ade80', ...tamilMinStyle }}
          >
            {t('result.share.copied')}
          </p>
        )}

        {/* Error feedback */}
        {state === 'error' && errorMessage && (
          <p
            role="alert"
            className="font-medium"
            style={{ color: '#f87171', ...tamilMinStyle }}
          >
            {errorMessage}
          </p>
        )}
      </div>
    </section>
  );
}
