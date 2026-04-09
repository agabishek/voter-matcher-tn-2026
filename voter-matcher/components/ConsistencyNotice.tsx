'use client';

/**
 * ConsistencyNotice — Non-blocking notice shown when contradictions are detected.
 *
 * Frames contradictions as nuance/complexity, NOT as errors.
 * Only rendered when the contradictions array is non-empty.
 *
 * Uses translation keys from explanation.json:
 * - explanation.contradiction.label (heading)
 * - explanation.contradiction.description (body)
 *
 * @module components/ConsistencyNotice
 */

import React from 'react';
import { useLanguage } from '@/lib/languageProvider';

interface ContradictionItem {
  readonly axis1: string;
  readonly axis2: string;
  readonly score1: number;
  readonly score2: number;
  readonly message?: string;
}

interface ConsistencyNoticeProps {
  readonly contradictions: readonly ContradictionItem[];
}

export default function ConsistencyNotice({
  contradictions,
}: ConsistencyNoticeProps): React.JSX.Element | null {
  const { activeLang, t } = useLanguage();

  if (contradictions.length === 0) {
    return null;
  }

  const isTamil = activeLang === 'ta';
  const baseFontClass = isTamil ? 'text-base' : 'text-sm';
  const tamilMinStyle: React.CSSProperties | undefined = isTamil
    ? { fontSize: '16px' }
    : undefined;

  return (
    <div
      role="status"
      aria-live="polite"
      lang={activeLang}
      className={`notice-warn w-full max-w-2xl mx-auto px-4 sm:px-6 py-4 rounded-lg space-y-2 ${baseFontClass}`}
      style={tamilMinStyle}
    >
      <p className="font-medium" style={{ color: '#fde68a' }}>
        {t('explanation.contradiction.label')}
      </p>
      <p className="leading-relaxed" style={{ color: '#fde68a', opacity: 0.8 }}>
        {t('explanation.contradiction.description')}
      </p>
    </div>
  );
}
