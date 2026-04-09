'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useConfig } from '@/lib/configProvider';
import { useLanguage } from '@/lib/languageProvider';
import LanguageToggle from '@/components/LanguageToggle';
import type { AgeGroup } from '@/engines/explanationEngine';
import { AGE_GROUPS } from '@/engines/explanationEngine';
import constituenciesData from '@/config/constituencies.json';

export interface DemographicData {
  readonly ageGroup?: AgeGroup;
  readonly districtId?: string;
  readonly constituencyId?: number;
}

interface OnboardingScreenProps {
  readonly onBegin: (demographic: DemographicData) => void;
  readonly onHome?: () => void;
}

interface BilingualName {
  readonly en: string;
  readonly ta: string;
}

interface Constituency {
  readonly id: number;
  readonly name: BilingualName;
}

interface District {
  readonly id: string;
  readonly names: BilingualName;
  readonly constituencies: readonly Constituency[];
}

interface ConstituenciesConfig {
  readonly version: string;
  readonly hash: string;
  readonly districts: readonly District[];
}

const STEPS = [
  { icon: '📋', key: 'onboarding.step1' },
  { icon: '⚖️', key: 'onboarding.step2' },
  { icon: '🧠', key: 'onboarding.step3' },
  { icon: '🔒', key: 'onboarding.privacyStatement' },
] as const;

const AGE_GROUP_OPTIONS: ReadonlyArray<{ readonly value: AgeGroup; readonly labelKey: string }> = [
  { value: AGE_GROUPS.youth, labelKey: 'onboarding.ageYouth' },
  { value: AGE_GROUPS.adult, labelKey: 'onboarding.ageAdult' },
  { value: AGE_GROUPS.senior, labelKey: 'onboarding.ageSenior' },
];

const typedConstituencies = constituenciesData as ConstituenciesConfig;

const SELECT_STYLE: React.CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  color: 'var(--foreground)',
};

export default function OnboardingScreen({ onBegin, onHome }: OnboardingScreenProps): React.JSX.Element {
  const config = useConfig();
  const { activeLang, t } = useLanguage();
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<AgeGroup | ''>('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');
  const [selectedConstituencyId, setSelectedConstituencyId] = useState<string>('');

  const selectedDistrict = useMemo<District | undefined>(
    () => typedConstituencies.districts.find((d) => d.id === selectedDistrictId),
    [selectedDistrictId],
  );

  const handleDistrictChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>): void => {
    setSelectedDistrictId(e.target.value);
    setSelectedConstituencyId('');
  }, []);

  const handleConstituencyChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>): void => {
    setSelectedConstituencyId(e.target.value);
  }, []);

  const handleBegin = useCallback((): void => {
    const demographic: DemographicData = {
      ...(selectedAgeGroup ? { ageGroup: selectedAgeGroup } : {}),
      ...(selectedDistrictId ? { districtId: selectedDistrictId } : {}),
      ...(selectedConstituencyId ? { constituencyId: Number(selectedConstituencyId) } : {}),
    };
    onBegin(demographic);
  }, [onBegin, selectedAgeGroup, selectedDistrictId, selectedConstituencyId]);

  const langKey = activeLang === 'ta' ? 'ta' : 'en';

  return (
    <div className="flex flex-col" lang={activeLang} style={{ background: 'var(--background)', height: '100dvh' }}>
      {/* Nav bar */}
      <nav className="nav-blur flex justify-between items-start px-4 sm:px-6 py-3 shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {onHome && (
            <button
              type="button"
              onClick={onHome}
              aria-label={t('nav.home')}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 shrink-0"
              style={{ color: 'var(--accent2)', background: 'transparent' }}
            >
              🏠
            </button>
          )}
          <div
            className="font-bold text-sm sm:text-lg gradient-text min-w-0"
            style={{ overflowWrap: 'break-word', wordBreak: 'break-word', lineHeight: '1.4' }}
          >
            {t('app.title')}
          </div>
        </div>
        <div className="shrink-0">
          <LanguageToggle />
        </div>
      </nav>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center max-w-xl mx-auto w-full px-6 py-6">
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
          {t('onboarding.title')}
        </h2>
        <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>
          {t('onboarding.subtitle')}
        </p>

        {/* Steps */}
        {STEPS.map((step) => (
          <div key={step.key} className="vm-card flex gap-4 items-start mb-4 w-full">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ background: 'rgba(124,58,237,0.2)' }}
            >
              {step.icon}
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              {t(step.key)}
            </p>
          </div>
        ))}

        {/* Disclaimer */}
        <div
          className="w-full rounded-xl p-4 mb-6 text-sm leading-relaxed"
          style={{
            background: 'rgba(124,58,237,0.08)',
            border: '1px solid rgba(124,58,237,0.3)',
            color: 'var(--muted)',
          }}
        >
          ⚠️ {t('disclaimer.text')}
        </div>

        {/* Age group */}
        <div className="w-full mb-6">
          <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--muted)' }}>
            {t('onboarding.demographicLabel')}
          </label>
          <select
            value={selectedAgeGroup}
            onChange={(e): void => setSelectedAgeGroup(e.target.value as AgeGroup | '')}
            className="w-full px-4 py-2.5 rounded-lg text-sm"
            style={SELECT_STYLE}
          >
            <option value="">{t('onboarding.demographicPlaceholder')}</option>
            {AGE_GROUP_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
            ))}
          </select>
        </div>

        {/* District */}
        <div className="w-full mb-6">
          <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--muted)' }}>
            {t('onboarding.districtLabel')}
          </label>
          <select
            value={selectedDistrictId}
            onChange={handleDistrictChange}
            className="w-full px-4 py-2.5 rounded-lg text-sm"
            style={SELECT_STYLE}
          >
            <option value="">{t('onboarding.districtPlaceholder')}</option>
            {typedConstituencies.districts.map((district) => (
              <option key={district.id} value={district.id}>
                {district.names[langKey]}
              </option>
            ))}
          </select>
        </div>

        {/* Constituency (shown only when district is selected) */}
        {selectedDistrict && (
          <div className="w-full mb-6">
            <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--muted)' }}>
              {t('onboarding.constituencyLabel')}
            </label>
            <select
              value={selectedConstituencyId}
              onChange={handleConstituencyChange}
              className="w-full px-4 py-2.5 rounded-lg text-sm"
              style={SELECT_STYLE}
            >
              <option value="">{t('onboarding.constituencyPlaceholder')}</option>
              {selectedDistrict.constituencies.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name[langKey]}
                </option>
              ))}
            </select>
          </div>
        )}

        </div>
      </div>

      {/* Sticky bottom button — always visible */}
      <div className="shrink-0 px-6 py-4" style={{ background: 'var(--background)', borderTop: '1px solid var(--border)' }}>
        <button type="button" onClick={handleBegin} className="btn-glow w-full text-base">
          {t('onboarding.beginButton')} →
        </button>
      </div>
    </div>
  );
}
