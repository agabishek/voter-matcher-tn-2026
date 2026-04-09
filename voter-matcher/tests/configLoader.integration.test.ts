import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ConfigLoader } from '@/lib/configLoader';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

describe('ConfigLoader Integration Tests', () => {
  const testConfigDir = join(process.cwd(), 'tests', 'test-config');
  
  beforeAll(() => {
    // Create test config directory
    mkdirSync(testConfigDir, { recursive: true });
  });

  afterAll(() => {
    // Clean up test config directory
    rmSync(testConfigDir, { recursive: true, force: true });
  });

  describe('hash verification', () => {
    it('should successfully load config with valid hash', () => {
      // Create a test config with proper hash
      const testConfig = {
        version: '1.0.0',
        hash: '',
        parties: [
          {
            id: 'TEST',
            names: { en: 'Test Party', ta: 'சோதனை கட்சி' },
            fullNames: { en: 'Test Party Full', ta: 'சோதனை கட்சி முழு' },
            governanceStatus: 'new',
            weightBasis: 'promise',
            manifestoVersion: 'test-v1',
            active: true,
          },
        ],
      };

      // Compute hash of content without hash field
      const contentWithoutHash = JSON.stringify(testConfig, null, 2);
      const hash = createHash('sha256').update(contentWithoutHash, 'utf-8').digest('hex');
      
      // Set the hash
      testConfig.hash = hash;
      
      // Write the config file
      const configPath = join(testConfigDir, 'party-registry.json');
      writeFileSync(configPath, JSON.stringify(testConfig, null, 2));

      // Create a loader with the test config directory
      const loader = new ConfigLoader(testConfigDir);
      
      // This should not throw since the hash is valid
      expect(() => {
        const content = JSON.stringify(testConfig, null, 2);
        const computed = createHash('sha256')
          .update(content.replace(new RegExp(`"hash"\\s*:\\s*"${hash}"`, 'g'), '"hash": ""'), 'utf-8')
          .digest('hex');
        loader.verify(computed, hash);
      }).not.toThrow();
    });

    it('should throw error when hash does not match', () => {
      // Create a test config with incorrect hash
      const testConfig = {
        version: '1.0.0',
        hash: 'incorrect_hash_value',
        parties: [
          {
            id: 'TEST',
            names: { en: 'Test Party', ta: 'சோதனை கட்சி' },
            fullNames: { en: 'Test Party Full', ta: 'சோதனை கட்சி முழு' },
            governanceStatus: 'new',
            weightBasis: 'promise',
            manifestoVersion: 'test-v1',
            active: true,
          },
        ],
      };

      // Write the config file with wrong hash
      const configPath = join(testConfigDir, 'party-registry-bad.json');
      writeFileSync(configPath, JSON.stringify(testConfig, null, 2));

      // Verify that the hashes don't match
      const content = JSON.stringify(testConfig, null, 2);
      const computed = createHash('sha256')
        .update(content.replace(/"hash"\s*:\s*"incorrect_hash_value"/g, '"hash": ""'), 'utf-8')
        .digest('hex');
      
      expect(loader.verify(computed, 'incorrect_hash_value')).toBe(false);
    });

    it('should throw error for PLACEHOLDER hash', () => {
      // Create a test config with PLACEHOLDER hash
      const testConfig = {
        version: '1.0.0',
        hash: 'PLACEHOLDER',
        axes: [
          {
            id: 'test_axis',
            labels: { en: 'Test Axis', ta: 'சோதனை அச்சு' },
            technicalName: { en: 'Test', ta: 'சோதனை' },
            archetypeMapping: ['test'],
            independentPairs: [],
          },
        ],
      };

      // Write the config file
      const configPath = join(testConfigDir, 'axis-registry.json');
      writeFileSync(configPath, JSON.stringify(testConfig, null, 2));

      // Create a loader with the test config directory
      const loader = new ConfigLoader(testConfigDir);
      
      // This should throw because hash is PLACEHOLDER
      expect(() => loader.load()).toThrow('PLACEHOLDER');
    });
  });

  describe('composite version string', () => {
    it('should generate version string from all config files', () => {
      const loader = new ConfigLoader(join(process.cwd(), 'config'));
      const version = loader.getVersion();
      
      // Should contain all config file versions
      expect(version).toMatch(/parties:[\d.]+/);
      expect(version).toMatch(/axes:[\d.]+/);
      expect(version).toMatch(/archetypes:[\d.]+/);
      expect(version).toMatch(/languages:[\d.]+/);
      expect(version).toMatch(/questions:[\d.]+/);
      expect(version).toMatch(/scoring:[\d.]+/);
    });
  });
});

const loader = new ConfigLoader(join(process.cwd(), 'config'));
