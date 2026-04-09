/**
 * Add Language CLI — adds a language to Language_Registry, scaffolds
 * translation files with all existing keys, marks untranslated strings.
 *
 * Usage:
 *   npx tsx scripts/add-language.ts <code> <name> [options]
 *
 * Options:
 *   --font-stack <fonts>    Font stack (default: 'Noto Sans, sans-serif')
 *   --min-font-size <px>    Minimum font size (default: 14)
 *   --direction <dir>       Text direction ltr|rtl (default: ltr)
 *   --operator <name>       Operator name for audit log
 *
 * Example:
 *   npx tsx scripts/add-language.ts hi हिन्दी --font-stack "'Noto Sans Devanagari', sans-serif"
 *
 * @module scripts/add-language
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { recomputeFileHash } from './hash-utils';
import { appendAuditLog } from './audit-log';

interface Language {
  code: string;
  name: string;
  fontStack: string;
  minFontSize: number;
  direction: string;
  translationPath: string;
}

interface LanguageRegistry {
  version: string;
  hash: string;
  defaultLanguage: string;
  languages: Language[];
}

interface ParsedArgs {
  code: string;
  name: string;
  fontStack: string;
  minFontSize: number;
  direction: string;
  operator?: string;
}

function parseArgs(args: string[]): ParsedArgs {
  const positional: string[] = [];
  let fontStack = "'Noto Sans', sans-serif";
  let minFontSize = 14;
  let direction = 'ltr';
  let operator: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--font-stack' && i + 1 < args.length) {
      fontStack = args[i + 1];
      i++;
    } else if (args[i] === '--min-font-size' && i + 1 < args.length) {
      minFontSize = Number(args[i + 1]);
      i++;
    } else if (args[i] === '--direction' && i + 1 < args.length) {
      direction = args[i + 1];
      i++;
    } else if (args[i] === '--operator' && i + 1 < args.length) {
      operator = args[i + 1];
      i++;
    } else {
      positional.push(args[i]);
    }
  }

  if (positional.length < 2) {
    console.error('Usage: npx tsx scripts/add-language.ts <code> <name> [options]');
    console.error('Options:');
    console.error("  --font-stack <fonts>    Font stack (default: 'Noto Sans, sans-serif')");
    console.error('  --min-font-size <px>    Minimum font size (default: 14)');
    console.error('  --direction <dir>       Text direction ltr|rtl (default: ltr)');
    console.error('  --operator <name>       Operator name for audit log');
    process.exit(1);
  }

  return {
    code: positional[0],
    name: positional[1],
    fontStack,
    minFontSize,
    direction,
    operator,
  };
}

const UNTRANSLATED_PREFIX = '[UNTRANSLATED] ';

/**
 * Read all keys from a JSON translation file and return them as a flat object.
 */
function readTranslationKeys(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) {
    return {};
  }
  return JSON.parse(readFileSync(filePath, 'utf-8')) as Record<string, string>;
}

function main(): void {
  const parsed = parseArgs(process.argv.slice(2));
  const configDir = join(process.cwd(), 'config');
  const localesDir = join(process.cwd(), 'locales');

  // 1. Load language registry
  const langRegPath = join(configDir, 'language-registry.json');
  const langReg: LanguageRegistry = JSON.parse(readFileSync(langRegPath, 'utf-8'));
  const previousVersion = langReg.version;

  // Check for duplicate
  if (langReg.languages.some(l => l.code === parsed.code)) {
    console.error(`✗ Language "${parsed.code}" already exists in language-registry.json`);
    process.exit(1);
  }

  // 2. Add new language entry
  const newLang: Language = {
    code: parsed.code,
    name: parsed.name,
    fontStack: parsed.fontStack,
    minFontSize: parsed.minFontSize,
    direction: parsed.direction,
    translationPath: `/locales/${parsed.code}`,
  };
  langReg.languages.push(newLang);

  // Bump version
  const vParts = previousVersion.split('.');
  vParts[1] = String(Number(vParts[1]) + 1);
  vParts[2] = '0';
  langReg.version = vParts.join('.');

  writeFileSync(langRegPath, JSON.stringify(langReg, null, 2) + '\n', 'utf-8');
  recomputeFileHash('language-registry.json', configDir);

  // 3. Scaffold translation files
  // Use the default language (first in registry) as the source of keys
  const defaultLangCode = langReg.defaultLanguage;
  const defaultLocaleDir = join(localesDir, defaultLangCode);
  const newLocaleDir = join(localesDir, parsed.code);

  if (!existsSync(newLocaleDir)) {
    mkdirSync(newLocaleDir, { recursive: true });
  }

  const translationFiles = ['common.json', 'questionnaire.json', 'result.json', 'explanation.json'];
  let totalKeys = 0;

  for (const file of translationFiles) {
    const sourceKeys = readTranslationKeys(join(defaultLocaleDir, file));
    const scaffolded: Record<string, string> = {};

    for (const [key, value] of Object.entries(sourceKeys)) {
      scaffolded[key] = `${UNTRANSLATED_PREFIX}${value}`;
      totalKeys++;
    }

    writeFileSync(
      join(newLocaleDir, file),
      JSON.stringify(scaffolded, null, 2) + '\n',
      'utf-8',
    );
  }

  // 4. Write audit log
  appendAuditLog({
    action: 'add-language',
    previousVersion,
    newVersion: langReg.version,
    changedFields: [
      `language-registry: added ${parsed.code} (${parsed.name})`,
      `locales/${parsed.code}: scaffolded ${totalKeys} keys across ${translationFiles.length} files`,
    ],
    operator: parsed.operator,
  });

  console.log(`✓ Added language "${parsed.code}" (${parsed.name}) to language-registry.json`);
  console.log(`  Version: ${previousVersion} → ${langReg.version}`);
  console.log(`  Scaffolded ${totalKeys} translation keys in locales/${parsed.code}/`);
  console.log('');
  console.log('⚠ ACTION REQUIRED: Translate all strings marked with [UNTRANSLATED] prefix.');
  console.log(`  Files: ${translationFiles.map(f => `locales/${parsed.code}/${f}`).join(', ')}`);
}

main();
