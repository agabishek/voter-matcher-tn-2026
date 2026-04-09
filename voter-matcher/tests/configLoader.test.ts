import { describe, it, expect } from 'vitest';
import { ConfigLoader } from '@/lib/configLoader';
import { join } from 'path';

describe('ConfigLoader', () => {
  const configDir = join(process.cwd(), 'config');
  const loader = new ConfigLoader(configDir);

  describe('load', () => {
    it('should successfully load all config files with valid hashes', () => {
      // Config files now have computed hashes
      const config = loader.load();
      
      expect(config).toBeDefined();
      expect(config.parties).toBeDefined();
      expect(config.axes).toBeDefined();
      expect(config.archetypes).toBeDefined();
      expect(config.languages).toBeDefined();
      expect(config.questions).toBeDefined();
      expect(config.scoringParams).toBeDefined();
      expect(config.version).toBeDefined();
      expect(config.loadedAt).toBeDefined();
    });
  });

  describe('verify', () => {
    it('should return true when hashes match', () => {
      const hash = 'abc123';
      expect(loader.verify(hash, hash)).toBe(true);
    });

    it('should return false when hashes do not match', () => {
      expect(loader.verify('abc123', 'def456')).toBe(false);
    });
  });

  describe('getVersion', () => {
    it('should return a composite version string', () => {
      const version = loader.getVersion();
      expect(version).toContain('parties:');
      expect(version).toContain('axes:');
      expect(version).toContain('archetypes:');
      expect(version).toContain('languages:');
      expect(version).toContain('questions:');
      expect(version).toContain('scoring:');
    });

    it('should include version 1.0.0 for all current configs', () => {
      const version = loader.getVersion();
      expect(version).toContain('1.0.0');
    });
  });
});
