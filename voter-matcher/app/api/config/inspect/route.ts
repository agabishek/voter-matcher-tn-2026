/**
 * GET /api/config/inspect
 *
 * Authenticated operator endpoint returning active config versions.
 * Requires OPERATOR_API_KEY in Authorization header (Bearer token).
 * Returns version strings for each config file.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ConfigLoader } from '@/lib/configLoader';

interface ConfigVersions {
  parties: string;
  axes: string;
  archetypes: string;
  languages: string;
  questions: string;
  scoringParams: string;
  composite: string;
  loadedAt: string;
}

function authenticate(request: NextRequest): boolean {
  const apiKey = process.env.OPERATOR_API_KEY;
  if (!apiKey) return false;

  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  return token === apiKey;
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ConfigVersions | { error: string }>> {
  if (!authenticate(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const loader = new ConfigLoader();
    const config = loader.load();

    const versions: ConfigVersions = {
      parties: config.parties.version,
      axes: config.axes.version,
      archetypes: config.archetypes.version,
      languages: config.languages.version,
      questions: config.questions.version,
      scoringParams: config.scoringParams.version,
      composite: config.version,
      loadedAt: config.loadedAt,
    };

    return NextResponse.json(versions);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load config';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
