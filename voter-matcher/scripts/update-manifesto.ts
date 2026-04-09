/**
 * Update Manifesto CLI — accepts new manifesto JSON, recomputes Party_Weights,
 * updates questions.json, recomputes hashes, writes audit log entry.
 *
 * Usage:
 *   npx tsx scripts/update-manifesto.ts <partyId> <manifesto-json-path> [--operator <name>]
 *
 * The manifesto JSON file must contain an array of weight overrides:
 * [
 *   { "questionId": "q001", "optionId": "q001_a", "weight": 4 },
 *   ...
 * ]
 *
 * @module scripts/update-manifesto
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { recomputeFileHash } from './hash-utils';
import { appendAuditLog } from './audit-log';

interface WeightOverride {
  questionId: string;
  optionId: string;
  weight: number;
}

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

interface Party {
  id: string;
  names: Record<string, string>;
  fullNames: Record<string, string>;
  governanceStatus: string;
  weightBasis: string;
  manifestoVersion: string;
  active: boolean;
}

interface PartyRegistry {
  version: string;
  hash: string;
  parties: Party[];
}

function parseArgs(args: string[]): { partyId: string; manifestoPath: string; operator?: string } {
  const positional: string[] = [];
  let operator: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--operator' && i + 1 < args.length) {
      operator = args[i + 1];
      i++;
    } else {
      positional.push(args[i]);
    }
  }

  if (positional.length < 2) {
    console.error('Usage: npx tsx scripts/update-manifesto.ts <partyId> <manifesto-json-path> [--operator <name>]');
    process.exit(1);
  }

  return { partyId: positional[0], manifestoPath: positional[1], operator };
}

function main(): void {
  const { partyId, manifestoPath, operator } = parseArgs(process.argv.slice(2));
  const configDir = join(process.cwd(), 'config');

  // 1. Validate party exists
  const partyRegPath = join(configDir, 'party-registry.json');
  const partyReg: PartyRegistry = JSON.parse(readFileSync(partyRegPath, 'utf-8'));
  const party = partyReg.parties.find(p => p.id === partyId);
  if (!party) {
    console.error(`✗ Party "${partyId}" not found in party-registry.json`);
    console.error(`  Available parties: ${partyReg.parties.map(p => p.id).join(', ')}`);
    process.exit(1);
  }

  // 2. Read manifesto overrides
  const overrides: WeightOverride[] = JSON.parse(readFileSync(manifestoPath, 'utf-8'));
  if (!Array.isArray(overrides)) {
    console.error('✗ Manifesto file must contain a JSON array of weight overrides');
    process.exit(1);
  }

  // 3. Load questions.json
  const questionsPath = join(configDir, 'questions.json');
  const questionBank: QuestionBank = JSON.parse(readFileSync(questionsPath, 'utf-8'));
  const previousVersion = questionBank.version;
  const changedFields: string[] = [];

  // 4. Apply weight overrides
  for (const override of overrides) {
    const question = questionBank.questions.find(q => q.id === override.questionId);
    if (!question) {
      console.error(`✗ Question "${override.questionId}" not found in questions.json`);
      process.exit(1);
    }
    const option = question.options.find(o => o.id === override.optionId);
    if (!option) {
      console.error(`✗ Option "${override.optionId}" not found in question "${override.questionId}"`);
      process.exit(1);
    }

    const oldWeight = option.partyWeights[partyId];
    if (oldWeight !== override.weight) {
      option.partyWeights[partyId] = override.weight;
      changedFields.push(`${override.optionId}.partyWeights.${partyId}: ${oldWeight} → ${override.weight}`);
    }
  }

  if (changedFields.length === 0) {
    console.log('ℹ No weight changes detected. Nothing to update.');
    return;
  }

  // 5. Bump version
  const versionParts = previousVersion.split('.');
  versionParts[2] = String(Number(versionParts[2]) + 1);
  questionBank.version = versionParts.join('.');

  // 6. Write questions.json
  writeFileSync(questionsPath, JSON.stringify(questionBank, null, 2) + '\n', 'utf-8');

  // 7. Recompute hash
  const newHash = recomputeFileHash('questions.json', configDir);

  // 8. Update party's manifestoVersion in party-registry
  const oldManifesto = party.manifestoVersion;
  party.manifestoVersion = `${partyId.toLowerCase()}-2026-v${questionBank.version}`;
  writeFileSync(partyRegPath, JSON.stringify(partyReg, null, 2) + '\n', 'utf-8');
  recomputeFileHash('party-registry.json', configDir);

  // 9. Write audit log
  appendAuditLog({
    action: 'update-manifesto',
    previousVersion,
    newVersion: questionBank.version,
    changedFields: [
      `party: ${partyId}`,
      `manifestoVersion: ${oldManifesto} → ${party.manifestoVersion}`,
      ...changedFields,
    ],
    operator,
  });

  console.log(`✓ Updated ${changedFields.length} weight(s) for party "${partyId}"`);
  console.log(`  Version: ${previousVersion} → ${questionBank.version}`);
  console.log(`  Hash: ${newHash}`);
  console.log(`  Audit log entry written.`);
}

main();
