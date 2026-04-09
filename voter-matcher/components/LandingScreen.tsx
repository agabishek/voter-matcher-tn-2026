'use client';

import React, { useMemo } from 'react';
import { useConfig } from '@/lib/configProvider';
import { useLanguage } from '@/lib/languageProvider';
import LanguageToggle from '@/components/LanguageToggle';

const PARTY_COLORS: Record<string, string> = {
  DMK: 'pill-dmk',
  AIADMK: 'pill-aiadmk',
  TVK: 'pill-tvk',
};

// Official ECI election symbols from Wikimedia Commons (CC BY-SA 4.0 / Public Domain)
// DMK: Rising Sun (உதய சூரியன்) — SVG
// AIADMK: Two Leaves (இரட்டை இலை) — SVG
// TVK: Whistle (விசில்) — PNG (ECI public domain)
const FLAG_PATHS: Record<string, string> = {
  DMK: '/flags/dmk.svg',
  AIADMK: '/flags/aiadmk.svg',
  TVK: '/flags/tvk.png',
};

interface LandingScreenProps {
  readonly onStart: () => void;
}

export default function LandingScreen({ onStart }: LandingScreenProps): React.JSX.Element {
  const config = useConfig();
  const { activeLang, t } = useLanguage();

  const activeParties = useMemo(
    () => config.parties.parties.filter((p) => p.active),
    [config.parties.parties],
  );

  return (
    <div className="flex flex-col overflow-hidden" lang={activeLang} style={{ height: '100dvh' }}>
      {/* Nav */}
      <nav className="nav-blur flex justify-between items-start px-4 sm:px-6 py-3 shrink-0 gap-2">
        <h1
          className="font-bold text-sm sm:text-lg gradient-text min-w-0 flex-1"
          style={{ overflowWrap: 'break-word', wordBreak: 'break-word', lineHeight: '1.4' }}
        >
          {t('app.title')}
        </h1>
        <div className="shrink-0">
          <LanguageToggle />
        </div>
      </nav>

      {/* Hero */}
      <main className="landing-glow flex flex-1 flex-col items-center text-center px-4 sm:px-6 py-6 overflow-y-auto">
        <div className="flex flex-col items-center my-auto gap-0">
        <span className="accent-badge mb-4">
          🗳️ {t('app.subtitle')}
        </span>

        <p className="max-w-lg text-sm leading-relaxed mb-4" style={{ color: 'var(--muted)' }}>
          {t('app.tagline')}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:flex sm:gap-10 gap-4 mb-6 w-full max-w-sm sm:max-w-none sm:w-auto justify-items-center">
          {[
            { num: String(config.scoringParams.questionCount), label: t('landing.statsQuestions') },
            { num: `~${config.scoringParams.estimatedCompletionMinutes}`, label: t('landing.statsTime') },
            { num: '9', label: t('landing.statsDimensions') },
            { num: '100%', label: t('landing.statsAnonymous') },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-lg sm:text-xl font-bold" style={{ color: 'var(--accent2)' }}>{stat.num}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onStart}
          className="btn-glow text-base"
          aria-label={t('landing.startButton')}
        >
          {t('landing.startButton')} →
        </button>

        {/* Party pills with flags */}
        <div className="flex gap-2 mt-5 flex-wrap justify-center">
          {activeParties.map((party) => (
            <div
              key={party.id}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold ${PARTY_COLORS[party.id] ?? ''}`}
            >
              {FLAG_PATHS[party.id] && (
                <img
                  src={FLAG_PATHS[party.id]}
                  alt={`${party.names.en} symbol`}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    objectFit: 'contain',
                    background: '#fff',
                    padding: '2px',
                  }}
                />
              )}
              {party.names[activeLang as 'en' | 'ta'] ?? party.names.en}
            </div>
          ))}
        </div>

        <p className="mt-4 max-w-md text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
          {t('disclaimer.text')}
        </p>
        </div>
      </main>
    </div>
  );
}
