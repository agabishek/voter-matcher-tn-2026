'use client';

import React from 'react';
import { useLanguage } from '@/lib/languageProvider';

interface AxisWarningProps {
  readonly axisLabel: string;
}

export default function AxisWarning({ axisLabel }: AxisWarningProps): React.JSX.Element {
  const { activeLang, t } = useLanguage();

  return (
    <div
      role="status"
      aria-live="polite"
      lang={activeLang}
      className={`notice-warn w-full max-w-2xl mx-auto px-4 sm:px-6 py-3 rounded-lg ${
        activeLang === 'ta' ? 'text-base' : 'text-sm'
      }`}
      style={activeLang === 'ta' ? { fontSize: '16px' } : undefined}
    >
      {t('questionnaire.axis.warning', { axis: axisLabel })}
    </div>
  );
}
