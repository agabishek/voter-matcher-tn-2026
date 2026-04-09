'use client';

/**
 * ArchetypeCard — Displays the user's assigned political archetype
 *
 * Reads archetype name and description from Archetype_Registry via useConfig().
 * Renders in the active language via useLanguage(). Shows primary archetype
 * prominently with an optional secondary archetype noted.
 *
 * No hardcoded archetype names or descriptions — everything is data-driven
 * from the ConfigBundle.
 *
 * @module components/ArchetypeCard
 */

import React, { useMemo } from 'react';
import { useConfig } from '@/lib/configProvider';
import { useLanguage } from '@/lib/languageProvider';

interface ArchetypeCardProps {
  readonly archetypeId: string;
  readonly secondaryArchetypeId?: string;
}

export default function ArchetypeCard({
  archetypeId,
  secondaryArchetypeId,
}: ArchetypeCardProps): React.JSX.Element {
  const config = useConfig();
  const { activeLang, t } = useLanguage();

  const langKey = activeLang as 'en' | 'ta';

  const primary = useMemo(
    () => config.archetypes.archetypes.find((a) => a.id === archetypeId),
    [config.archetypes.archetypes, archetypeId],
  );

  const secondary = useMemo(
    () =>
      secondaryArchetypeId
        ? config.archetypes.archetypes.find((a) => a.id === secondaryArchetypeId)
        : undefined,
    [config.archetypes.archetypes, secondaryArchetypeId],
  );

  const primaryName = primary?.names[langKey] ?? primary?.names.en ?? archetypeId;
  const primaryDescription =
    primary?.descriptions[langKey] ?? primary?.descriptions.en ?? '';

  const secondaryName = secondary?.names[langKey] ?? secondary?.names.en ?? '';

  const isTamil = activeLang === 'ta';

  return (
    <section
      className="vm-card w-full"
      lang={activeLang}
      aria-label={t('result.archetype.accessibilityLabel', { archetype: primaryName })}
      style={isTamil ? { fontSize: '16px' } : undefined}
    >
      {/* Title */}
      <h3
        className={`text-sm font-medium uppercase tracking-wide mb-3 ${
          isTamil ? 'text-base' : ''
        }`}
        style={{ color: 'var(--muted)' }}
      >
        {t('result.archetype.title')}
      </h3>

      {/* Primary archetype name */}
      <p
        className={`text-xl sm:text-2xl font-semibold mb-3 ${
          isTamil ? 'text-xl leading-relaxed' : ''
        }`}
        style={{ color: 'var(--foreground)' }}
      >
        {primaryName}
      </p>

      {/* Primary archetype description */}
      <p
        className={`leading-relaxed ${
          isTamil ? 'text-base' : 'text-sm sm:text-base'
        }`}
        style={{ color: 'var(--muted)' }}
      >
        {primaryDescription}
      </p>

      {/* Secondary archetype (optional) */}
      {secondary && secondaryName && (
        <p
          className={`mt-4 italic ${
            isTamil ? 'text-base' : 'text-sm'
          }`}
          style={{ color: 'var(--muted)' }}
        >
          {t('result.archetype.secondary', { archetype: secondaryName })}
        </p>
      )}
    </section>
  );
}
