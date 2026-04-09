'use client';

/**
 * TrackRecordNotice — Shown when the matched party has weightBasis: "promise"
 * in the Party_Registry.
 *
 * Explains that alignment is based on manifesto promises, not governance
 * track record. Uses translation keys from result.json:
 * - result.trackRecord.notice (heading)
 * - result.trackRecord.description (body with {party} interpolation)
 *
 * @module components/TrackRecordNotice
 */

import React from 'react';
import { useLanguage } from '@/lib/languageProvider';

interface TrackRecordNoticeProps {
  readonly partyName: string;
}

export default function TrackRecordNotice({
  partyName,
}: TrackRecordNoticeProps): React.JSX.Element {
  const { activeLang, t } = useLanguage();

  const isTamil = activeLang === 'ta';
  const baseFontClass = isTamil ? 'text-base' : 'text-sm';
  const tamilMinStyle: React.CSSProperties | undefined = isTamil
    ? { fontSize: '16px' }
    : undefined;

  return (
    <div
      role="note"
      lang={activeLang}
      className={`notice-warn w-full max-w-2xl mx-auto px-4 sm:px-6 py-4 rounded-lg space-y-2 ${baseFontClass}`}
      style={tamilMinStyle}
    >
      <p className="font-medium" style={{ color: '#fde68a' }}>
        {t('result.trackRecord.notice')}
      </p>
      <p className="leading-relaxed" style={{ color: '#fde68a', opacity: 0.8 }}>
        {t('result.trackRecord.description', { party: partyName })}
      </p>
    </div>
  );
}
