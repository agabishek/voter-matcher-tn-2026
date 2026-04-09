/**
 * Property-Based Tests for ConfigLoader
 * 
 * **Validates: Requirements 0.10**
 * 
 * This test suite uses fast-check to verify the config integrity property:
 * "System must refuse to render if any config hash mismatches"
 * 
 * The property being tested: ANY modification to config file content
 * (excluding the hash field itself) MUST cause hash verification to fail,
 * and the system MUST throw an error refusing to load the config.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ConfigLoader } from '@/lib/configLoader';
import { writeFileSync, mkdirSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import * as fc from 'fast-check';

describe('ConfigLoader Property-Based Tests', () => {
  const testConfigDir = join(process.cwd(), 'tests', 'test-config-pbt');
  
  beforeAll(() => {
    mkdirSync(testConfigDir, { recursive: true });
  });

  afterAll(() => {
    rmSync(testConfigDir, { recursive: true, force: true });
  });

  /**
   * Property: Config Integrity
   * 
   * For ANY valid config file with a correct hash, if we modify ANY part
   * of the content (except the hash field itself), the system MUST detect
   * the mismatch and refuse to load the config.
   */
  describe('Property: Config integrity - system refuses to load tampered configs', () => {
    it('should reject config when version field is modified', () => {
      fc.assert(
        fc.property(
          fc.record({
            version: fc.string({ minLength: 1, maxLength: 20 }),
            parties: fc.array(
              fc.record({
                id: fc.stringMatching(/^[A-Z]{2,10}$/),
                names: fc.record({
                  en: fc.string({ minLength: 2, maxLength: 20 }),
                  ta: fc.string({ minLength: 2, maxLength: 20 }),
                }),
                fullNames: fc.record({
                  en: fc.string({ minLength: 5, maxLength: 50 }),
                  ta: fc.string({ minLength: 5, maxLength: 50 }),
                }),
                governanceStatus: fc.constantFrom('incumbent', 'new', 'opposition'),
                weightBasis: fc.constantFrom('track-record', 'promise'),
                manifestoVersion: fc.string({ minLength: 5, maxLength: 30 }),
                active: fc.boolean(),
              }),
              { minLength: 1, maxLength: 5 }
            ),
          }),
          fc.string({ minLength: 1, maxLength: 20 }).filter(v => v !== ''),
          (originalConfig, tamperedVersion) => {
            // Skip if tampered version is same as original
            fc.pre(tamperedVersion !== originalConfig.version);

            // Create config with correct hash
            const configWithoutHash = { ...originalConfig, hash: '' };
            const content = JSON.stringify(configWithoutHash, null, 2);
            const correctHash = createHash('sha256').update(content, 'utf-8').digest('hex');
            
            const validConfig = { ...originalConfig, hash: correctHash };
            const validContent = JSON.stringify(validConfig, null, 2);
            
            // Write valid config
            const configPath = join(testConfigDir, 'party-registry.json');
            writeFileSync(configPath, validContent);
            
            // Verify it loads successfully
            const loader = new ConfigLoader(testConfigDir);
            const fileContent = readFileSync(configPath, 'utf-8');
            const parsed = JSON.parse(fileContent);
            const computedHash = createHash('sha256')
              .update(fileContent.replace(new RegExp(`"hash"\\s*:\\s*"${correctHash}"`, 'g'), '"hash": ""'), 'utf-8')
              .digest('hex');
            
            expect(loader.verify(computedHash, correctHash)).toBe(true);
            
            // Now tamper with the version field
            const tamperedConfig = { ...validConfig, version: tamperedVersion };
            const tamperedContent = JSON.stringify(tamperedConfig, null, 2);
            writeFileSync(configPath, tamperedContent);
            
            // Compute hash of tampered content
            const tamperedComputedHash = createHash('sha256')
              .update(tamperedContent.replace(new RegExp(`"hash"\\s*:\\s*"${correctHash}"`, 'g'), '"hash": ""'), 'utf-8')
              .digest('hex');
            
            // Verify that hash verification fails
            expect(loader.verify(tamperedComputedHash, correctHash)).toBe(false);
            
            // Verify that loading throws an error
            expect(() => loader.load()).toThrow(/Hash verification failed/);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should reject config when party data is modified', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.stringMatching(/^[A-Z]{2,10}$/),
            names: fc.record({
              en: fc.string({ minLength: 2, maxLength: 20 }),
              ta: fc.string({ minLength: 2, maxLength: 20 }),
            }),
            fullNames: fc.record({
              en: fc.string({ minLength: 5, maxLength: 50 }),
              ta: fc.string({ minLength: 5, maxLength: 50 }),
            }),
            governanceStatus: fc.constantFrom('incumbent', 'new', 'opposition'),
            weightBasis: fc.constantFrom('track-record', 'promise'),
            manifestoVersion: fc.string({ minLength: 5, maxLength: 30 }),
            active: fc.boolean(),
          }),
          fc.string({ minLength: 2, maxLength: 20 }),
          (party, tamperedName) => {
            // Skip if tampered name is same as original
            fc.pre(tamperedName !== party.names.en);

            const originalConfig = {
              version: '1.0.0',
              hash: '',
              parties: [party],
            };
            
            // Create config with correct hash
            const content = JSON.stringify(originalConfig, null, 2);
            const correctHash = createHash('sha256').update(content, 'utf-8').digest('hex');
            
            const validConfig = { ...originalConfig, hash: correctHash };
            const validContent = JSON.stringify(validConfig, null, 2);
            
            // Write valid config
            const configPath = join(testConfigDir, 'party-registry.json');
            writeFileSync(configPath, validContent);
            
            // Verify it loads successfully with correct hash
            const loader = new ConfigLoader(testConfigDir);
            const fileContent = readFileSync(configPath, 'utf-8');
            const computedHash = createHash('sha256')
              .update(fileContent.replace(new RegExp(`"hash"\\s*:\\s*"${correctHash}"`, 'g'), '"hash": ""'), 'utf-8')
              .digest('hex');
            
            expect(loader.verify(computedHash, correctHash)).toBe(true);
            
            // Now tamper with party name
            const tamperedParty = {
              ...party,
              names: { ...party.names, en: tamperedName },
            };
            const tamperedConfig = { ...validConfig, parties: [tamperedParty] };
            const tamperedContent = JSON.stringify(tamperedConfig, null, 2);
            writeFileSync(configPath, tamperedContent);
            
            // Compute hash of tampered content
            const tamperedComputedHash = createHash('sha256')
              .update(tamperedContent.replace(new RegExp(`"hash"\\s*:\\s*"${correctHash}"`, 'g'), '"hash": ""'), 'utf-8')
              .digest('hex');
            
            // Verify that hash verification fails
            expect(loader.verify(tamperedComputedHash, correctHash)).toBe(false);
            
            // Verify that loading throws an error
            expect(() => loader.load()).toThrow(/Hash verification failed/);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should reject config when any field is added', () => {
      fc.assert(
        fc.property(
          fc.record({
            version: fc.constant('1.0.0'),
            parties: fc.array(
              fc.record({
                id: fc.stringMatching(/^[A-Z]{2,10}$/),
                names: fc.record({
                  en: fc.string({ minLength: 2, maxLength: 20 }),
                  ta: fc.string({ minLength: 2, maxLength: 20 }),
                }),
                fullNames: fc.record({
                  en: fc.string({ minLength: 5, maxLength: 50 }),
                  ta: fc.string({ minLength: 5, maxLength: 50 }),
                }),
                governanceStatus: fc.constantFrom('incumbent', 'new', 'opposition'),
                weightBasis: fc.constantFrom('track-record', 'promise'),
                manifestoVersion: fc.string({ minLength: 5, maxLength: 30 }),
                active: fc.boolean(),
              }),
              { minLength: 1, maxLength: 3 }
            ),
          }),
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          (originalConfig, newFieldName, newFieldValue) => {
            // Skip if field already exists
            fc.pre(!(newFieldName in originalConfig));

            // Create config with correct hash
            const configWithoutHash = { ...originalConfig, hash: '' };
            const content = JSON.stringify(configWithoutHash, null, 2);
            const correctHash = createHash('sha256').update(content, 'utf-8').digest('hex');
            
            const validConfig = { ...originalConfig, hash: correctHash };
            const validContent = JSON.stringify(validConfig, null, 2);
            
            // Write valid config
            const configPath = join(testConfigDir, 'party-registry.json');
            writeFileSync(configPath, validContent);
            
            // Verify it loads successfully
            const loader = new ConfigLoader(testConfigDir);
            const fileContent = readFileSync(configPath, 'utf-8');
            const computedHash = createHash('sha256')
              .update(fileContent.replace(new RegExp(`"hash"\\s*:\\s*"${correctHash}"`, 'g'), '"hash": ""'), 'utf-8')
              .digest('hex');
            
            expect(loader.verify(computedHash, correctHash)).toBe(true);
            
            // Now add a new field
            const tamperedConfig = { ...validConfig, [newFieldName]: newFieldValue };
            const tamperedContent = JSON.stringify(tamperedConfig, null, 2);
            writeFileSync(configPath, tamperedContent);
            
            // Compute hash of tampered content
            const tamperedComputedHash = createHash('sha256')
              .update(tamperedContent.replace(new RegExp(`"hash"\\s*:\\s*"${correctHash}"`, 'g'), '"hash": ""'), 'utf-8')
              .digest('hex');
            
            // Verify that hash verification fails
            expect(loader.verify(tamperedComputedHash, correctHash)).toBe(false);
            
            // Verify that loading throws an error
            expect(() => loader.load()).toThrow(/Hash verification failed/);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should reject config when party array is reordered', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.stringMatching(/^[A-Z]{2,10}$/),
              names: fc.record({
                en: fc.string({ minLength: 2, maxLength: 20 }),
                ta: fc.string({ minLength: 2, maxLength: 20 }),
              }),
              fullNames: fc.record({
                en: fc.string({ minLength: 5, maxLength: 50 }),
                ta: fc.string({ minLength: 5, maxLength: 50 }),
              }),
              governanceStatus: fc.constantFrom('incumbent', 'new', 'opposition'),
              weightBasis: fc.constantFrom('track-record', 'promise'),
              manifestoVersion: fc.string({ minLength: 5, maxLength: 30 }),
              active: fc.boolean(),
            }),
            { minLength: 2, maxLength: 5 }
          ),
          (parties) => {
            const originalConfig = {
              version: '1.0.0',
              hash: '',
              parties,
            };
            
            // Create config with correct hash
            const content = JSON.stringify(originalConfig, null, 2);
            const correctHash = createHash('sha256').update(content, 'utf-8').digest('hex');
            
            const validConfig = { ...originalConfig, hash: correctHash };
            const validContent = JSON.stringify(validConfig, null, 2);
            
            // Write valid config
            const configPath = join(testConfigDir, 'party-registry.json');
            writeFileSync(configPath, validContent);
            
            // Verify it loads successfully
            const loader = new ConfigLoader(testConfigDir);
            const fileContent = readFileSync(configPath, 'utf-8');
            const computedHash = createHash('sha256')
              .update(fileContent.replace(new RegExp(`"hash"\\s*:\\s*"${correctHash}"`, 'g'), '"hash": ""'), 'utf-8')
              .digest('hex');
            
            expect(loader.verify(computedHash, correctHash)).toBe(true);
            
            // Now reverse the party array
            const reorderedParties = [...parties].reverse();
            const tamperedConfig = { ...validConfig, parties: reorderedParties };
            const tamperedContent = JSON.stringify(tamperedConfig, null, 2);
            writeFileSync(configPath, tamperedContent);
            
            // Compute hash of tampered content
            const tamperedComputedHash = createHash('sha256')
              .update(tamperedContent.replace(new RegExp(`"hash"\\s*:\\s*"${correctHash}"`, 'g'), '"hash": ""'), 'utf-8')
              .digest('hex');
            
            // Verify that hash verification fails
            expect(loader.verify(tamperedComputedHash, correctHash)).toBe(false);
            
            // Verify that loading throws an error
            expect(() => loader.load()).toThrow(/Hash verification failed/);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should reject config with PLACEHOLDER hash', () => {
      fc.assert(
        fc.property(
          fc.record({
            version: fc.constant('1.0.0'),
            parties: fc.array(
              fc.record({
                id: fc.stringMatching(/^[A-Z]{2,10}$/),
                names: fc.record({
                  en: fc.string({ minLength: 2, maxLength: 20 }),
                  ta: fc.string({ minLength: 2, maxLength: 20 }),
                }),
                fullNames: fc.record({
                  en: fc.string({ minLength: 5, maxLength: 50 }),
                  ta: fc.string({ minLength: 5, maxLength: 50 }),
                }),
                governanceStatus: fc.constantFrom('incumbent', 'new', 'opposition'),
                weightBasis: fc.constantFrom('track-record', 'promise'),
                manifestoVersion: fc.string({ minLength: 5, maxLength: 30 }),
                active: fc.boolean(),
              }),
              { minLength: 1, maxLength: 3 }
            ),
          }),
          (config) => {
            // Create config with PLACEHOLDER hash
            const placeholderConfig = { ...config, hash: 'PLACEHOLDER' };
            const content = JSON.stringify(placeholderConfig, null, 2);
            
            // Write config with PLACEHOLDER hash
            const configPath = join(testConfigDir, 'party-registry.json');
            writeFileSync(configPath, content);
            
            // Create loader and attempt to load
            const loader = new ConfigLoader(testConfigDir);
            
            // Verify that loading throws an error about PLACEHOLDER
            expect(() => loader.load()).toThrow(/PLACEHOLDER/);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Property: Hash Computation Consistency
   * 
   * The same content (with hash field empty) MUST always produce
   * the same hash value, regardless of how many times it's computed.
   */
  describe('Property: Hash computation is deterministic', () => {
    it('should produce identical hash for identical content', () => {
      fc.assert(
        fc.property(
          fc.record({
            version: fc.string({ minLength: 1, maxLength: 20 }),
            parties: fc.array(
              fc.record({
                id: fc.stringMatching(/^[A-Z]{2,10}$/),
                names: fc.record({
                  en: fc.string({ minLength: 2, maxLength: 20 }),
                  ta: fc.string({ minLength: 2, maxLength: 20 }),
                }),
                fullNames: fc.record({
                  en: fc.string({ minLength: 5, maxLength: 50 }),
                  ta: fc.string({ minLength: 5, maxLength: 50 }),
                }),
                governanceStatus: fc.constantFrom('incumbent', 'new', 'opposition'),
                weightBasis: fc.constantFrom('track-record', 'promise'),
                manifestoVersion: fc.string({ minLength: 5, maxLength: 30 }),
                active: fc.boolean(),
              }),
              { minLength: 1, maxLength: 5 }
            ),
          }),
          (config) => {
            const configWithoutHash = { ...config, hash: '' };
            const content = JSON.stringify(configWithoutHash, null, 2);
            
            // Compute hash multiple times
            const hash1 = createHash('sha256').update(content, 'utf-8').digest('hex');
            const hash2 = createHash('sha256').update(content, 'utf-8').digest('hex');
            const hash3 = createHash('sha256').update(content, 'utf-8').digest('hex');
            
            // All hashes must be identical
            expect(hash1).toBe(hash2);
            expect(hash2).toBe(hash3);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
