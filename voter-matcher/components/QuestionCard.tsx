'use client';

import React, { useCallback, useMemo } from 'react';
import { useLanguage } from '@/lib/languageProvider';

interface BilingualText {
  readonly en: string;
  readonly ta: string;
}

interface QuestionOption {
  readonly id: string;
  readonly text: BilingualText;
  readonly partyWeights: Record<string, number>;
  readonly axisWeights: Record<string, number>;
}

interface Question {
  readonly id: string;
  readonly cluster: string;
  readonly text: BilingualText;
  readonly options: readonly QuestionOption[];
}

interface QuestionCardProps {
  readonly question: Question;
  readonly selectedOptionId: string | undefined;
  readonly onSelect: (optionId: string) => void;
  readonly onSkip: () => void;
}

export default function QuestionCard({
  question,
  selectedOptionId,
  onSelect,
  onSkip,
}: QuestionCardProps): React.JSX.Element {
  const { activeLang, t } = useLanguage();
  const langKey = activeLang as keyof BilingualText;

  const questionText = useMemo(
    (): string => question.text[langKey] ?? question.text.en,
    [question.text, langKey],
  );

  const handleOptionClick = useCallback(
    (optionId: string): void => { onSelect(optionId); },
    [onSelect],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>): void => {
      const btns = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[data-option-id]'));
      const idx = btns.findIndex((b) => b === document.activeElement);
      switch (event.key) {
        case 'ArrowDown': case 'ArrowRight': {
          event.preventDefault();
          btns[(idx + 1) % btns.length]?.focus();
          break;
        }
        case 'ArrowUp': case 'ArrowLeft': {
          event.preventDefault();
          btns[(idx - 1 + btns.length) % btns.length]?.focus();
          break;
        }
      }
    },
    [],
  );

  return (
    <div
      className="flex flex-col gap-3 sm:gap-4 w-full max-w-2xl mx-auto px-3 sm:px-6"
      lang={activeLang}
      style={activeLang === 'ta' ? { fontSize: '16px' } : undefined}
    >
      {/* Question text — uses theme foreground color */}
      <h2
        className="text-lg sm:text-2xl font-semibold leading-relaxed"
        style={{ color: 'var(--foreground)' }}
        aria-label={t('questionnaire.question.accessibilityLabel', { text: questionText })}
      >
        {questionText}
      </h2>

      {/* Options */}
      <div
        role="group"
        aria-label={t('questionnaire.options.groupLabel')}
        className="flex flex-col gap-3"
        onKeyDown={handleKeyDown}
      >
        {question.options.map((option) => {
          const optionText = option.text[langKey] ?? option.text.en;
          const isSelected = selectedOptionId === option.id;

          return (
            <button
              key={option.id}
              type="button"
              data-option-id={option.id}
              onClick={(): void => handleOptionClick(option.id)}
              aria-pressed={isSelected}
              aria-label={
                isSelected
                  ? t('questionnaire.option.accessibilitySelected', { text: optionText })
                  : optionText
              }
              className="w-full text-left px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              style={isSelected ? {
                borderColor: 'var(--accent)',
                background: 'rgba(124,58,237,0.15)',
                color: 'var(--foreground)',
                fontWeight: 500,
              } : {
                borderColor: 'var(--border)',
                background: 'var(--card)',
                color: '#ccc',
              }}
              onMouseEnter={(e): void => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.background = 'rgba(124,58,237,0.08)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }
              }}
              onMouseLeave={(e): void => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.background = 'var(--card)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }
              }}
            >
              {optionText}
            </button>
          );
        })}
      </div>

      {/* Skip button */}
      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={onSkip}
          aria-label={t('questionnaire.skip.button')}
          className="px-6 py-2 text-sm font-medium underline underline-offset-4 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 rounded"
          style={{ color: 'var(--muted)' }}
        >
          {t('questionnaire.skip.button')}
        </button>
      </div>
    </div>
  );
}
