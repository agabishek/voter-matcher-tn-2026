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

/** Public-safe ConfigBundle subset */
interface PublicConfigBundle {
  parties: ConfigBundle['parties'];
  axes: ConfigBundle['axes'];
  archetypes: ConfigBundle['archetypes'];
  languages: ConfigBundle['languages'];
  scoringParams: ConfigBundle['scoringParams'];
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

    const publicConfig: PublicConfigBundle = {
      parties: config.parties,
      axes: config.axes,
      archetypes: config.archetypes,
      languages: config.languages,
      scoringParams: config.scoringParams,
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
