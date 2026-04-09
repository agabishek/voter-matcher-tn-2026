/**
 * Demonstration of ScoringEngine.computeConfidence()
 * 
 * This script shows how the dynamic confidence thresholds work
 * for different numbers of parties (N).
 */

import { ScoringEngine } from '../engines/scoringEngine';

const engine = new ScoringEngine();

console.log('=== ScoringEngine.computeConfidence() Demo ===\n');

// Example 1: N=2 parties (two-party system)
console.log('Example 1: N=2 parties');
console.log('Thresholds: High = 100/2 + 12 = 62, Medium = 100/2 + 2 = 52');
const twoParty = { PARTY_A: 85, PARTY_B: 15 };
const result1 = engine.computeConfidence(twoParty);
console.log(`Scores: ${JSON.stringify(twoParty)}`);
console.log(`Gap: ${result1.gap}, Level: ${result1.level}`);
console.log(`Thresholds: High=${result1.thresholds.high}, Medium=${result1.thresholds.medium}\n`);

// Example 2: N=3 parties (Tamil Nadu scenario)
console.log('Example 2: N=3 parties (Tamil Nadu)');
console.log('Thresholds: High = 100/3 + 12 ≈ 45.33, Medium = 100/3 + 2 ≈ 35.33');
const threeParty = { DMK: 70, AIADMK: 15, TVK: 15 };
const result2 = engine.computeConfidence(threeParty);
console.log(`Scores: ${JSON.stringify(threeParty)}`);
console.log(`Gap: ${result2.gap}, Level: ${result2.level}`);
console.log(`Thresholds: High=${result2.thresholds.high.toFixed(2)}, Medium=${result2.thresholds.medium.toFixed(2)}\n`);

// Example 3: N=5 parties (multi-party system)
console.log('Example 3: N=5 parties');
console.log('Thresholds: High = 100/5 + 12 = 32, Medium = 100/5 + 2 = 22');
const fiveParty = { P1: 40, P2: 25, P3: 20, P4: 10, P5: 5 };
const result3 = engine.computeConfidence(fiveParty);
console.log(`Scores: ${JSON.stringify(fiveParty)}`);
console.log(`Gap: ${result3.gap}, Level: ${result3.level}`);
console.log(`Thresholds: High=${result3.thresholds.high}, Medium=${result3.thresholds.medium}\n`);

// Example 4: Close race (Low confidence)
console.log('Example 4: Close three-way race');
const closeRace = { DMK: 34, AIADMK: 33, TVK: 33 };
const result4 = engine.computeConfidence(closeRace);
console.log(`Scores: ${JSON.stringify(closeRace)}`);
console.log(`Gap: ${result4.gap}, Level: ${result4.level}`);
console.log(`Thresholds: High=${result4.thresholds.high.toFixed(2)}, Medium=${result4.thresholds.medium.toFixed(2)}\n`);

// Example 5: Medium confidence
console.log('Example 5: Medium confidence scenario');
const mediumConfidence = { DMK: 60, AIADMK: 20, TVK: 20 };
const result5 = engine.computeConfidence(mediumConfidence);
console.log(`Scores: ${JSON.stringify(mediumConfidence)}`);
console.log(`Gap: ${result5.gap}, Level: ${result5.level}`);
console.log(`Thresholds: High=${result5.thresholds.high.toFixed(2)}, Medium=${result5.thresholds.medium.toFixed(2)}\n`);

console.log('=== Key Insights ===');
console.log('1. Thresholds scale with party count: more parties → lower thresholds');
console.log('2. Gap = difference between 1st and 2nd place parties');
console.log('3. High confidence requires a clear winner');
console.log('4. Low confidence indicates a competitive race');
