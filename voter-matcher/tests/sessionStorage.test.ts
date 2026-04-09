/**
 * Tests for sessionStorage — localStorage persistence (task 5.4)
 *
 * Runs in node environment with a manual localStorage mock,
 * since the project uses node environment and crypto APIs.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Session } from '@/engines/questionnaireEngine';

// ─── localStorage mock ────────────────────────────────────────────────────────

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string): string | null => store[key] ?? null,
  setItem: (key: string, value: string): void => { store[key] = value; },
  removeItem: (key: string): void => { delete store[key]; },
  clear: (): void => { Object.keys(store).forEach(k => delete store[k]); },
};

vi.stubGlobal('localStorage', localStorageMock);

// Import after stubbing so the module picks up the mock
const { saveSession, loadSession, clearSession } = await import('@/lib/sessionStorage');

// ─── Fixture ──────────────────────────────────────────────────────────────────

function makeSession(configVersion = 'v1'): Session {
  return {
    id: 'test-session-id',
    configVersion,
    language: 'ta',
    startedAt: 1000000,
    questions: [
      {
        id: 'q1',
        cluster: 'welfare',
        text: { en: 'Q1', ta: 'கேள்வி 1' },
        options: [
          {
            id: 'q1_a',
            text: { en: 'A', ta: 'அ' },
            partyWeights: { DMK: 3 },
            axisWeights: { welfare: 2 },
          },
        ],
      },
    ],
    answers: new Map([['q1', 'q1_a']]),
    skipped: new Set(['q2']),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('sessionStorage', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('saveSession / loadSession round-trip', () => {
    it('saves and restores a session with matching configVersion', () => {
      const session = makeSession('v1');
      saveSession(session);
      const restored = loadSession('v1');
      expect(restored).not.toBeNull();
      expect(restored?.id).toBe(session.id);
      expect(restored?.configVersion).toBe('v1');
      expect(restored?.language).toBe('ta');
      expect(restored?.startedAt).toBe(1000000);
    });

    it('restores answers Map correctly', () => {
      saveSession(makeSession());
      const restored = loadSession('v1');
      expect(restored?.answers.get('q1')).toBe('q1_a');
    });

    it('restores skipped Set correctly', () => {
      saveSession(makeSession());
      const restored = loadSession('v1');
      expect(restored?.skipped.has('q2')).toBe(true);
    });

    it('restores questions array correctly', () => {
      saveSession(makeSession());
      const restored = loadSession('v1');
      expect(restored?.questions).toHaveLength(1);
      expect(restored?.questions[0]?.id).toBe('q1');
    });
  });

  describe('config version verification', () => {
    it('returns null when configVersion does not match', () => {
      saveSession(makeSession('v1'));
      const restored = loadSession('v2');
      expect(restored).toBeNull();
    });

    it('clears stale session when configVersion mismatches', () => {
      saveSession(makeSession('v1'));
      loadSession('v2');
      expect(loadSession('v2')).toBeNull();
    });
  });

  describe('loadSession edge cases', () => {
    it('returns null when nothing is stored', () => {
      expect(loadSession('v1')).toBeNull();
    });

    it('returns null and clears storage for malformed JSON', () => {
      localStorageMock.setItem('vm_session', '{not valid json}');
      expect(loadSession('v1')).toBeNull();
    });

    it('returns null and clears storage for missing required fields', () => {
      localStorageMock.setItem('vm_session', JSON.stringify({ id: 'x' }));
      expect(loadSession('v1')).toBeNull();
    });
  });

  describe('clearSession', () => {
    it('removes session from localStorage', () => {
      saveSession(makeSession());
      clearSession();
      expect(loadSession('v1')).toBeNull();
    });

    it('is idempotent — safe to call when nothing is stored', () => {
      expect(() => clearSession()).not.toThrow();
    });
  });

  describe('saveSession overwrites previous', () => {
    it('overwrites an existing session with updated answers', () => {
      const session = makeSession();
      saveSession(session);

      const updated: Session = {
        ...session,
        answers: new Map([
          ['q1', 'q1_a'],
          ['q2', 'q2_b'],
        ]),
      };
      saveSession(updated);

      const restored = loadSession('v1');
      expect(restored?.answers.size).toBe(2);
    });
  });
});
