'use client';

import React, { useMemo } from 'react';
import { useConfig } from '@/lib/configProvider';
import { useLanguage } from '@/lib/languageProvider';

interface PartyMatchCardsProps {
  readonly partyScores: Record<string, number>;
}

interface RankedParty {
  readonly id: string;
  readonly name: string;
  readonly fullName: string;
  readonly score: number;
  readonly rank: number;
}

/** Map party IDs to their CSS variable names for colors */
const PARTY_COLOR_VAR: Record<string, string> = {
  dmk: '--dmk',
  aiadmk: '--aiadmk',
  tvk: '--tvk',
};

function getPartyColor(partyId: string): string {
  const varName = PARTY_COLOR_VAR[partyId.toLowerCase()];
  return varName ? `var(${varName})` : 'var(--accent)';
}

function getPartyColorRgba(partyId: string, alpha: number): string {
  const colorMap: Record<string, string> = {
    dmk: `rgba(230,57,70,${alpha})`,
    aiadmk: `rgba(244,162,97,${alpha})`,
    tvk: `rgba(69,123,157,${alpha})`,
  };
  return colorMap[partyId.toLowerCase()] ?? `rgba(124,58,237,${alpha})`;
}

export default function PartyMatchCards({
  partyScores,
}: PartyMatchCardsProps): React.JSX.Element {
  const config = useConfig();
  const { activeLang, t } = useLanguage();

  const langKey = activeLang as 'en' | 'ta';

  const rankedParties = useMemo((): readonly RankedParty[] => {
    const activeParties = config.parties.parties.filter((p) => p.active);

    const sorted = activeParties
      .map((party) => ({
        id: party.id,
        name: party.names[langKey] ?? party.names.en,
        fullName: party.fullNames[langKey] ?? party.fullNames.en,
        score: partyScores[party.id] ?? 0,
      }))
      .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

    return sorted.map((party, index) => ({
      ...party,
      rank: index + 1,
    }));
  }, [config.parties.parties, partyScores, langKey]);

  if (rankedParties.length === 0) {
    return <></>;
  }

  return (
    <div className="flex flex-col gap-4 w-full" role="list" aria-label={t('result.match.label')}>
      {rankedParties.map((party) => {
        const isPrimary = party.rank === 1;
        const isSecondary = party.rank === 2;
        const roundedScore = Math.round(party.score);
        const rankLabel = isPrimary
          ? t('result.party.primary')
          : isSecondary
            ? t('result.party.secondary')
            : undefined;

        const partyColor = getPartyColor(party.id);
        const partyBgRgba = getPartyColorRgba(party.id, 0.06);

        return (
          <div
            key={party.id}
            role="listitem"
            aria-label={t('result.party.accessibilityLabel', {
              party: party.name,
              score: roundedScore,
            })}
            className="rounded-xl px-4 py-3 sm:px-5 sm:py-4 transition-colors"
            lang={activeLang}
            style={{
              border: isPrimary
                ? `2px solid ${partyColor}`
                : '2px solid var(--border)',
              background: isPrimary ? partyBgRgba : 'var(--card)',
              ...(activeLang === 'ta' ? { fontSize: '16px' } : {}),
            }}
          >
            {/* Header: score + badge on top, party name below */}
            <div className="flex items-center justify-between gap-3 mb-2">
              <span
                className={`font-bold tabular-nums ${
                  isPrimary ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'
                }`}
                style={{ color: isPrimary ? 'var(--foreground)' : 'var(--muted)' }}
              >
                {t('result.party.match', { score: roundedScore })}
              </span>
              {rankLabel !== undefined && (
                <span
                  className="accent-badge text-xs font-medium px-2 py-0.5 rounded-full"
                  style={isPrimary ? {
                    background: 'rgba(124,58,237,0.2)',
                    border: '1px solid rgba(124,58,237,0.4)',
                    color: 'var(--accent2)',
                  } : {
                    background: 'var(--card2)',
                    color: 'var(--muted)',
                  }}
                >
                  {rankLabel}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1 mb-3">
              <span
                className={`font-semibold leading-tight ${
                  isPrimary ? 'text-lg' : 'text-base'
                }`}
                style={{ color: 'var(--foreground)', overflowWrap: 'break-word' }}
              >
                {party.name}
              </span>
              <span
                className="text-xs sm:text-sm leading-relaxed"
                style={{ color: 'var(--muted)', overflowWrap: 'break-word' }}
              >
                {party.fullName}
              </span>
            </div>

            {/* Visual bar */}
            <div
              className="w-full h-4 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={roundedScore}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t('result.party.accessibilityLabel', {
                party: party.name,
                score: roundedScore,
              })}
              style={{ background: 'var(--card2)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max(roundedScore, 2)}%`,
                  background: partyColor,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
