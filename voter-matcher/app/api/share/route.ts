/**
 * POST /api/share
 *
 * Generates an HMAC-SHA256 signed share URL.
 * Rate limiting is handled by middleware (task 6.5).
 *
 * Request body: { payload: string }
 * Response:     { url: string, signature: string }
 *
 * Uses SHARE_SECRET env var; falls back to a dev default if not set.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

const DEV_SECRET = 'voter-matcher-dev-secret-do-not-use-in-production';

interface ShareRequestBody {
  payload: string;
}

interface ShareResponse {
  url: string;
  signature: string;
}

function isShareRequestBody(value: unknown): value is ShareRequestBody {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return typeof obj['payload'] === 'string';
}

function signPayload(payload: string): string {
  const secret = process.env['SHARE_SECRET'] ?? DEV_SECRET;
  return createHmac('sha256', secret).update(payload, 'utf-8').digest('hex');
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ShareResponse | { error: string }>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!isShareRequestBody(body)) {
    return NextResponse.json(
      { error: 'Missing required field: payload (string)' },
      { status: 400 }
    );
  }

  const { payload } = body;

  if (payload.length === 0) {
    return NextResponse.json({ error: 'payload must not be empty' }, { status: 400 });
  }

  const signature = signPayload(payload);

  // Build the share URL using the request origin
  const origin = request.headers.get('origin') ?? request.nextUrl.origin;
  const encodedPayload = encodeURIComponent(payload);
  const url = `${origin}/result?p=${encodedPayload}&sig=${signature}`;

  return NextResponse.json({ url, signature });
}
