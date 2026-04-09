/**
 * GET /api/config
 *
 * Returns a public-safe subset of the ConfigBundle.
 * Strips partyWeights and axisWeights from all question options
 * before returning — these are server-side-only scoring weights.
 *
 * Returns: parties, axes, archetypes, languages, scoringParams,
 *          questions (without weights), and version.
 */

import { NextResponse } from 'next/server';
import { ConfigLoader } from '@/lib/configLoader';
import type { ConfigBundle, QuestionBank } from '@/lib/configLoader';

/** Public-safe question option — weights stripped */
interface PublicOption {
  id: string;
  text: { en: string; ta: string };
}

/** Public-safe question */
interface PublicQuestion {
  id: string;
  cluster: string;
  text: { en: string; ta: string };
  options: PublicOption[];
}

/** Public-safe question bank */
interface PublicQuestionBank {
  version: string;
  questions: PublicQuestion[];
}

/** Public-safe ConfigBundle subset — hashes stripped for security */
interface PublicConfigBundle {
  parties: Omit<ConfigBundle['parties'], 'hash'>;
  axes: Omit<ConfigBundle['axes'], 'hash'>;
  archetypes: Omit<ConfigBundle['archetypes'], 'hash'>;
  languages: Omit<ConfigBundle['languages'], 'hash'>;
  scoringParams: Omit<ConfigBundle['scoringParams'], 'hash'>;
  questions: PublicQuestionBank;
  version: string;
}

function stripWeights(questions: QuestionBank): PublicQuestionBank {
  return {
    version: questions.version,
    questions: questions.questions.map((q) => ({
      id: q.id,
      cluster: q.cluster,
      text: q.text,
      options: q.options.map((opt) => ({
        id: opt.id,
        text: opt.text,
      })),
    })),
  };
}

export async function GET(): Promise<NextResponse<PublicConfigBundle | { error: string }>> {
  try {
    const loader = new ConfigLoader();
    const config = loader.load();

    const { hash: _ph, ...publicParties } = config.parties;
    const { hash: _ah, ...publicAxes } = config.axes;
    const { hash: _arch, ...publicArchetypes } = config.archetypes;
    const { hash: _lh, ...publicLanguages } = config.languages;
    const { hash: _sh, ...publicScoringParams } = config.scoringParams;

    const publicConfig: PublicConfigBundle = {
      parties: publicParties,
      axes: publicAxes,
      archetypes: publicArchetypes,
      languages: publicLanguages,
      scoringParams: publicScoringParams,
      questions: stripWeights(config.questions),
      version: config.version,
    };

    return NextResponse.json(publicConfig, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load config';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
