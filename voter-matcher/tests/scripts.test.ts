/**
 * Tests for CLI scripts: audit-log, hash-utils, and script logic
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'fs';
import { join } from 'path';
import { readAuditLog, appendAuditLog } from '../scripts/audit-log';
import { computeHash, recomputeFileHash, verifyFileHash } from '../scripts/hash-utils';

const TEST_DIR = join(process.cwd(), '__test_config__');
const TEST_LOG = join(TEST_DIR, 'audit-log.json');

function writeTestConfig(filename: string, data: Record<string, unknown>): void {
  writeFileSync(join(TEST_DIR, filename), JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

describe('audit-log', () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  it('returns empty array when no log file exists', () => {
    const entries = readAuditLog(join(TEST_DIR, 'nonexistent.json'));
    expect(entries).toEqual([]);
  });

  it('appends an entry and reads it back', () => {
    const entry = appendAuditLog(
      {
        action: 'test-action',
        previousVersion: '1.0.0',
        newVersion: '1.0.1',
        changedFields: ['field1'],
        operator: 'tester',
      },
      TEST_LOG,
    );

    expect(entry.timestamp).toBeTruthy();
    expect(entry.action).toBe('test-action');

    const entries = readAuditLog(TEST_LOG);
    expect(entries).toHaveLength(1);
    expect(entries[0].action).toBe('test-action');
    expect(entries[0].operator).toBe('tester');
  });

  it('appends multiple entries preserving order', () => {
    appendAuditLog(
      { action: 'first', previousVersion: '1.0.0', newVersion: '1.0.1', changedFields: [] },
      TEST_LOG,
    );
    appendAuditLog(
      { action: 'second', previousVersion: '1.0.1', newVersion: '1.0.2', changedFields: [] },
      TEST_LOG,
    );

    const entries = readAuditLog(TEST_LOG);
    expect(entries).toHaveLength(2);
    expect(entries[0].action).toBe('first');
    expect(entries[1].action).toBe('second');
  });
});

describe('hash-utils', () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  it('computeHash produces consistent results', () => {
    const content = '{"hash": "", "data": "test"}\n';
    const hash1 = computeHash(content);
    const hash2 = computeHash(content);
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA256 hex
  });

  it('recomputeFileHash updates the hash field correctly', () => {
    writeTestConfig('test.json', { version: '1.0.0', hash: 'old-hash', data: 'hello' });

    const newHash = recomputeFileHash('test.json', TEST_DIR);
    expect(newHash).toHaveLength(64);

    // Read back and verify
    const updated = JSON.parse(readFileSync(join(TEST_DIR, 'test.json'), 'utf-8'));
    expect(updated.hash).toBe(newHash);
  });

  it('verifyFileHash returns valid for correctly hashed file', () => {
    writeTestConfig('test.json', { version: '1.0.0', hash: '', data: 'hello' });
    recomputeFileHash('test.json', TEST_DIR);

    const result = verifyFileHash('test.json', TEST_DIR);
    expect(result.valid).toBe(true);
  });

  it('verifyFileHash returns invalid for tampered file', () => {
    writeTestConfig('test.json', { version: '1.0.0', hash: '', data: 'hello' });
    recomputeFileHash('test.json', TEST_DIR);

    // Tamper with the file
    const raw = readFileSync(join(TEST_DIR, 'test.json'), 'utf-8');
    const tampered = raw.replace('"hello"', '"tampered"');
    writeFileSync(join(TEST_DIR, 'test.json'), tampered, 'utf-8');

    const result = verifyFileHash('test.json', TEST_DIR);
    expect(result.valid).toBe(false);
  });
});
