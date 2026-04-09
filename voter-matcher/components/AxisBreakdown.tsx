'use client';

/**
 * AxisBreakdown — renders one row per axis from Axis_Registry
 *
 * Displays axis-level scores using plain civic language labels
 * from the Axis_Registry (bilingual). Each row shows the axis label
 * and a score bar + text. No axis IDs are hardcoded — everything
 * is driven by config.
 *
 * @module components/AxisBreakdown
 */

import React from 'react';
import { useConfig } from '@/lib/configProvider';
import { useLanguage } from '@/lib/languageProvider';

interface AxisBreakdownProps {
  /** Map of axisId → numeric score */
  readonly axisScores: Record<string, number>;
}

/**
 * Compute the percentage width for a score bar.
 * Clamps to [0, 100] to handle edge cases.
 */
function clampPercent(score: number, maxScore: number): number {
  if (maxScore <= 0) return 0;
  const pct = (score / maxScore) * 100;
  if (pct < 0) return 0;
  if (pct > 100) return 100;
  return Math.round(pct);
}

export default function AxisBreakdown({ axisScores }: AxisBreakdownProps): React.JSX.Element {
  const config = useConfig();
  const { activeLang, t } = useLanguage();

  const axes = config.axes.axes;
  const isTamil = activeLang === 'ta';

  // Determine max score across all axes for relative bar sizing
  const scores = axes.map((axis) => axisScores[axis.id] ?? 0);
  const maxScore = Math.max(...scores, 1);

  return (
    <section
      aria-label={t('result.axis.title')}
      lang={activeLang}
      className="w-full max-w-2xl mx-auto"
    >
      <h3
        className={`font-semibold mb-4 ${
          isTamil ? 'text-lg' : 'text-base'
        }`}
        style={{
          color: 'var(--foreground)',
          ...(isTamil ? { fontSize: '18px' } : {}),
        }}
      >
        {t('result.axes.label')}
      </h3>

      <div className="space-y-3" role="list">
        {axes.map((axis) => {
          const score = axisScores[axis.id] ?? 0;
          const pct = clampPercent(score, maxScore);
          const label = (axis.labels as Record<string, string>)[activeLang] ?? axis.labels.en;

          return (
            <div
              key={axis.id}
              role="listitem"
              aria-label={t('result.axis.accessibilityLabel', { axis: label, score: String(score) })}
              className="flex flex-col gap-1"
            >
              <div className="flex items-center justify-between">
                <span
                  className={isTamil ? 'text-base' : 'text-sm'}
                  style={{
                    color: 'var(--foreground)',
                    ...(isTamil ? { fontSize: '16px' } : {}),
                  }}
                >
                  {label}
                </span>
                <span
                  className={`font-medium ${isTamil ? 'text-base' : 'text-sm'}`}
                  style={{
                    color: 'var(--foreground)',
                    ...(isTamil ? { fontSize: '16px' } : {}),
                  }}
                >
                  {score}
                </span>
              </div>

              <div
                className="w-full h-2 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={score}
                aria-valuemin={0}
                aria-valuemax={maxScore}
                style={{ background: 'var(--card2)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${pct}%`, background: 'var(--accent2)' }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
