'use client';

import React, { useCallback } from 'react';
import { useConfig } from '@/lib/configProvider';
import { useLanguage } from '@/lib/languageProvider';

/**
 * LanguageToggle — Reusable bilingual toggle (Tamil / English).
 *
 * Reads available languages from Language_Registry via useConfig(),
 * reads/sets the active language via useLanguage().
 * Drop it anywhere: <LanguageToggle />
 */
export default function LanguageToggle(): React.JSX.Element {
  const config = useConfig();
  const { activeLang, setLanguage } = useLanguage();

  const handleSelect = useCallback(
    (code: string): void => {
      setLanguage(code);
    },
    [setLanguage],
  );

  return (
    <div
      className="lang-toggle"
      role="radiogroup"
      aria-label="Select language"
    >
      {config.languages.languages.map((lang) => {
        const isActive = activeLang === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={lang.name}
            onClick={(): void => handleSelect(lang.code)}
            className={`lang-btn${isActive ? ' active' : ''}`}
            style={isActive ? undefined : { color: 'var(--muted)' }}
          >
            {lang.name}
          </button>
        );
      })}
    </div>
  );
}
