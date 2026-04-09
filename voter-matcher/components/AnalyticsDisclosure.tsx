'use client';

/**
 * AnalyticsDisclosure — Pre-session analytics disclosure component
 *
 * Shown ONLY when analytics is enabled (NEXT_PUBLIC_ANALYTICS_ENABLED=true).
 * Non-blocking, dismissible banner informing users about aggregated data collection.
 * All text sourced from translation files — no hardcoded strings.
 *
 * @module components/AnalyticsDisclosure
 */

import React, { useState, useCallback } from 'react';
import { useLanguage } from '@/lib/languageProvider';
import { isAnalyticsEnabled } from '@/lib/analyticsCollector';

interface AnalyticsDisclosureProps {
  /** Callback fired when the user dismisses the disclosure */
  readonly onDismiss?: () => void;
}

export default function AnalyticsDisclosure({ onDismiss }: AnalyticsDisclosureProps): React.JSX.Element | null {
  const { activeLang, t } = useLanguage();
  const [dismissed, setDismissed] = useState<boolean>(false);

  const handleDismiss = useCallback((): void => {
    setDismissed(true);
    onDismiss?.();
  }, [onDismiss]);

  // Only render when analytics is enabled and not yet dismissed
  if (!isAnalyticsEnabled() || dismissed) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      lang={activeLang}
      className="w-full max-w-2xl mx-auto px-4 py-3 mb-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t('analytics.disclosure.title')}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {t('analytics.disclosure.body')}
          </p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label={t('analytics.disclosure.dismiss')}
          className="shrink-0 px-3 py-1 text-xs font-medium rounded border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500"
        >
          {t('analytics.disclosure.dismissButton')}
        </button>
      </div>
    </div>
  );
}
