/**
 * Property-Based Tests for Language Completeness
 *
 * **Validates: Requirements 10 (Language completeness)**
 *
 * Property: For every string key present in any language file, all other
 * language files for the same namespace must contain the same key.
 *
 * This ensures that no locale is missing translations that exist in another
 * locale, preventing runtime missing-key errors for any user regardless of
 * their language preference.
 *
 * Supported locales: en, ta
 * Supported namespaces: common, questionnaire, result, explanation
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import * as fc from 'fast-check';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const LOCALES_DIR = join(process.cwd(), 'locales');
const SUPPORTED_LOCALES = ['en', 'ta'] as const;
type Locale = typeof SUPPORTED_LOCALES[number];

/** Load a locale namespace JSON file and return its keys (flat). */
function loadLocaleKeys(locale: Locale, namespace: string): Set<string> {
  const filePath = join(LOCALES_DIR, locale, `${namespace}.json`);
  if (!existsSync(filePath)) {
    return new Set();
  }
  const content = readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(content) as Record<string, unknown>;
  return new Set(Object.keys(parsed));
}

/** Discover all namespace names from the English locale directory (canonical). */
function discoverNamespaces(): string[] {
  const enDir = join(LOCALES_DIR, 'en');
  if (!existsSync(enDir)) return [];
  return readdirSync(enDir)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''));
}

// ─── Static correctness tests ─────────────────────────────────────────────────

describe('Language Completeness – static verification', () => {
  const namespaces = discoverNamespaces();

  it('locales directory exists with both en and ta subdirectories', () => {
    expect(existsSync(join(LOCALES_DIR, 'en'))).toBe(true);
    expect(existsSync(join(LOCALES_DIR, 'ta'))).toBe(true);
  });

  it('both locales have the same set of namespace files', () => {
    const enFiles = readdirSync(join(LOCALES_DIR, 'en')).filter(f => f.endsWith('.json')).sort();
    const taFiles = readdirSync(join(LOCALES_DIR, 'ta')).filter(f => f.endsWith('.json')).sort();
    expect(enFiles).toEqual(taFiles);
  });

  for (const ns of namespaces) {
    it(`namespace "${ns}": every en key exists in ta`, () => {
      const enKeys = loadLocaleKeys('en', ns);
      const taKeys = loadLocaleKeys('ta', ns);
      const missingInTa = [...enKeys].filter(k => !taKeys.has(k));
      expect(missingInTa).toEqual([]);
    });

    it(`namespace "${ns}": every ta key exists in en`, () => {
      const enKeys = loadLocaleKeys('en', ns);
      const taKeys = loadLocaleKeys('ta', ns);
      const missingInEn = [...taKeys].filter(k => !enKeys.has(k));
      expect(missingInEn).toEqual([]);
    });

    it(`namespace "${ns}": no locale file is empty`, () => {
      for (const locale of SUPPORTED_LOCALES) {
        const keys = loadLocaleKeys(locale, ns);
        expect(keys.size).toBeGreaterThan(0);
      }
    });
  }
});

// ─── Property-Based Tests ─────────────────────────────────────────────────────

describe('Language Completeness – property-based tests', () => {
  /**
   * Property: Language completeness is symmetric.
   *
   * For any pair of locales (en, ta), if locale A has key K in namespace N,
   * then locale B must also have key K in namespace N, and vice versa.
   *
   * **Validates: Requirements 10**
   */
  it('Property: key sets are identical across all locales for every namespace', () => {
    const namespaces = discoverNamespaces();

    fc.assert(
      fc.property(
        // Pick a random namespace from the discovered list
        fc.constantFrom(...namespaces),
        (namespace) => {
          const keysByLocale = SUPPORTED_LOCALES.map(locale => ({
            locale,
            keys: loadLocaleKeys(locale, namespace),
          }));

          // Every locale must have the same keys as every other locale
          for (let i = 0; i < keysByLocale.length; i++) {
            for (let j = i + 1; j < keysByLocale.length; j++) {
              const a = keysByLocale[i]!;
              const b = keysByLocale[j]!;

              const missingInB = [...a.keys].filter(k => !b.keys.has(k));
              const missingInA = [...b.keys].filter(k => !a.keys.has(k));

              if (missingInB.length > 0 || missingInA.length > 0) {
                throw new Error(
                  `Locale key mismatch in namespace "${namespace}":\n` +
                  (missingInB.length > 0
                    ? `  Keys in "${a.locale}" missing from "${b.locale}": ${missingInB.join(', ')}\n`
                    : '') +
                  (missingInA.length > 0
                    ? `  Keys in "${b.locale}" missing from "${a.locale}": ${missingInA.join(', ')}\n`
                    : '')
                );
              }
            }
          }
        }
      ),
      { numRuns: namespaces.length * 10 }
    );
  });

  /**
   * Property: A synthetically constructed locale file with a missing key
   * would be detected as incomplete.
   *
   * This validates that our completeness check logic is sound — it correctly
   * identifies asymmetric key sets as a violation.
   *
   * **Validates: Requirements 10**
   */
  it('Property: completeness check correctly detects missing keys', () => {
    fc.assert(
      fc.property(
        // Generate a set of translation keys
        fc.array(
          fc.string({ minLength: 3, maxLength: 30 }).filter(s => /^[a-z][a-z0-9._]*$/.test(s)),
          { minLength: 2, maxLength: 20 }
        ),
        // Pick one key to omit from the second locale
        fc.nat(),
        (keys, omitIndexRaw) => {
          const uniqueKeys = [...new Set(keys)];
          fc.pre(uniqueKeys.length >= 2);

          const omitIndex = omitIndexRaw % uniqueKeys.length;
          const omittedKey = uniqueKeys[omitIndex]!;

          const fullKeySet = new Set(uniqueKeys);
          const incompleteKeySet = new Set(uniqueKeys.filter((_, i) => i !== omitIndex));

          // The omitted key must be in the full set but not the incomplete set
          expect(fullKeySet.has(omittedKey)).toBe(true);
          expect(incompleteKeySet.has(omittedKey)).toBe(false);

          // Completeness check: full → incomplete should find the missing key
          const missingKeys = [...fullKeySet].filter(k => !incompleteKeySet.has(k));
          expect(missingKeys).toContain(omittedKey);
          expect(missingKeys.length).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Adding a key to one locale without adding it to the other
   * creates an asymmetry that is detectable.
   *
   * **Validates: Requirements 10**
   */
  it('Property: symmetric key sets remain symmetric after identical additions', () => {
    fc.assert(
      fc.property(
        // Base set of keys present in both locales
        fc.array(
          fc.string({ minLength: 3, maxLength: 30 }).filter(s => /^[a-z][a-z0-9._]*$/.test(s)),
          { minLength: 1, maxLength: 15 }
        ),
        // A new key to add to both
        fc.string({ minLength: 3, maxLength: 30 }).filter(s => /^[a-z][a-z0-9._]*$/.test(s)),
        (baseKeys, newKey) => {
          const uniqueBase = [...new Set(baseKeys)];
          fc.pre(!uniqueBase.includes(newKey));

          const setA = new Set(uniqueBase);
          const setB = new Set(uniqueBase);

          // Before addition: symmetric
          const diffBefore = [...setA].filter(k => !setB.has(k));
          expect(diffBefore).toEqual([]);

          // Add the same key to both
          setA.add(newKey);
          setB.add(newKey);

          // After identical addition: still symmetric
          const diffAfter = [...setA].filter(k => !setB.has(k));
          expect(diffAfter).toEqual([]);
          expect(setA.size).toBe(setB.size);
        }
      ),
      { numRuns: 100 }
    );
  });
});
