'use client';

/**
 * NonPrimaryExplainer — Explains why non-primary parties scored lower.
 *
 * Expert Panel Review:
 * - #5 Neutrality Auditor: Framed as "where your priorities differ", never disparaging
 * - #8 Cognitive Psychologist: Comparative framing avoids negative anchoring
 * - #4 Fairness Researcher: Axis-based divergence, not score-based judgment
 * - #19 Youth Advocate: Educational tone — "different priorities" not "disagreement"
 * - #18 Misinformation: Personal framing ("your priorities") prevents screenshot misuse
 * - #10 Tamil Language Expert: All text from engine/locales, no hardcoded strings
 *
 * @module components/NonPrimaryExplainer
 */

import React, { useState } from 'react';
import { useLanguage } from '@/lib/languageProvider';
import type { NonPrimaryInsight } from '@/engines/explanationEngine';

interface NonPrimaryExplainerProps {
  readonly insights: readonly NonPrimaryInsight[];
}

export default function NonPrimaryExplainer({
  insights,
}: NonPrimaryExplainerProps): React.JSX.Element | null {
  const { activeLang, t } = useLanguage();
  const [expandedParty, setExpandedParty] = useState<string | null>(null);

  const isTamil = activeLang === 'ta';
  const baseFontClass = isTamil ? 'text-base' : 'text-sm';
  const tamilMinStyle: React.CSSProperties | undefined = isTamil
    ? { fontSize: '16px' }
    : undefined;

  if (insights.length === 0) return null;

  const toggleParty = (partyId: string): void => {
    setExpandedParty((prev) => (prev === partyId ? null : partyId));
  };

  return (
    <section
      aria-labelledby="non-primary-section-title"
      lang={activeLang}
      className="w-full max-w-2xl mx-auto py-4 sm:py-6 space-y-3"
    >
      <h2
        id="non-primary-section-title"
        className={`font-semibold ${isTamil ? 'text-xl' : 'text-lg'}`}
        style={{
          color: 'var(--foreground)',
          ...(isTamil ? { fontSize: '20px' } : {}),
        }}
      >
        {t('explanation.nonPrimary.title')}
      </h2>

      {insights.map((insight) => {
        const isExpanded = expandedParty === insight.partyId;

        return (
          <div
            key={insight.partyId}
            className="vm-card w-full"
            style={tamilMinStyle}
          >
            <button
              type="button"
              onClick={(): void => toggleParty(insight.partyId)}
              aria-expanded={isExpanded}
              aria-controls={`non-primary-detail-${insight.partyId}`}
              className={`w-full flex items-center justify-between gap-3 text-left ${baseFontClass}`}
              style={{ background: 'transparent', border: 'none', color: 'var(--foreground)', ...tamilMinStyle }}
            >
              <div className="min-w-0 flex-1">
                <span
                  className="font-semibold block"
                  style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}
                >
                  {insight.partyName}
                </span>
                <span
                  className="text-xs"
                  style={{ color: 'var(--muted)' }}
                >
                  {t('explanation.nonPrimary.score', { score: insight.score })}
                </span>
              </div>
              <span
                className="shrink-0 text-lg transition-transform"
                aria-hidden="true"
                style={{
                  color: 'var(--muted)',
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              >
                ▾
              </span>
            </button>

            {isExpanded && (
              <div
                id={`non-primary-detail-${insight.partyId}`}
                className="mt-3 pt-3 space-y-3"
                style={{ borderTop: '1px solid var(--border)' }}
              >
                <p
                  className={`leading-relaxed ${baseFontClass}`}
                  style={{ color: 'var(--muted)', ...tamilMinStyle }}
                >
                  {insight.summary}
                </p>

                {insight.divergenceAxes.length > 0 && (
                  <div className="space-y-2">
                    <h3
                      className={`font-medium ${baseFontClass}`}
                      style={{ color: 'var(--foreground)', ...tamilMinStyle }}
                    >
                      {t('explanation.nonPrimary.divergence')}
                    </h3>
                    <ul className="space-y-2" aria-label={t('explanation.nonPrimary.divergence')}>
                      {insight.divergenceAxes.map((axis) => (
                        <li
                          key={axis.axisLabel}
                          className={`flex items-start gap-2 ${baseFontClass}`}
                          style={tamilMinStyle}
                        >
                          <span className="axis-tag shrink-0 mt-0.5">{axis.axisLabel}</span>
                          <span
                            className="leading-relaxed"
                            style={{ color: 'var(--muted)', overflowWrap: 'break-word', wordBreak: 'break-word' }}
                          >
                            {axis.explanation}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
