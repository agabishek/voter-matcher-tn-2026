/**
 * POST /api/score
 *
 * Server-side scoring fallback. Called only when client-side scoring fails.
 *
 * Request body:
 *   { answers: Record<string, string>, configVersion: string,
 *     sessionDuration?: number, _hp?: string }
 *
 * Returns ScoreResult on success.
 * Returns 409 if configVersion mismatches the server's active config.
 * Returns 400 for bot detection failures (honeypot or session duration).
 */

import { NextRequest, NextResponse } from 'next/server';
import { ConfigLoader } from '@/lib/configLoader';
import { ScoringEngine } from '@/engines/scoringEngine';
import type { ScoreResult } from '@/engines/explanationEngine';

/** Minimum session duration in seconds before scoring is accepted */
const MIN_SESSION_DURATION_SECONDS = 30;

interface ScoreRequestBody {
  answers: Record<string, string>;
  configVersion: string;
  sessionDuration?: number;
  _hp?: string;
}

function isScoreRequestBody(value: unknown): value is ScoreRequestBody {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (typeof obj['configVersion'] !== 'string') return false;
  if (typeof obj['answers'] !== 'object' || obj['answers'] === null) return false;
  // Validate answers values are strings
  const answers = obj['answers'] as Record<string, unknown>;
  for (const v of Object.values(answers)) {
    if (typeof v !== 'string') return false;
  }
  return true;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ScoreResult | { error: string }>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!isScoreRequestBody(body)) {
    return NextResponse.json(
      { error: 'Missing required fields: answers (object) and configVersion (string)' },
      { status: 400 }
    );
  }

  // Bot detection: honeypot field — reject if _hp is present and non-empty
  if (typeof body._hp === 'string' && body._hp.length > 0) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  // Bot detection: minimum session duration
  if (
    typeof body.sessionDuration === 'number' &&
    body.sessionDuration < MIN_SESSION_DURATION_SECONDS
  ) {
    return NextResponse.json(
      { error: 'Session duration too short' },
      { status: 400 }
    );
  }

  // Load server config and verify version
  let config;
  try {
    const loader = new ConfigLoader();
    config = loader.load();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Config load failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (body.configVersion !== config.version) {
    return NextResponse.json(
      { error: 'Config version mismatch. Please reload the page and try again.' },
      { status: 409 }
    );
  }

  // Compute scores using the ScoringEngine
  const engine = new ScoringEngine();
  const selectedOptionIds = Object.values(body.answers);
  const rawResult = engine.compute(selectedOptionIds, config.questions, config);
  const normalizedPartyScores = engine.normalize(rawResult.partyScores);
  const confidenceResult = engine.computeConfidence(normalizedPartyScores);

  const answeredCount = selectedOptionIds.length;
  const totalQuestions = config.questions.questions.length;
  const skippedCount = totalQuestions - answeredCount;

  const scoreResult: ScoreResult = {
    partyScores: normalizedPartyScores,
    rawScores: rawResult.partyScores,
    axisScores: rawResult.axisScores,
    confidenceScore: confidenceResult.level,
    confidenceGap: confidenceResult.gap,
    answeredCount,
    skippedCount,
    configVersion: config.version,
  };

  return NextResponse.json(scoreResult);
}
