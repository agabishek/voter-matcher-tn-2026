/**
 * Shared hash utilities for CLI scripts
 *
 * Recomputes SHA256 hashes for config files using the same algorithm
 * as ConfigLoader and compute-hashes.ts.
 *
 * @module scripts/hash-utils
 */

import { createHash } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const CONFIG_DIR = join(process.cwd(), 'config');

/**
 * Compute SHA256 hash of a JSON string that has its hash field set to "".
 */
export function computeHash(contentWithEmptyHash: string): string {
  return createHash('sha256').update(contentWithEmptyHash, 'utf-8').digest('hex');
}

/**
 * Read a config file, recompute its hash, and write it back.
 * Returns the new hash.
 */
export function recomputeFileHash(filename: string, configDir: string = CONFIG_DIR): string {
  const filePath = join(configDir, filename);
  const raw = readFileSync(filePath, 'utf-8');
  const config: Record<string, unknown> = JSON.parse(raw);

  // Set hash to empty for hashing
  config['hash'] = '';
  const contentWithEmptyHash = JSON.stringify(config, null, 2) + '\n';
  const newHash = computeHash(contentWithEmptyHash);

  // Write back with real hash
  config['hash'] = newHash;
  const finalContent = JSON.stringify(config, null, 2) + '\n';
  writeFileSync(filePath, finalContent, 'utf-8');

  return newHash;
}

/**
 * Verify the hash of a config file without modifying it.
 * Returns { valid, expected, computed }.
 */
export function verifyFileHash(
  filename: string,
  configDir: string = CONFIG_DIR,
): { valid: boolean; expected: string; computed: string } {
  const filePath = join(configDir, filename);
  const raw = readFileSync(filePath, 'utf-8');
  const config: Record<string, unknown> = JSON.parse(raw);

  const expected = config['hash'] as string;

  // Replace hash with empty string for computation
  const contentWithoutHash = raw.replace(
    new RegExp(`"hash"\\s*:\\s*"${expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g'),
    '"hash": ""',
  );
  const computed = computeHash(contentWithoutHash);

  return { valid: computed === expected, expected, computed };
}

export const CONFIG_FILES = [
  'party-registry.json',
  'axis-registry.json',
  'archetype-registry.json',
  'language-registry.json',
  'questions.json',
  'scoring-params.json',
] as const;
