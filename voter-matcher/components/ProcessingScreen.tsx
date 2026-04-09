'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useConfig } from '@/lib/configProvider';
import { useLanguage } from '@/lib/languageProvider';

const STEP_KEYS = [
  'processing.step1',
  'processing.step2',
  'processing.step3',
] as const;

const STEP_DELAY_MS = 800;

export default function ProcessingScreen(): React.JSX.Element {
  const config = useConfig();
  const { activeLang, t } = useLanguage();

  const [visibleCount, setVisibleCount] = useState<number>(1);

  const activeLangConfig = useMemo(
    () => config.languages.languages.find((l) => l.code === activeLang),
    [config.languages.languages, activeLang],
  );

  const minFontSize = activeLangConfig?.minFontSize ?? 16;

  useEffect(() => {
    if (visibleCount >= STEP_KEYS.length) {
      return;
    }

    const timer = setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + 1, STEP_KEYS.length));
    }, STEP_DELAY_MS);

    return (): void => {
      clearTimeout(timer);
    };
  }, [visibleCount]);

  return (
    <div
      className="flex flex-col flex-1 items-center justify-center"
      lang={activeLang}
      style={{ fontSize: `${minFontSize}px` }}
    >
      <section
        aria-label={t('processing.accessibilitySection')}
        aria-live="polite"
        role="status"
        className="flex flex-col items-center gap-8 px-6 py-16 max-w-md w-full"
      >
        <h1
          className="text-2xl sm:text-3xl font-bold text-center"
          style={{ color: 'var(--foreground)' }}
        >
          {t('processing.title')}
        </h1>

        <ol className="flex flex-col gap-4 w-full">
          {STEP_KEYS.map((key, index) => {
            const isVisible = index < visibleCount;
            return (
              <li
                key={key}
                className={`flex items-center gap-3 transition-opacity duration-500 ${
                  isVisible ? 'opacity-100' : 'opacity-0'
                }`}
                aria-hidden={!isVisible}
              >
                <span
                  className="inline-block h-3 w-3 rounded-full animate-pulse shrink-0"
                  aria-hidden="true"
                  style={{ background: 'var(--accent)' }}
                />
                <span style={{ color: 'var(--muted)' }}>
                  {t(key)}
                </span>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
