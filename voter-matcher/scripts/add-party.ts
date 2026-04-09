/**
 * Add Party CLI — adds a party to Party_Registry, scaffolds Party_Weight
 * fields in all questions, and prompts operator to fill weights.
 *
 * Usage:
 *   npx tsx scripts/add-party.ts <partyId> <nameEn> <nameTa> <fullNameEn> <fullNameTa> [--operator <name>]
 *
 * Options:
 *   --governance <status>   incumbent | opposition | new (default: new)
 *   --weight-basis <basis>  track-record | promise (default: promise)
 *   --operator <name>       Operator name for audit log
 *
 * @module scripts/add-party
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { recomputeFileHash } from './hash-utils';
import { appendAuditLog } from './audit-log';

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

interface ParsedArgs {
  partyId: string;
  nameEn: string;
  nameTa: string;
  fullNameEn: string;
  fullNameTa: string;
  governance: string;
  weightBasis: string;
  operator?: string;
}

function parseArgs(args: string[]): ParsedArgs {
  const positional: string[] = [];
  let governance = 'new';
  let weightBasis = 'promise';
  let operator: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--governance' && i + 1 < args.length) {
      governance = args[i + 1];
      i++;
    } else if (args[i] === '--weight-basis' && i + 1 < args.length) {
      weightBasis = args[i + 1];
      i++;
    } else if (args[i] === '--operator' && i + 1 < args.length) {
      operator = args[i + 1];
      i++;
    } else {
      positional.push(args[i]);
    }
  }

  if (positional.length < 5) {
    console.error('Usage: npx tsx scripts/add-party.ts <partyId> <nameEn> <nameTa> <fullNameEn> <fullNameTa> [options]');
    console.error('Options:');
    console.error('  --governance <status>   incumbent | opposition | new (default: new)');
    console.error('  --weight-basis <basis>  track-record | promise (default: promise)');
    console.error('  --operator <name>       Operator name for audit log');
    process.exit(1);
  }

  return {
    partyId: positional[0],
    nameEn: positional[1],
    nameTa: positional[2],
    fullNameEn: positional[3],
    fullNameTa: positional[4],
    governance,
    weightBasis,
    operator,
  };
}

function main(): void {
  const parsed = parseArgs(process.argv.slice(2));
  const configDir = join(process.cwd(), 'config');

  // 1. Load party registry
  const partyRegPath = join(configDir, 'party-registry.json');
  const partyReg: PartyRegistry = JSON.parse(readFileSync(partyRegPath, 'utf-8'));
  const previousVersion = partyReg.version;

  // Check for duplicate
  if (partyReg.parties.some(p => p.id === parsed.partyId)) {
    console.error(`✗ Party "${parsed.partyId}" already exists in party-registry.json`);
    process.exit(1);
  }

  // 2. Add new party
  const newParty: Party = {
    id: parsed.partyId,
    names: { en: parsed.nameEn, ta: parsed.nameTa },
    fullNames: { en: parsed.fullNameEn, ta: parsed.fullNameTa },
    governanceStatus: parsed.governance,
    weightBasis: parsed.weightBasis,
    manifestoVersion: `${parsed.partyId.toLowerCase()}-2026-v1`,
    active: true,
  };
  partyReg.parties.push(newParty);

  // Bump version
  const vParts = previousVersion.split('.');
  vParts[1] = String(Number(vParts[1]) + 1);
  vParts[2] = '0';
  partyReg.version = vParts.join('.');

  writeFileSync(partyRegPath, JSON.stringify(partyReg, null, 2) + '\n', 'utf-8');
  recomputeFileHash('party-registry.json', configDir);

  // 3. Scaffold Party_Weight fields in questions.json
  const questionsPath = join(configDir, 'questions.json');
  const questionBank: QuestionBank = JSON.parse(readFileSync(questionsPath, 'utf-8'));
  const prevQVersion = questionBank.version;
  let scaffoldedCount = 0;

  for (const question of questionBank.questions) {
    for (const option of question.options) {
      if (!(parsed.partyId in option.partyWeights)) {
        // Default weight of 0 — operator must fill in real values
        option.partyWeights[parsed.partyId] = 0;
        scaffoldedCount++;
      }
    }
  }

  // Bump questions version
  const qParts = prevQVersion.split('.');
  qParts[1] = String(Number(qParts[1]) + 1);
  qParts[2] = '0';
  questionBank.version = qParts.join('.');

  writeFileSync(questionsPath, JSON.stringify(questionBank, null, 2) + '\n', 'utf-8');
  recomputeFileHash('questions.json', configDir);

  // 4. Write audit log
  appendAuditLog({
    action: 'add-party',
    previousVersion,
    newVersion: partyReg.version,
    changedFields: [
      `party-registry: added ${parsed.partyId}`,
      `questions: scaffolded ${scaffoldedCount} weight fields with default 0`,
    ],
    operator: parsed.operator,
  });

  console.log(`✓ Added party "${parsed.partyId}" to party-registry.json`);
  console.log(`  Party Registry version: ${previousVersion} → ${partyReg.version}`);
  console.log(`  Questions version: ${prevQVersion} → ${questionBank.version}`);
  console.log(`  Scaffolded ${scaffoldedCount} Party_Weight fields (default: 0)`);
  console.log('');
  console.log('⚠ ACTION REQUIRED: Fill in real Party_Weight values for all questions.');
  console.log('  All weights are currently set to 0. Run validate-config.ts after updating.');
}

main();
