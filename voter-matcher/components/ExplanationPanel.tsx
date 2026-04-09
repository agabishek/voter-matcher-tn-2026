'use client';

/**
 * ExplanationPanel — Renders the pre-generated explanation from ExplanationEngine.
 *
 * Displays:
 * - Primary explanation paragraph (why the user matched the top party)
 * - Secondary alignment insight (runner-up context)
 * - 2–4 belief statement tags (derived from top axis scores)
 *
 * All text comes pre-generated from ExplanationEngine — this component
 * only renders it with proper i18n section labels and accessibility.
 *
 * @module components/ExplanationPanel
 */

import React from 'react';
import { useLanguage } from '@/lib/languageProvider';

interface ExplanationPanelProps {
  readonly explanation: {
    readonly primaryParagraph: string;
    readonly secondaryInsight: string;
    readonly beliefStatements: readonly string[];
    readonly archetypeDescription: string;
  };
}

export default function ExplanationPanel({
  explanation,
}: ExplanationPanelProps): React.JSX.Element {
  const { activeLang, t } = useLanguage();

  const isTamil = activeLang === 'ta';
  const baseFontClass = isTamil ? 'text-base' : 'text-sm';
  const tamilMinStyle: React.CSSProperties | undefined = isTamil
    ? { fontSize: '16px' }
    : undefined;

  return (
    <section
      aria-labelledby="explanation-section-title"
      lang={activeLang}
      className="w-full max-w-2xl mx-auto py-4 sm:py-6 space-y-4 sm:space-y-6"
    >
      {/* Section heading */}
      <h2
        id="explanation-section-title"
        className={`font-semibold ${isTamil ? 'text-xl' : 'text-lg'}`}
        style={{
          color: 'var(--foreground)',
          ...(isTamil ? { fontSize: '20px' } : {}),
        }}
      >
        {t('explanation.section.title')}
      </h2>

      {/* Primary explanation paragraph */}
      <div className="space-y-1">
        <h3
          className={`font-medium ${baseFontClass}`}
          style={{ color: 'var(--foreground)', ...tamilMinStyle }}
        >
          {t('explanation.primary.label')}
        </h3>
        <p
          className={`leading-relaxed ${baseFontClass}`}
          style={{ color: 'var(--muted)', ...tamilMinStyle }}
        >
          {explanation.primaryParagraph}
        </p>
      </div>

      {/* Secondary alignment insight */}
      <div className="space-y-1">
        <h3
          className={`font-medium ${baseFontClass}`}
          style={{ color: 'var(--foreground)', ...tamilMinStyle }}
        >
          {t('explanation.secondary.title')}
        </h3>
        <p
          className={`leading-relaxed ${baseFontClass}`}
          style={{ color: 'var(--muted)', ...tamilMinStyle }}
        >
          {explanation.secondaryInsight}
        </p>
      </div>

      {/* Belief statement tags */}
      <div className="space-y-2">
        <h3
          className={`font-medium ${baseFontClass}`}
          style={{ color: 'var(--foreground)', ...tamilMinStyle }}
        >
          {t('explanation.beliefs.title')}
        </h3>
        <ul
          className="flex flex-wrap gap-2"
          aria-label={t('explanation.beliefs.title')}
        >
          {explanation.beliefStatements.map((statement) => (
            <li
              key={statement}
              className={`belief-tag inline-block ${baseFontClass}`}
              style={tamilMinStyle}
            >
              {statement}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
