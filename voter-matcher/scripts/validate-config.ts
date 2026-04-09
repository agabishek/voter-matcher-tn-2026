/**
 * Validate Config CLI — runs all validation checks and reports results.
 *
 * Checks:
 *   1. Hash integrity for all config files
 *   2. Collinearity between axis pairs
 *   3. Discriminating power per axis
 *   4. Language completeness across all translation files
 *
 * Usage: npx tsx scripts/validate-config.ts
 *
 * @module scripts/validate-config
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { verifyFileHash, CONFIG_FILES } from './hash-utils';

interface QuestionOption {
  id: string;
  text: Record<string, string>;
  partyWeights: Record<string, number>;
  axisWeights: Record<string, number>;
}

interface Question {
  id: string;
  cluster: string;
  text: Record<string, string>;
  options: QuestionOption[];
}

interface QuestionBank {
  version: string;
  hash: string;
  questions: Question[];
}

interface AxisEntry {
  id: string;
  labels: Record<string, string>;
  technicalName: Record<string, string>;
  archetypeMapping: string[];
  independentPairs: string[];
}

interface AxisRegistry {
  version: string;
  hash: string;
  axes: AxisEntry[];
}

interface Party {
  id: string;
  active: boolean;
}

interface PartyRegistry {
  version: string;
  hash: string;
  parties: Party[];
}

interface ScoringParams {
  version: string;
  hash: string;
  collinearityThreshold: number;
  discriminatingPowerThreshold: number;
  weightRange: { min: number; max: number };
}

interface LanguageEntry {
  code: string;
  name: string;
}

interface LanguageRegistry {
  version: string;
  hash: string;
  defaultLanguage: string;
  languages: LanguageEntry[];
}

interface CheckResult {
  name: string;
  passed: boolean;
  details: string[];
}

const configDir = join(process.cwd(), 'config');
const localesDir = join(process.cwd(), 'locales');

// ─── Check 1: Hash Integrity ───

function checkHashIntegrity(): CheckResult {
  const details: string[] = [];
  let allPassed = true;

  for (const file of CONFIG_FILES) {
    try {
      const result = verifyFileHash(file, configDir);
      if (result.valid) {
        details.push(`  ✓ ${file}`);
      } else {
        details.push(`  ✗ ${file} — expected ${result.expected}, computed ${result.computed}`);
        allPassed = false;
      }
    } catch (err) {
      details.push(`  ✗ ${file} — ${err instanceof Error ? err.message : String(err)}`);
      allPassed = false;
    }
  }

  return { name: 'Hash Integrity', passed: allPassed, details };
}

// ─── Check 2: Collinearity ───

function pearsonCorrelation(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n === 0) return 0;

  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  const denom = Math.sqrt(denomX * denomY);
  if (denom === 0) return 0;
  return num / denom;
}

function checkCollinearity(): CheckResult {
  const details: string[] = [];
  let allPassed = true;

  const questions: QuestionBank = JSON.parse(readFileSync(join(configDir, 'questions.json'), 'utf-8'));
  const axes: AxisRegistry = JSON.parse(readFileSync(join(configDir, 'axis-registry.json'), 'utf-8'));
  const params: ScoringParams = JSON.parse(readFileSync(join(configDir, 'scoring-params.json'), 'utf-8'));

  const axisIds = axes.axes.map(a => a.id);

  // Build axis weight vectors: for each option, collect the axis weight (0 if absent)
  const axisVectors: Record<string, number[]> = {};
  for (const id of axisIds) {
    axisVectors[id] = [];
  }

  for (const q of questions.questions) {
    for (const opt of q.options) {
      for (const id of axisIds) {
        axisVectors[id].push(opt.axisWeights[id] ?? 0);
      }
    }
  }

  // Check all axis pairs
  for (let i = 0; i < axisIds.length; i++) {
    for (let j = i + 1; j < axisIds.length; j++) {
      const a = axisIds[i];
      const b = axisIds[j];
      const corr = pearsonCorrelation(axisVectors[a], axisVectors[b]);
      const absCorr = Math.abs(corr);

      if (absCorr >= params.collinearityThreshold) {
        details.push(`  ✗ ${a} ↔ ${b}: r=${corr.toFixed(3)} (threshold: ${params.collinearityThreshold})`);
        allPassed = false;
      } else {
        details.push(`  ✓ ${a} ↔ ${b}: r=${corr.toFixed(3)}`);
      }
    }
  }

  return { name: 'Collinearity', passed: allPassed, details };
}

// ─── Check 3: Discriminating Power ───

function checkDiscriminatingPower(): CheckResult {
  const details: string[] = [];
  let allPassed = true;

  const questions: QuestionBank = JSON.parse(readFileSync(join(configDir, 'questions.json'), 'utf-8'));
  const axes: AxisRegistry = JSON.parse(readFileSync(join(configDir, 'axis-registry.json'), 'utf-8'));
  const parties: PartyRegistry = JSON.parse(readFileSync(join(configDir, 'party-registry.json'), 'utf-8'));
  const params: ScoringParams = JSON.parse(readFileSync(join(configDir, 'scoring-params.json'), 'utf-8'));

  const activePartyIds = parties.parties.filter(p => p.active).map(p => p.id);
  const axisIds = axes.axes.map(a => a.id);

  // For each axis, collect all party weights from options that contribute to that axis
  for (const axisId of axisIds) {
    // Collect party weight vectors for options on this axis
    const partyWeightSums: Record<string, number[]> = {};
    for (const pid of activePartyIds) {
      partyWeightSums[pid] = [];
    }

    for (const q of questions.questions) {
      for (const opt of q.options) {
        const axisWeight = opt.axisWeights[axisId];
        if (axisWeight !== undefined && axisWeight > 0) {
          for (const pid of activePartyIds) {
            partyWeightSums[pid].push(opt.partyWeights[pid] ?? 0);
          }
        }
      }
    }

    // Compute variance of mean party weights across parties
    const means = activePartyIds.map(pid => {
      const vals = partyWeightSums[pid];
      if (vals.length === 0) return 0;
      return vals.reduce((a, b) => a + b, 0) / vals.length;
    });

    const overallMean = means.reduce((a, b) => a + b, 0) / means.length;
    const variance = means.reduce((sum, m) => sum + (m - overallMean) ** 2, 0) / means.length;

    if (variance < params.discriminatingPowerThreshold) {
      details.push(`  ✗ ${axisId}: variance=${variance.toFixed(3)} (threshold: ${params.discriminatingPowerThreshold})`);
      allPassed = false;
    } else {
      details.push(`  ✓ ${axisId}: variance=${variance.toFixed(3)}`);
    }
  }

  return { name: 'Discriminating Power', passed: allPassed, details };
}

// ─── Check 4: Language Completeness ───

function checkLanguageCompleteness(): CheckResult {
  const details: string[] = [];
  let allPassed = true;

  const langReg: LanguageRegistry = JSON.parse(readFileSync(join(configDir, 'language-registry.json'), 'utf-8'));
  const langCodes = langReg.languages.map(l => l.code);
  const translationFiles = ['common.json', 'questionnaire.json', 'result.json', 'explanation.json'];

  for (const file of translationFiles) {
    // Collect all keys across all languages for this file
    const keysByLang: Record<string, Set<string>> = {};
    const allKeys = new Set<string>();

    for (const code of langCodes) {
      const filePath = join(localesDir, code, file);
      if (!existsSync(filePath)) {
        details.push(`  ✗ Missing file: locales/${code}/${file}`);
        allPassed = false;
        keysByLang[code] = new Set();
        continue;
      }

      const content: Record<string, string> = JSON.parse(readFileSync(filePath, 'utf-8'));
      const keys = new Set(Object.keys(content));
      keysByLang[code] = keys;
      for (const k of keys) {
        allKeys.add(k);
      }
    }

    // Check each language has all keys
    for (const code of langCodes) {
      const missing = [...allKeys].filter(k => !keysByLang[code]?.has(k));
      if (missing.length > 0) {
        details.push(`  ✗ locales/${code}/${file}: missing ${missing.length} key(s): ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '...' : ''}`);
        allPassed = false;
      }
    }

    // Check for untranslated markers
    for (const code of langCodes) {
      const filePath = join(localesDir, code, file);
      if (!existsSync(filePath)) continue;
      const content: Record<string, string> = JSON.parse(readFileSync(filePath, 'utf-8'));
      const untranslated = Object.entries(content)
        .filter(([, v]) => v.startsWith('[UNTRANSLATED]'))
        .map(([k]) => k);
      if (untranslated.length > 0) {
        details.push(`  ⚠ locales/${code}/${file}: ${untranslated.length} untranslated key(s)`);
        allPassed = false;
      }
    }

    if (allPassed) {
      details.push(`  ✓ ${file}: all languages complete`);
    }
  }

  return { name: 'Language Completeness', passed: allPassed, details };
}

// ─── Main ───

function main(): void {
  console.log('🔍 Validating configuration...\n');

  const checks: CheckResult[] = [
    checkHashIntegrity(),
    checkCollinearity(),
    checkDiscriminatingPower(),
    checkLanguageCompleteness(),
  ];

  let allPassed = true;

  for (const check of checks) {
    const icon = check.passed ? '✅' : '❌';
    console.log(`${icon} ${check.name}`);
    for (const line of check.details) {
      console.log(line);
    }
    console.log('');
    if (!check.passed) allPassed = false;
  }

  if (allPassed) {
    console.log('✅ All validation checks passed!');
  } else {
    console.log('❌ Some validation checks failed. See details above.');
    process.exit(1);
  }
}

main();
