/**
 * Compute and update hashes for all config files
 * 
 * This script computes SHA256 hashes for all config files and updates
 * the hash field in each file. This is a temporary utility for development.
 * 
 * Usage: npx tsx scripts/compute-hashes.ts
 */

import { createHash } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const CONFIG_DIR = join(process.cwd(), 'config');
const CONFIG_FILES = [
  'party-registry.json',
  'axis-registry.json',
  'archetype-registry.json',
  'language-registry.json',
  'questions.json',
  'scoring-params.json',
];

function computeHash(contentWithEmptyHash: string): string {
  return createHash('sha256').update(contentWithEmptyHash, 'utf-8').digest('hex');
}

function updateConfigHash(filename: string): void {
  const filePath = join(CONFIG_DIR, filename);
  
  try {
    // Read file content
    const fileContent = readFileSync(filePath, 'utf-8');
    
    // Parse JSON
    const config = JSON.parse(fileContent);
    
    // Set hash to empty string temporarily
    config.hash = '';
    
    // Serialize with empty hash (this is what we'll hash)
    const contentWithEmptyHash = JSON.stringify(config, null, 2) + '\n';
    
    // Compute hash of content with empty hash field
    const newHash = computeHash(contentWithEmptyHash);
    
    // Now set the actual hash
    config.hash = newHash;
    
    // Write back to file with the computed hash
    const finalContent = JSON.stringify(config, null, 2) + '\n';
    writeFileSync(filePath, finalContent, 'utf-8');
    
    console.log(`✓ Updated ${filename}: ${newHash}`);
  } catch (error) {
    console.error(`✗ Failed to update ${filename}:`, error);
    process.exit(1);
  }
}

console.log('Computing hashes for config files...\n');

for (const filename of CONFIG_FILES) {
  updateConfigHash(filename);
}

console.log('\n✓ All config hashes updated successfully!');
