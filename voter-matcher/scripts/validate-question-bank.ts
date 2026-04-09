/**
 * Validation script for question bank
 * 
 * This script demonstrates the IdeologyMappingEngine validation
 * against the actual config files.
 * 
 * Usage: npx tsx scripts/validate-question-bank.ts
 */

import { ConfigLoader } from '../lib/configLoader';
import { IdeologyMappingEngine } from '../engines/ideologyMappingEngine';
import { join } from 'path';

function main(): void {
  console.log('🔍 Validating Question Bank...\n');
  
  try {
    // Load config
    const configDir = join(process.cwd(), 'config');
    const loader = new ConfigLoader(configDir);
    const config = loader.load();
    
    console.log('✅ Config loaded successfully');
    console.log(`   - Parties: ${config.parties.parties.length} (${config.parties.parties.filter(p => p.active).length} active)`);
    console.log(`   - Axes: ${config.axes.axes.length}`);
    console.log(`   - Questions: ${config.questions.questions.length}\n`);
    
    // Validate question bank
    const engine = new IdeologyMappingEngine();
    const result = engine.validate(config.questions, config);
    
    if (result.isValid) {
      console.log('✅ Question bank validation PASSED');
      console.log('   - All party IDs are valid');
      console.log('   - All axis IDs are valid');
      console.log('   - All active parties have weights');
      console.log('   - All weights are within range [0, 5]\n');
    } else {
      console.log('❌ Question bank validation FAILED');
      console.log(`   - ${result.errors.length} error(s) found\n`);
      
      for (const error of result.errors) {
        console.log(`   ${error.errorType}: ${error.message}`);
      }
    }
    
    // Test getWeights
    console.log('🔍 Testing weight retrieval...\n');
    const testOptionId = 'q001_a';
    const weights = engine.getWeights(testOptionId, config.questions);
    
    console.log(`✅ Retrieved weights for option ${testOptionId}:`);
    console.log(`   Party Weights: ${JSON.stringify(weights.partyWeights)}`);
    console.log(`   Axis Weights: ${JSON.stringify(weights.axisWeights)}\n`);
    
    console.log('✅ All validations completed successfully!');
    
  } catch (error) {
    console.error('❌ Validation failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
