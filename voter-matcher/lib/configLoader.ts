/**
 * ConfigLoader - Configuration file loader with cryptographic hash verification
 * 
 * This module implements the Config Layer integrity verification system as specified
 * in Requirement 0 AC 10 of the design document.
 * 
 * Hash Verification Strategy:
 * - Each config file contains a "hash" field with a SHA256 hash
 * - The hash is computed over the entire file content EXCEPT the hash field itself
 * - During verification, the hash field value is replaced with an empty string before hashing
 * - This ensures the hash is self-verifying without circular dependency
 * 
 * Security Properties:
 * - Detects any tampering or corruption of config files
 * - Prevents deployment with PLACEHOLDER hashes (development-only)
 * - Provides cryptographic integrity guarantee for all configuration data
 * 
 * @module lib/configLoader
 */

import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';

// Type definitions for config files
export interface PartyRegistry {
  version: string;
  hash: string;
  parties: Array<{
    id: string;
    names: { en: string; ta: string };
    fullNames: { en: string; ta: string };
    governanceStatus: string;
    weightBasis: string;
    manifestoVersion: string;
    active: boolean;
  }>;
}

export interface AxisRegistry {
  version: string;
  hash: string;
  axes: Array<{
    id: string;
    labels: { en: string; ta: string };
    technicalName: { en: string; ta: string };
    archetypeMapping: string[];
    independentPairs: string[];
  }>;
}

export interface ArchetypeRegistry {
  version: string;
  hash: string;
  archetypes: Array<{
    id: string;
    names: { en: string; ta: string };
    dominantAxes: string[];
    ambiguityThreshold: number;
    descriptions: { en: string; ta: string };
  }>;
}

export interface LanguageRegistry {
  version: string;
  hash: string;
  defaultLanguage: string;
  languages: Array<{
    code: string;
    name: string;
    fontStack: string;
    minFontSize: number;
    direction: string;
    translationPath: string;
  }>;
}

export interface ScoringParams {
  version: string;
  hash: string;
  questionCount: number;
  optionsPerQuestion: number;
  weightRange: { min: number; max: number };
  minAnsweredThreshold: number;
  collinearityThreshold: number;
  discriminatingPowerThreshold: number;
  confidenceFormula: string;
  estimatedCompletionMinutes: number;
  performanceTargets: {
    loadTime4G: number;
    loadTime2G: number;
    scoringTime: number;
    concurrentUsers: number;
  };
  disclaimerText: { en: string; ta: string };
}

export interface QuestionBank {
  version: string;
  hash: string;
  questions: Array<{
    id: string;
    cluster: string;
    text: { en: string; ta: string };
    options: Array<{
      id: string;
      text: { en: string; ta: string };
      partyWeights: Record<string, number>;
      axisWeights: Record<string, number>;
    }>;
  }>;
}

export interface ConfigBundle {
  parties: PartyRegistry;
  axes: AxisRegistry;
  archetypes: ArchetypeRegistry;
  languages: LanguageRegistry;
  questions: QuestionBank;
  scoringParams: ScoringParams;
  version: string;
  loadedAt: string;
}

/**
 * ConfigLoader - Loads and verifies all configuration files
 * 
 * Responsibilities:
 * - Load all config files from the /config directory
 * - Compute SHA256 hash of each file's content (excluding the hash field)
 * - Verify computed hash matches the embedded hash field
 * - Throw descriptive errors on hash mismatch or file read failures
 */
export class ConfigLoader {
  private readonly configDir: string;

  constructor(configDir: string = join(process.cwd(), 'config')) {
    this.configDir = configDir;
  }

  /**
   * Load and verify all configuration files
   * @returns ConfigBundle containing all verified config data
   * @throws Error if any config file fails hash verification or cannot be loaded
   */
  load(): ConfigBundle {
    const parties = this.loadAndVerify<PartyRegistry>('party-registry.json');
    const axes = this.loadAndVerify<AxisRegistry>('axis-registry.json');
    const archetypes = this.loadAndVerify<ArchetypeRegistry>('archetype-registry.json');
    const languages = this.loadAndVerify<LanguageRegistry>('language-registry.json');
    const questions = this.loadAndVerify<QuestionBank>('questions.json');
    const scoringParams = this.loadAndVerify<ScoringParams>('scoring-params.json');

    // Compute composite version string from all config versions
    const version = this.getVersion();
    const loadedAt = new Date().toISOString();

    return {
      parties,
      axes,
      archetypes,
      languages,
      questions,
      scoringParams,
      version,
      loadedAt,
    };
  }

  /**
   * Load a config file and verify its hash
   * @param filename Name of the config file
   * @returns Parsed and verified config object
   * @throws Error if file cannot be read or hash verification fails
   */
  private loadAndVerify<T extends { version: string; hash: string }>(filename: string): T {
    const filePath = join(this.configDir, filename);
    
    try {
      // Read file content
      const fileContent = readFileSync(filePath, 'utf-8');
      
      // Parse JSON
      const config = JSON.parse(fileContent) as T;
      
      // Extract embedded hash
      const embeddedHash = config.hash;
      
      // Check if hash is placeholder
      if (embeddedHash === 'PLACEHOLDER') {
        throw new Error(
          `Config file ${filename} has PLACEHOLDER hash. ` +
          `Hash must be computed and embedded before deployment.`
        );
      }
      
      // Compute hash of file content (excluding the hash field)
      const computedHash = this.computeHash(fileContent, embeddedHash);
      
      // Verify hash matches
      if (!this.verify(computedHash, embeddedHash)) {
        throw new Error(
          `Hash verification failed for ${filename}. ` +
          `Expected: ${embeddedHash}, Computed: ${computedHash}. ` +
          `The file may have been tampered with or corrupted.`
        );
      }
      
      return config;
    } catch (error) {
      if (error instanceof Error) {
        // Re-throw with context if it's already an Error
        if (error.message.includes('Hash verification failed') || 
            error.message.includes('PLACEHOLDER')) {
          throw error;
        }
        throw new Error(`Failed to load config file ${filename}: ${error.message}`);
      }
      throw new Error(`Failed to load config file ${filename}: ${String(error)}`);
    }
  }

  /**
   * Compute SHA256 hash of file content, excluding the hash field itself
   * @param fileContent Raw file content as string
   * @param embeddedHash The hash value to exclude from computation
   * @returns Computed SHA256 hash as hex string
   */
  private computeHash(fileContent: string, embeddedHash: string): string {
    // Remove the hash field value from the content before hashing
    // This ensures we're hashing the content without the hash itself
    const contentWithoutHash = fileContent.replace(
      new RegExp(`"hash"\\s*:\\s*"${embeddedHash}"`, 'g'),
      '"hash": ""'
    );
    
    return createHash('sha256').update(contentWithoutHash, 'utf-8').digest('hex');
  }

  /**
   * Verify that computed hash matches embedded hash
   * @param computed Computed hash
   * @param embedded Embedded hash from config file
   * @returns true if hashes match, false otherwise
   */
  verify(computed: string, embedded: string): boolean {
    return computed === embedded;
  }

  /**
   * Get composite version string from all config files
   * @returns Composite version string
   */
  getVersion(): string {
    try {
      const parties = this.loadConfigVersion('party-registry.json');
      const axes = this.loadConfigVersion('axis-registry.json');
      const archetypes = this.loadConfigVersion('archetype-registry.json');
      const languages = this.loadConfigVersion('language-registry.json');
      const questions = this.loadConfigVersion('questions.json');
      const scoringParams = this.loadConfigVersion('scoring-params.json');
      
      return `parties:${parties}|axes:${axes}|archetypes:${archetypes}|languages:${languages}|questions:${questions}|scoring:${scoringParams}`;
    } catch {
      // If we can't load versions, return a fallback
      return 'unknown';
    }
  }

  /**
   * Load just the version field from a config file without full verification
   * @param filename Name of the config file
   * @returns Version string
   */
  private loadConfigVersion(filename: string): string {
    try {
      const filePath = join(this.configDir, filename);
      const fileContent = readFileSync(filePath, 'utf-8');
      const config = JSON.parse(fileContent) as { version: string };
      return config.version;
    } catch {
      return 'unknown';
    }
  }
}
