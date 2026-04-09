/**
 * Next.js Middleware — Rate Limiting
 *
 * Applies a sliding-window in-memory rate limiter to:
 *   POST /api/score  — 10 requests per minute per IP
 *   POST /api/share  — 5 requests per minute per IP
 *
 * Returns 429 with a Retry-After header when the limit is exceeded.
 *
 * Note: In-memory state is per-serverless-instance. For production
 * multi-instance deployments, replace with a shared store (e.g. Redis/KV).
 */

import { NextRequest, NextResponse } from 'next/server';

const WINDOW_MS = 60_000; // 1 minute

interface RateLimitConfig {
  maxRequests: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  '/api/score': { maxRequests: 10 },
  '/api/share': { maxRequests: 5 },
};

/** Sliding window store: key = `${path}:${ip}`, value = sorted timestamps */
const windowStore = new Map<string, number[]>();

/**
 * Check and record a request against the sliding window.
 * Returns null if allowed, or the number of seconds to wait if rate-limited.
 */
function checkRateLimit(key: string, maxRequests: number): number | null {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  const timestamps = (windowStore.get(key) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= maxRequests) {
    // Oldest timestamp in the window determines when the slot frees up
    const oldestInWindow = timestamps[0];
    if (oldestInWindow === undefined) return 1;
    const retryAfterMs = oldestInWindow + WINDOW_MS - now;
    return Math.ceil(retryAfterMs / 1000);
  }

  timestamps.push(now);
  windowStore.set(key, timestamps);
  return null;
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const limitConfig = RATE_LIMITS[pathname];

  if (limitConfig !== undefined && request.method === 'POST') {
    const ip = getClientIp(request);
    const key = `${pathname}:${ip}`;
    const retryAfter = checkRateLimit(key, limitConfig.maxRequests);

    if (retryAfter !== null) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfter),
          },
        }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/score', '/api/share'],
};
