'use client';

import React, { useMemo } from 'react';
import { useLanguage } from '@/lib/languageProvider';
import { useConfig } from '@/lib/configProvider';

interface ProgressBarProps {
  readonly current: number;
  readonly total: number;
  readonly cluster: string;
}

export default function ProgressBar({ current, total, cluster }: ProgressBarProps): React.JSX.Element {
  const { activeLang, t } = useLanguage();
  const config = useConfig();

  const pct = useMemo((): number => (total === 0 ? 0 : Math.round((current / total) * 100)), [current, total]);

  const clusterLabel = useMemo((): string => {
    const axis = config.axes.axes.find((a) => a.id === cluster);
    return axis?.labels[activeLang as 'en' | 'ta'] ?? axis?.labels.en ?? cluster;
  }, [activeLang, config.axes.axes, cluster]);

  return (
    <div className="w-full" style={{ background: 'var(--card)', padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
      <div className="rounded overflow-hidden h-1.5 mb-3" style={{ background: 'var(--border)' }}>
        <div className="progress-gradient h-full rounded transition-all duration-400" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm" style={{ color: 'var(--muted)' }}>
          {t('questionnaire.progress.label', { current: String(current), total: String(total) })}
        </span>
        <span className="axis-tag">{clusterLabel}</span>
      </div>
    </div>
  );
}
