'use client';

/**
 * LanguageProvider - React context for bilingual language support
 *
 * Reads Language_Registry from ConfigBundle, persists user preference
 * in localStorage, and provides a t() translation function that
 * switches all text without page reload via React state.
 *
 * Usage:
 * ```tsx
 * // In layout (wrap inside ConfigProvider):
 * <ConfigProvider config={config}>
 *   <LanguageProvider>
 *     <YourApp />
 *   </LanguageProvider>
 * </ConfigProvider>
 *
 * // In any component:
 * const { activeLang, setLanguage, t } = useLanguage();
 * ```
 *
 * @module lib/languageProvider
 */

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import { useConfig } from './configProvider';
import { registerServiceWorker } from './registerSW';

// Import all translation files statically
import enCommon from '@/locales/en/common.json';
import enQuestionnaire from '@/locales/en/questionnaire.json';
import enResult from '@/locales/en/result.json';
import enExplanation from '@/locales/en/explanation.json';
import taCommon from '@/locales/ta/common.json';
import taQuestionnaire from '@/locales/ta/questionnaire.json';
import taResult from '@/locales/ta/result.json';
import taExplanation from '@/locales/ta/explanation.json';

type TranslationMap = Record<string, string>;

const LOCALE_BUNDLES: Record<string, TranslationMap> = {
  en: { ...enCommon, ...enQuestionnaire, ...enResult, ...enExplanation },
  ta: { ...taCommon, ...taQuestionnaire, ...taResult, ...taExplanation },
};

const STORAGE_KEY = 'voter-matcher-lang';

/**
 * Interpolate template strings like "{count}" or "{minutes}" with provided values.
 * Replaces all occurrences of `{key}` in the template with the corresponding value.
 */
function interpolate(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce<string>(
    (result, [key, value]) => result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)),
    template,
  );
}

/**
 * Read the stored language preference from localStorage.
 * Returns undefined if not available (SSR or no stored preference).
 */
function getStoredLanguage(): string | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }
  try {
    return localStorage.getItem(STORAGE_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * Persist language preference to localStorage.
 */
function storeLanguage(lang: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

interface LanguageContextValue {
  /** Current active language code (e.g. 'en' or 'ta') */
  readonly activeLang: string;
  /** Set the active language by code */
  readonly setLanguage: (lang: string) => void;
  /** Translate a key with optional interpolation values */
  readonly t: (key: string, values?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

interface LanguageProviderProps {
  readonly children: ReactNode;
}

/**
 * LanguageProvider - Provides language state and translation to all child components.
 *
 * Must be rendered inside a ConfigProvider so it can read Language_Registry.
 * Initializes from localStorage, falling back to defaultLanguage from config.
 */
export function LanguageProvider({ children }: LanguageProviderProps): React.JSX.Element {
  const config = useConfig();
  const { defaultLanguage, languages } = config.languages;
  const validCodes = useMemo(() => languages.map((l) => l.code), [languages]);

  const [activeLang, setActiveLangState] = useState<string>(() => {
    const stored = getStoredLanguage();
    if (stored && validCodes.includes(stored)) {
      return stored;
    }
    return defaultLanguage;
  });

  const setLanguage = useCallback(
    (lang: string): void => {
      if (validCodes.includes(lang)) {
        setActiveLangState(lang);
        storeLanguage(lang);
      }
    },
    [validCodes],
  );

  const t = useCallback(
    (key: string, values?: Record<string, string | number>): string => {
      const map = LOCALE_BUNDLES[activeLang] ?? LOCALE_BUNDLES[defaultLanguage] ?? {};
      const raw = map[key] ?? key;
      return values ? interpolate(raw, values) : raw;
    },
    [activeLang, defaultLanguage],
  );

  // 13.2: Dynamically set lang attribute on <html> element when language changes
  useEffect(() => {
    document.documentElement.lang = activeLang;
  }, [activeLang]);

  // 13.4: Register service worker for offline fallback scoring
  useEffect(() => {
    registerServiceWorker();
  }, []);

  const contextValue = useMemo<LanguageContextValue>(
    () => ({ activeLang, setLanguage, t }),
    [activeLang, setLanguage, t],
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * useLanguage - Hook to access language state and translation from any component.
 *
 * Must be used within a component that is a child of LanguageProvider.
 *
 * @returns LanguageContextValue with activeLang, setLanguage, and t()
 * @throws Error if used outside of LanguageProvider
 */
export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);

  if (context === undefined) {
    throw new Error(
      'useLanguage must be used within a LanguageProvider. ' +
      'Wrap your app with <LanguageProvider> inside <ConfigProvider>.',
    );
  }

  return context;
}
