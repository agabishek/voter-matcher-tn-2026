/**
 * sessionStorage - localStorage persistence for questionnaire sessions
 *
 * Responsibilities:
 * - Serialize and save a Session to localStorage on every answer/skip
 * - Load and deserialize a Session from localStorage on reconnect
 * - Verify the stored configVersion matches the current config before restoring
 * - Clear all session data when the session ends (result viewed, tab closed,
 *   or navigation away)
 *
 * Serialization note:
 * Map and Set are not JSON-serializable. We convert them to plain arrays
 * before storing and reconstruct them on load.
 *
 * @module lib/sessionStorage
 */

import type { Session } from '@/engines/questionnaireEngine';

// ─── Storage keys ─────────────────────────────────────────────────────────────

const SESSION_KEY = 'vm_session';

// ─── Serialization helpers ────────────────────────────────────────────────────

interface SerializedSession {
  id: string;
  questions: Session['questions'];
  answers: ReadonlyArray<[string, string]>; // Map entries
  skipped: readonly string[]; // Set entries
  startedAt: number;
  language: string;
  configVersion: string;
}

function serialize(session: Session): SerializedSession {
  return {
    id: session.id,
    questions: session.questions,
    answers: [...session.answers.entries()],
    skipped: [...session.skipped],
    startedAt: session.startedAt,
    language: session.language,
    configVersion: session.configVersion,
  };
}

function deserialize(raw: SerializedSession): Session {
  return {
    id: raw.id,
    questions: raw.questions,
    answers: new Map(raw.answers),
    skipped: new Set(raw.skipped),
    startedAt: raw.startedAt,
    language: raw.language,
    configVersion: raw.configVersion,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Serialize and save the session to localStorage.
 * Safe to call on every answer/skip — overwrites the previous value.
 * No-ops silently if localStorage is unavailable (SSR, private browsing quota).
 */
export function saveSession(session: Session): void {
  try {
    const serialized = serialize(session);
    localStorage.setItem(SESSION_KEY, JSON.stringify(serialized));
  } catch {
    // localStorage unavailable or quota exceeded — fail silently
  }
}

/**
 * Load a session from localStorage and verify its configVersion matches
 * the provided currentConfigVersion.
 *
 * Returns null if:
 * - No session is stored
 * - The stored data is malformed
 * - The configVersion does not match (stale session from a previous config)
 * - localStorage is unavailable
 */
export function loadSession(currentConfigVersion: string): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw === null) {
      return null;
    }

    const parsed = JSON.parse(raw) as SerializedSession;

    // Verify config version matches — reject stale sessions
    if (parsed.configVersion !== currentConfigVersion) {
      clearSession();
      return null;
    }

    // Basic shape validation
    if (
      typeof parsed.id !== 'string' ||
      !Array.isArray(parsed.questions) ||
      !Array.isArray(parsed.answers) ||
      !Array.isArray(parsed.skipped) ||
      typeof parsed.startedAt !== 'number' ||
      typeof parsed.language !== 'string' ||
      typeof parsed.configVersion !== 'string'
    ) {
      clearSession();
      return null;
    }

    return deserialize(parsed);
  } catch {
    // Malformed JSON or localStorage unavailable
    clearSession();
    return null;
  }
}

/**
 * Remove all session data from localStorage.
 * Call this when:
 * - The user views their result (session complete)
 * - The tab is closed (via beforeunload)
 * - The user navigates away from the questionnaire
 */
export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // localStorage unavailable — fail silently
  }
}
