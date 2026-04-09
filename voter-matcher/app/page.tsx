'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useConfig } from '@/lib/configProvider';
import { useLanguage } from '@/lib/languageProvider';
import LandingScreen from '@/components/LandingScreen';
import OnboardingScreen from '@/components/OnboardingScreen';
import type { DemographicData } from '@/components/OnboardingScreen';
import QuestionCard from '@/components/QuestionCard';
import ProgressBar from '@/components/ProgressBar';
import AxisWarning from '@/components/AxisWarning';
import SkipWarning from '@/components/SkipWarning';
import ProcessingScreen from '@/components/ProcessingScreen';
import PartyMatchCards from '@/components/PartyMatchCards';
import ConfidencePanel from '@/components/ConfidencePanel';
import ArchetypeCard from '@/components/ArchetypeCard';
import AxisBreakdown from '@/components/AxisBreakdown';
import ExplanationPanel from '@/components/ExplanationPanel';
import ConsistencyNotice from '@/components/ConsistencyNotice';
import TrackRecordNotice from '@/components/TrackRecordNotice';
import NonPrimaryExplainer from '@/components/NonPrimaryExplainer';
import SharePanel from '@/components/SharePanel';
import LanguageToggle from '@/components/LanguageToggle';
import { QuestionnaireEngine } from '@/engines/questionnaireEngine';
import type { Session, Warning } from '@/engines/questionnaireEngine';
import { ScoringEngine } from '@/engines/scoringEngine';
import { ProfilingEngine } from '@/engines/profilingEngine';
import type { ArchetypeResult, Contradiction } from '@/engines/profilingEngine';
import { ExplanationEngine } from '@/engines/explanationEngine';
import type { Explanation, ScoreResult } from '@/engines/explanationEngine';
import { saveSession, loadSession, clearSession } from '@/lib/sessionStorage';

const SCREEN = {
  Landing: 'landing',
  Onboarding: 'onboarding',
  Questionnaire: 'questionnaire',
  Processing: 'processing',
  Results: 'results',
} as const;
type Screen = (typeof SCREEN)[keyof typeof SCREEN];

const PROCESSING_DURATION_MS = 2800;

const questionnaireEngine = new QuestionnaireEngine();
const scoringEngine = new ScoringEngine();
const profilingEngine = new ProfilingEngine();
const explanationEngine = new ExplanationEngine();

/** Back button styled for the dark theme */
function BackButton({ onClick, label }: { readonly onClick: () => void; readonly label: string }): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
      style={{ color: 'var(--accent2)', background: 'transparent' }}
    >
      <span aria-hidden="true">←</span> {label}
    </button>
  );
}

/** Consistent top bar with optional back button and home button */
function NavBar({ onBack, backLabel, onHome }: { readonly onBack?: () => void; readonly backLabel?: string; readonly onHome?: () => void }): React.JSX.Element {
  const { t } = useLanguage();
  return (
    <nav className="nav-blur sticky top-0 z-50 flex justify-between items-center px-4 sm:px-6 py-3 shrink-0">
      <div className="flex items-center gap-2">
        {onHome && (
          <button
            type="button"
            onClick={onHome}
            aria-label={t('nav.home') ?? 'Home'}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
            style={{ color: 'var(--accent2)', background: 'transparent' }}
          >
            🏠
          </button>
        )}
        {onBack && backLabel && <BackButton onClick={onBack} label={backLabel} />}
        {!onBack && !onHome && (
          <div
            className="font-bold text-sm sm:text-lg gradient-text min-w-0 flex-1"
            style={{ overflowWrap: 'break-word', wordBreak: 'break-word', lineHeight: '1.4' }}
          >
            {t('app.title')}
          </div>
        )}
      </div>
      <div className="shrink-0">
        <LanguageToggle />
      </div>
    </nav>
  );
}

export default function Home(): React.JSX.Element {
  const config = useConfig();
  const { activeLang, t } = useLanguage();

  const [screen, setScreen] = useState<Screen>(SCREEN.Landing);
  const [session, setSession] = useState<Session | null>(null);
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [demographic, setDemographic] = useState<DemographicData>({});

  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [archetype, setArchetype] = useState<ArchetypeResult | null>(null);
  const [contradictions, setContradictions] = useState<readonly Contradiction[]>([]);

  // Recompute explanation whenever language changes so it stays in sync
  const explanation = useMemo((): Explanation | null => {
    if (!scoreResult || !archetype) return null;
    const lang = activeLang as 'en' | 'ta';
    return explanationEngine.generate(
      scoreResult,
      archetype,
      contradictions as Contradiction[],
      config,
      lang,
    );
  }, [scoreResult, archetype, contradictions, config, activeLang]);

  const restoredSession = useMemo((): Session | null => {
    return loadSession(config.version);
  }, [config.version]);

  // ── Browser history integration ──
  const navigateTo = useCallback((newScreen: Screen): void => {
    setScreen(newScreen);
    window.history.pushState({ screen: newScreen }, '', `#${newScreen}`);
  }, []);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event: PopStateEvent): void => {
      const state = event.state as { screen?: Screen } | null;
      if (state?.screen) {
        setScreen(state.screen);
      } else {
        setScreen(SCREEN.Landing);
      }
    };
    window.addEventListener('popstate', handlePopState);

    // Set initial state
    window.history.replaceState({ screen: SCREEN.Landing }, '', '#landing');

    return (): void => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // ── Screen-level back navigation ──
  const goToLanding = useCallback((): void => {
    navigateTo(SCREEN.Landing);
  }, [navigateTo]);

  const goToOnboarding = useCallback((): void => {
    navigateTo(SCREEN.Onboarding);
  }, [navigateTo]);

  // ── Navigation handlers ──
  const handleStart = useCallback((): void => {
    navigateTo(SCREEN.Onboarding);
  }, [navigateTo]);

  const handleBegin = useCallback((demo: DemographicData): void => {
    setDemographic(demo);
    const existing = restoredSession;
    if (existing) {
      setSession(existing);
      const answered = existing.answers.size + existing.skipped.size;
      setQuestionIndex(Math.min(answered, existing.questions.length - 1));
    } else {
      const newSession = questionnaireEngine.createSession(config, activeLang);
      setSession(newSession);
      setQuestionIndex(0);
      saveSession(newSession);
    }
    navigateTo(SCREEN.Questionnaire);
  }, [config, activeLang, restoredSession, navigateTo]);

  const computeResults = useCallback((finalSession: Session): void => {
    navigateTo(SCREEN.Processing);
    setTimeout(() => {
      const selectedOptionIds = [...finalSession.answers.values()];
      const rawResult = scoringEngine.compute(selectedOptionIds, config.questions, config);
      const normalizedScores = scoringEngine.normalize(rawResult.partyScores);
      const confidence = scoringEngine.computeConfidence(normalizedScores);

      const result: ScoreResult = {
        partyScores: normalizedScores,
        rawScores: rawResult.partyScores,
        axisScores: rawResult.axisScores,
        confidenceScore: confidence.level,
        confidenceGap: confidence.gap,
        answeredCount: finalSession.answers.size,
        skippedCount: finalSession.skipped.size,
        configVersion: finalSession.configVersion,
      };

      const archetypeResult = profilingEngine.classify(rawResult.axisScores, config);
      const detectedContradictions = profilingEngine.detectContradictions(rawResult.axisScores, config);

      let finalConfidence = confidence.level;
      if (detectedContradictions.length > 0) {
        if (finalConfidence === 'High') finalConfidence = 'Medium';
        else if (finalConfidence === 'Medium') finalConfidence = 'Low';
      }
      result.confidenceScore = finalConfidence;

      setScoreResult(result);
      setArchetype(archetypeResult);
      setContradictions(detectedContradictions);
      clearSession();
      navigateTo(SCREEN.Results);
    }, PROCESSING_DURATION_MS);
  }, [config, activeLang, navigateTo]);

  const handleRetake = useCallback((): void => {
    setScoreResult(null);
    setArchetype(null);
    setContradictions([]);
    setSession(null);
    setQuestionIndex(0);
    clearSession();
    navigateTo(SCREEN.Landing);
  }, [navigateTo]);

  const handleSelectOption = useCallback((optionId: string): void => {
    if (!session) return;
    const currentQuestion = session.questions[questionIndex];
    if (!currentQuestion) return;
    const updated = questionnaireEngine.selectOption(session, currentQuestion.id, optionId);
    setSession(updated);
    saveSession(updated);
    if (questionIndex < session.questions.length - 1) {
      setQuestionIndex((prev) => prev + 1);
    } else {
      computeResults(updated);
    }
  }, [session, questionIndex, computeResults]);

  const handleSkip = useCallback((): void => {
    if (!session) return;
    const currentQuestion = session.questions[questionIndex];
    if (!currentQuestion) return;
    const updated = questionnaireEngine.skipQuestion(session, currentQuestion.id);
    setSession(updated);
    saveSession(updated);
    if (questionIndex < session.questions.length - 1) {
      setQuestionIndex((prev) => prev + 1);
    } else {
      computeResults(updated);
    }
  }, [session, questionIndex, computeResults]);

  const handleQuestionBack = useCallback((): void => {
    if (questionIndex > 0) {
      setQuestionIndex((prev) => prev - 1);
    }
  }, [questionIndex]);

  const warnings: Warning[] = useMemo(() => {
    if (!session) return [];
    return questionnaireEngine.getWarnings(session, config);
  }, [session, config]);

  const topParty = useMemo(() => {
    if (!scoreResult) return null;
    const topId = Object.entries(scoreResult.partyScores).sort(([, a], [, b]) => b - a)[0]?.[0];
    if (!topId) return null;
    return config.parties.parties.find((p) => p.id === topId) ?? null;
  }, [scoreResult, config.parties.parties]);

  // ── Render ──

  if (screen === SCREEN.Landing) {
    return <LandingScreen onStart={handleStart} />;
  }

  if (screen === SCREEN.Onboarding) {
    return <OnboardingScreen onBegin={handleBegin} onHome={goToLanding} />;
  }

  if (screen === SCREEN.Processing) {
    return (
      <div className="flex flex-col overflow-hidden" style={{ background: 'var(--background)', height: '100dvh' }}>
        <NavBar onHome={goToLanding} />
        <ProcessingScreen />
      </div>
    );
  }

  if (screen === SCREEN.Results && scoreResult && archetype && explanation) {
    const lang = activeLang as 'en' | 'ta';
    return (
      <div className="flex flex-col" style={{ background: 'var(--background)', height: '100dvh' }}>
        <NavBar onHome={goToLanding} />
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col items-center gap-4 sm:gap-6 px-3 sm:px-4 py-6 sm:py-8 max-w-2xl mx-auto w-full">
            <PartyMatchCards partyScores={scoreResult.partyScores} />
            <ConfidencePanel confidenceLevel={scoreResult.confidenceScore} />
            <ArchetypeCard archetypeId={archetype.primary} secondaryArchetypeId={archetype.secondary} />
            <AxisBreakdown axisScores={scoreResult.axisScores} />
            <ExplanationPanel explanation={explanation} />
            {explanation.nonPrimaryInsights && explanation.nonPrimaryInsights.length > 0 && (
              <NonPrimaryExplainer insights={explanation.nonPrimaryInsights} />
            )}
            <ConsistencyNotice contradictions={contradictions} />
            {topParty?.weightBasis === 'promise' && (
              <TrackRecordNotice partyName={topParty.names[lang] ?? topParty.names.en} />
            )}
            <SharePanel
              partyScores={scoreResult.partyScores}
              archetypeId={archetype.primary}
              confidenceLevel={scoreResult.confidenceScore}
              configVersion={scoreResult.configVersion}
            />
            {/* Retake button */}
            <button
              type="button"
              onClick={handleRetake}
              className="btn-glow w-full max-w-xs text-base mt-4"
            >
              {t('nav.retake')}
            </button>
            <p className="text-xs text-center leading-relaxed max-w-md" style={{ color: 'var(--muted)' }}>
              {t('disclaimer.text')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (screen === SCREEN.Questionnaire && session) {
    const currentQuestion = session.questions[questionIndex];
    if (!currentQuestion) return <ProcessingScreen />;
    const selectedOptionId = session.answers.get(currentQuestion.id);

    return (
      <div className="flex flex-col overflow-hidden" style={{ background: 'var(--background)', height: '100dvh' }}>
        <NavBar
          onHome={goToLanding}
          onBack={questionIndex > 0 ? handleQuestionBack : goToOnboarding}
          backLabel={questionIndex > 0 ? t('nav.previous') : t('nav.back')}
        />
        <div className="flex flex-col items-center gap-4 px-4 py-4 flex-1 overflow-y-auto">
          <ProgressBar
            current={questionIndex + 1}
            total={session.questions.length}
            cluster={currentQuestion.cluster}
          />
          {warnings.map((w) =>
            w.type === 'axis_skip' && w.axisId ? (
              <AxisWarning key={w.axisId} axisLabel={w.axisId} />
            ) : w.type === 'total_skip' ? (
              <SkipWarning key="total-skip" />
            ) : null,
          )}
          <QuestionCard
            question={currentQuestion}
            selectedOptionId={selectedOptionId}
            onSelect={handleSelectOption}
            onSkip={handleSkip}
          />
        </div>
      </div>
    );
  }

  return <LandingScreen onStart={handleStart} />;
}
