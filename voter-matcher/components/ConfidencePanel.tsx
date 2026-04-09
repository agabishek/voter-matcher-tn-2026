'use client';

import React from 'react';
import { useLanguage } from '@/lib/languageProvider';

const CONFIDENCE_LEVELS = {
  High: 'high',
  Medium: 'medium',
  Low: 'low',
} as const;

type ConfidenceLevel = keyof typeof CONFIDENCE_LEVELS;

interface ConfidencePanelProps {
  readonly confidenceLevel: ConfidenceLevel;
}

export default function ConfidencePanel({ confidenceLevel }: ConfidencePanelProps): React.JSX.Element {
  const { activeLang, t } = useLanguage();
  const levelKey = CONFIDENCE_LEVELS[confidenceLevel];

  return (
    <section
      aria-label={t('result.confidence.title')}
      lang={activeLang}
      className={`vm-card w-full max-w-2xl mx-auto ${
        activeLang === 'ta' ? 'text-base' : 'text-sm'
      }`}
      style={activeLang === 'ta' ? { fontSize: '16px' } : undefined}
    >
      <h3
        className="font-semibold mb-1"
        style={{ color: 'var(--foreground)' }}
      >
        {t('result.confidence.title')}
      </h3>
      <p
        className="font-medium mb-1"
        style={{ color: 'var(--foreground)' }}
      >
        {t(`result.confidence.label.${levelKey}`)}
      </p>
      <p style={{ color: 'var(--muted)' }}>
        {t(`result.confidence.${levelKey}`)}
      </p>
    </section>
  );
}
