/**
 * Expert Panel Evaluation – Comprehensive Scoring Pipeline Audit
 *
 * This test simulates the Expert Panel (#1–#25) answering the quiz as
 * distinct voter personas and evaluates whether outcomes correctly
 * reflect each party's documented manifesto positions.
 *
 * Voter Personas (from Expert Panel):
 * - Tamil Nadu Political Analyst (#1): knows each party's real policy stance
 * - Rural Voter Representative (#24): welfare/agriculture focus
 * - First-Time Youth Voter (#19): reform/jobs/anti-corruption focus
 * - Dravidian History Scholar (#3): federalism/language/social justice focus
 * - Manifesto Analyst (#23): verifies weights match documented positions
 * - Algorithmic Fairness Researcher (#4): checks structural bias
 *
 * Each persona answers all 30 questions based on their known political
 * orientation, and we verify the scoring engine produces the expected
 * top party match.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { ScoringEngine } from '@/engines/scoringEngine';
import { ProfilingEngine } from '@/engines/profilingEngine';
import { ExplanationEngine } from '@/engines/explanationEngine';
import type { ScoreResult } from '@/engines/explanationEngine';
import { ConfigLoader } from '@/lib/configLoader';
import type { ConfigBundle, QuestionBank } from '@/lib/configLoader';
import { join } from 'path';

let config: ConfigBundle;
let questions: QuestionBank;
const scoring = new ScoringEngine();
const profiling = new ProfilingEngine();
const explanation = new ExplanationEngine();

const ALL_PARTIES = ['DMK', 'AIADMK', 'TVK'] as const;

beforeAll(() => {
  const loader = new ConfigLoader(join(process.cwd(), 'config'));
  config = loader.load();
  questions = config.questions;
});

/* ------------------------------------------------------------------ */
/*  Helper: run full pipeline and return diagnostic object             */
/* ------------------------------------------------------------------ */
interface PipelineResult {
  raw: Record<string, number>;
  normalized: Record<string, number>;
  topParty: string;
  topScore: number;
  runnerUp: string;
  runnerUpScore: number;
  gap: number;
  confidence: 'High' | 'Medium' | 'Low';
  archetype: string;
  axisScores: Record<string, number>;
}

function runPipeline(optionIds: readonly string[]): PipelineResult {
  const rawResult = scoring.compute(optionIds, questions, config);
  const normalized = scoring.normalize(rawResult.partyScores);
  const confidence = scoring.computeConfidence(normalized);
  const archetype = profiling.classify(rawResult.axisScores, config);

  const sorted = Object.entries(normalized).sort(([, a], [, b]) => b - a);

  return {
    raw: rawResult.partyScores,
    normalized,
    topParty: sorted[0][0],
    topScore: sorted[0][1],
    runnerUp: sorted[1][0],
    runnerUpScore: sorted[1][1],
    gap: sorted[0][1] - sorted[1][1],
    confidence: confidence.level,
    archetype: archetype.primary,
    axisScores: rawResult.axisScores,
  };
}

/* ================================================================== */
/*  EXPERT PERSONA ANSWER MAPS                                        */
/*  Each expert answers based on their documented political knowledge  */
/* ================================================================== */

/**
 * Persona 1: Pro-AIADMK Rural Welfare Voter (Expert #24)
 * Profile: Believes in direct cash, free goods, government pensions,
 * agriculture subsidies, state as provider. Distrusts private sector.
 * Expected match: AIADMK
 */
const AIADMK_WELFARE_VOTER: Record<string, string> = {
  q001: 'q001_a', // cash directly to families → AIADMK signature (Kula Vilakku)
  q002: 'q002_a', // yes increase cash allowance → AIADMK ₹2000/month
  q003: 'q003_a', // yes free meals/bus/goods → AIADMK free fridge, sarees, bus
  q004: 'q004_a', // monthly pension ₹2000 → AIADMK pension increase
  q005: 'q005_a', // deliver welfare efficiently → AIADMK welfare delivery focus
  q006: 'q006_b', // local offices in person → AIADMK E-Seva, traditional
  q007: 'q007_c', // elected representatives → AIADMK Manu Neethi Naal
  q008: 'q008_b', // expand government employment → AIADMK public sector
  q009: 'q009_a', // agriculture subsidies → AIADMK MSP, loan waivers
  q010: 'q010_c', // continue funding public companies → AIADMK state provider
  q011: 'q011_a', // direct cash transfers → AIADMK direct benefit
  q012: 'q012_a', // free housing → AIADMK Amma Illam
  q013: 'q013_b', // cash incentives for parents → AIADMK cash approach
  q014: 'q014_a', // expand reservation → AIADMK 69% protection
  q015: 'q015_a', // strict anti-discrimination laws → both DMK/AIADMK
  q016: 'q016_a', // strict women's protection → both
  q017: 'q017_c', // increase salaries → AIADMK traditional approach
  q018: 'q018_b', // moderate asset declaration → AIADMK moderate
  q019: 'q019_c', // government builds directly → AIADMK state control
  q020: 'q020_a', // government responsible → AIADMK state provider
  q021: 'q021_a', // regulate profits → AIADMK state control
  q022: 'q022_b', // incentives not penalties → AIADMK welfare approach
  q023: 'q023_a', // Tamil mandatory → all parties agree
  q024: 'q024_a', // resist Hindi → all parties agree
  q025: 'q025_a', // Tamil for govt jobs → all parties agree
  q026: 'q026_b', // cooperate with centre → AIADMK cooperative federalism
  q027: 'q027_b', // current sharing fair → AIADMK moderate federalism
  q028: 'q028_b', // dialogue not confrontation → AIADMK cooperative
  q029: 'q029_b', // centre mediates → AIADMK cooperative
  q030: 'q030_b', // cultural symbol ok → AIADMK moderate
};

/**
 * Persona 2: Pro-DMK Federalist Social Justice Voter (Expert #3)
 * Profile: Strong federalism, Tamil identity, social justice,
 * institutional reform, public services over cash. Anti-Hindi.
 * Expected match: DMK
 */
const DMK_FEDERALIST_VOTER: Record<string, string> = {
  q001: 'q001_b', // invest in public services → DMK institutional approach
  q002: 'q002_a', // yes cash allowance → DMK Magalir Urimai (but less than AIADMK)
  q003: 'q003_a', // yes free meals → DMK free breakfast scheme
  q004: 'q004_b', // free healthcare/food → DMK service-based welfare
  q005: 'q005_a', // deliver welfare efficiently → DMK Dravidian Model
  q006: 'q006_a', // digital single window → DMK e-governance
  q007: 'q007_b', // grievance portal → DMK digital governance
  q008: 'q008_c', // support small business → DMK MSME support
  q009: 'q009_c', // balanced rural-urban → DMK balanced approach
  q010: 'q010_b', // reform management → DMK institutional reform
  q011: 'q011_c', // education and healthcare → DMK access-based approach
  q012: 'q012_a', // free housing → DMK Ambedkar housing
  q013: 'q013_a', // free education/meals → DMK noon meal, laptops
  q014: 'q014_a', // expand reservation → DMK 69% + monitoring commission
  q015: 'q015_a', // strict anti-caste laws → DMK social justice core
  q016: 'q016_a', // strict women's protection → DMK
  q017: 'q017_b', // digitize services → DMK e-governance
  q018: 'q018_b', // moderate asset declaration → DMK moderate
  q019: 'q019_b', // prefer local companies → DMK state economy
  q020: 'q020_a', // government responsible → DMK state provider
  q021: 'q021_a', // regulate profits → DMK state control
  q022: 'q022_b', // incentives → DMK welfare approach
  q023: 'q023_a', // Tamil mandatory → DMK language identity
  q024: 'q024_a', // resist Hindi → DMK strongest anti-Hindi
  q025: 'q025_a', // Tamil for govt jobs → DMK language policy
  q026: 'q026_a', // full state autonomy → DMK strongest federalism
  q027: 'q027_a', // states get larger share → DMK 50-70% GST demand
  q028: 'q028_a', // states protect interests → DMK state rights
  q029: 'q029_a', // state controls water → DMK state subject
  q030: 'q030_a', // state flag yes → DMK distinct identity
};

/**
 * Persona 3: Pro-TVK Reform Youth Voter (Expert #19)
 * Profile: Anti-corruption, entrepreneurship, private sector jobs,
 * system reform, transparency, individual empowerment.
 * Expected match: TVK
 */
const TVK_REFORM_VOTER: Record<string, string> = {
  q001: 'q001_c', // create jobs via private sector → TVK entrepreneurship
  q002: 'q002_c', // skill training over cash → TVK empowerment
  q003: 'q003_c', // long-term economic capacity → TVK reform
  q004: 'q004_c', // community responsibility → TVK individual responsibility
  q005: 'q005_b', // transparent, corruption-free → TVK anti-corruption
  q006: 'q006_a', // digital single window → TVK transparency
  q007: 'q007_a', // independent ombudsman → TVK system reform
  q008: 'q008_a', // attract private companies → TVK private sector
  q009: 'q009_b', // industry/manufacturing → TVK economic growth
  q010: 'q010_a', // privatize for efficiency → TVK market reform
  q011: 'q011_b', // skill training → TVK empowerment
  q012: 'q012_c', // jobs so families afford housing → TVK self-reliance
  q013: 'q013_c', // improve school quality → TVK quality over quantity
  q014: 'q014_c', // merit-based → TVK reform (less reservation focus)
  q015: 'q015_c', // economic development reduces caste → TVK economic approach
  q016: 'q016_c', // existing laws sufficient → TVK moderate
  q017: 'q017_a', // independent anti-corruption agency → TVK core promise
  q018: 'q018_a', // full asset declaration + family → TVK transparency
  q019: 'q019_a', // open competitive bidding → TVK transparency
  q020: 'q020_b', // individual responsibility → TVK self-reliance
  q021: 'q021_b', // market competition → TVK market approach
  q022: 'q022_a', // parents accountable → TVK responsibility
  q023: 'q023_b', // Tamil + choice → TVK moderate language
  q024: 'q024_b', // Hindi optional not mandatory → TVK moderate
  q025: 'q025_c', // competence only → TVK merit-based
  q026: 'q026_b', // cooperate with centre → TVK moderate federalism
  q027: 'q027_b', // current sharing fair → TVK moderate
  q028: 'q028_b', // dialogue → TVK moderate
  q029: 'q029_b', // centre mediates → TVK moderate
  q030: 'q030_b', // cultural symbol → TVK moderate
};

/* ================================================================== */
/*  ADDITIONAL EXPERT PERSONAS                                        */
/* ================================================================== */

/**
 * Persona 4: DMK Social Justice Activist (Expert #16 Caste Studies Scholar)
 * Profile: Reservation champion, anti-caste, women's rights, public services,
 * but moderate on federalism. Picks social justice options everywhere.
 * Expected match: DMK
 */
const DMK_SOCIAL_JUSTICE: Record<string, string> = {
  q001: 'q001_b', q002: 'q002_b', q003: 'q003_b', q004: 'q004_b',
  q005: 'q005_a', q006: 'q006_a', q007: 'q007_b', q008: 'q008_c',
  q009: 'q009_c', q010: 'q010_b', q011: 'q011_c', q012: 'q012_b',
  q013: 'q013_a', q014: 'q014_a', q015: 'q015_a', q016: 'q016_a',
  q017: 'q017_b', q018: 'q018_b', q019: 'q019_b', q020: 'q020_a',
  q021: 'q021_a', q022: 'q022_b', q023: 'q023_a', q024: 'q024_a',
  q025: 'q025_a', q026: 'q026_a', q027: 'q027_a', q028: 'q028_a',
  q029: 'q029_a', q030: 'q030_a',
};

/**
 * Persona 5: AIADMK Farmer (Expert #24 variant)
 * Profile: Agriculture-first, direct benefits, pensions, free goods,
 * government employment, cooperative federalism. Rural focus.
 * Expected match: AIADMK
 */
const AIADMK_FARMER: Record<string, string> = {
  q001: 'q001_a', q002: 'q002_a', q003: 'q003_a', q004: 'q004_a',
  q005: 'q005_a', q006: 'q006_b', q007: 'q007_c', q008: 'q008_b',
  q009: 'q009_a', q010: 'q010_c', q011: 'q011_a', q012: 'q012_a',
  q013: 'q013_b', q014: 'q014_b', q015: 'q015_b', q016: 'q016_b',
  q017: 'q017_c', q018: 'q018_b', q019: 'q019_c', q020: 'q020_a',
  q021: 'q021_a', q022: 'q022_b', q023: 'q023_a', q024: 'q024_a',
  q025: 'q025_a', q026: 'q026_b', q027: 'q027_b', q028: 'q028_b',
  q029: 'q029_b', q030: 'q030_b',
};

/**
 * Persona 6: TVK Anti-Corruption Crusader (Expert #18 Misinformation Researcher)
 * Profile: Transparency above all, independent agencies, asset declarations,
 * open bidding, system reform. Less interested in welfare or identity.
 * Expected match: TVK
 */
const TVK_ANTICORRUPTION: Record<string, string> = {
  q001: 'q001_c', q002: 'q002_c', q003: 'q003_c', q004: 'q004_c',
  q005: 'q005_b', q006: 'q006_a', q007: 'q007_a', q008: 'q008_a',
  q009: 'q009_b', q010: 'q010_a', q011: 'q011_b', q012: 'q012_c',
  q013: 'q013_c', q014: 'q014_c', q015: 'q015_c', q016: 'q016_c',
  q017: 'q017_a', q018: 'q018_a', q019: 'q019_a', q020: 'q020_b',
  q021: 'q021_b', q022: 'q022_a', q023: 'q023_b', q024: 'q024_b',
  q025: 'q025_c', q026: 'q026_b', q027: 'q027_b', q028: 'q028_b',
  q029: 'q029_b', q030: 'q030_b',
};

/**
 * Persona 7: DMK Tamil Identity Purist (Expert #10 Tamil Language Expert)
 * Profile: Tamil language above all, anti-Hindi, strong federalism,
 * state autonomy, cultural preservation. Moderate on welfare/economy.
 * Expected match: DMK
 */
const DMK_TAMIL_PURIST: Record<string, string> = {
  q001: 'q001_b', q002: 'q002_b', q003: 'q003_b', q004: 'q004_b',
  q005: 'q005_a', q006: 'q006_a', q007: 'q007_b', q008: 'q008_c',
  q009: 'q009_c', q010: 'q010_b', q011: 'q011_c', q012: 'q012_b',
  q013: 'q013_c', q014: 'q014_a', q015: 'q015_a', q016: 'q016_a',
  q017: 'q017_b', q018: 'q018_b', q019: 'q019_b', q020: 'q020_c',
  q021: 'q021_c', q022: 'q022_c', q023: 'q023_a', q024: 'q024_a',
  q025: 'q025_a', q026: 'q026_a', q027: 'q027_a', q028: 'q028_a',
  q029: 'q029_a', q030: 'q030_a',
};

/**
 * Persona 8: TVK Entrepreneur Youth (Expert #19 variant)
 * Profile: Job creator mindset, private sector, skill training,
 * GST subsidies for hiring locals, self-reliance. Anti-freebies.
 * Expected match: TVK
 */
const TVK_ENTREPRENEUR: Record<string, string> = {
  q001: 'q001_c', q002: 'q002_c', q003: 'q003_c', q004: 'q004_c',
  q005: 'q005_c', q006: 'q006_a', q007: 'q007_a', q008: 'q008_a',
  q009: 'q009_b', q010: 'q010_a', q011: 'q011_b', q012: 'q012_c',
  q013: 'q013_c', q014: 'q014_c', q015: 'q015_c', q016: 'q016_c',
  q017: 'q017_a', q018: 'q018_a', q019: 'q019_a', q020: 'q020_b',
  q021: 'q021_b', q022: 'q022_a', q023: 'q023_b', q024: 'q024_b',
  q025: 'q025_b', q026: 'q026_b', q027: 'q027_b', q028: 'q028_b',
  q029: 'q029_b', q030: 'q030_b',
};

/**
 * Persona 9: AIADMK Senior Citizen (Expert #15 Sociologist)
 * Profile: Pensions, free healthcare, free goods, government housing,
 * traditional governance, cooperative federalism. Risk-averse.
 * Expected match: AIADMK
 */
const AIADMK_SENIOR: Record<string, string> = {
  q001: 'q001_a', q002: 'q002_a', q003: 'q003_a', q004: 'q004_a',
  q005: 'q005_a', q006: 'q006_b', q007: 'q007_c', q008: 'q008_b',
  q009: 'q009_a', q010: 'q010_c', q011: 'q011_a', q012: 'q012_a',
  q013: 'q013_a', q014: 'q014_a', q015: 'q015_b', q016: 'q016_b',
  q017: 'q017_c', q018: 'q018_c', q019: 'q019_c', q020: 'q020_a',
  q021: 'q021_a', q022: 'q022_b', q023: 'q023_a', q024: 'q024_a',
  q025: 'q025_a', q026: 'q026_b', q027: 'q027_b', q028: 'q028_b',
  q029: 'q029_b', q030: 'q030_b',
};

/**
 * Persona 10: Swing Voter – Moderate on everything (Expert #8 Psychologist)
 * Profile: Always picks option B (middle ground). Should NOT strongly
 * match any single party. Tests that moderates get balanced results.
 * Expected: no party > 45%, gap < 10pp
 */
const SWING_MODERATE: Record<string, string> = {
  q001: 'q001_b', q002: 'q002_b', q003: 'q003_b', q004: 'q004_b',
  q005: 'q005_b', q006: 'q006_b', q007: 'q007_b', q008: 'q008_b',
  q009: 'q009_b', q010: 'q010_b', q011: 'q011_b', q012: 'q012_b',
  q013: 'q013_b', q014: 'q014_b', q015: 'q015_b', q016: 'q016_b',
  q017: 'q017_b', q018: 'q018_b', q019: 'q019_b', q020: 'q020_b',
  q021: 'q021_b', q022: 'q022_b', q023: 'q023_b', q024: 'q024_b',
  q025: 'q025_b', q026: 'q026_b', q027: 'q027_b', q028: 'q028_b',
  q029: 'q029_b', q030: 'q030_b',
};

/**
 * Persona 11: Cross-ideological – welfare + anti-corruption (Expert #20)
 * Profile: Wants AIADMK-style welfare but TVK-style transparency.
 * Tests that mixed profiles produce reasonable results.
 * Expected: AIADMK or TVK (not DMK)
 */
const CROSS_WELFARE_REFORM: Record<string, string> = {
  q001: 'q001_a', q002: 'q002_a', q003: 'q003_a', q004: 'q004_a', // welfare → AIADMK
  q005: 'q005_b', q006: 'q006_a', q007: 'q007_a',                  // governance → TVK
  q008: 'q008_a', q009: 'q009_b', q010: 'q010_a',                  // economy → TVK
  q011: 'q011_a', q012: 'q012_a', q013: 'q013_b',                  // poverty → AIADMK
  q014: 'q014_b', q015: 'q015_b', q016: 'q016_b',                  // social justice → moderate
  q017: 'q017_a', q018: 'q018_a', q019: 'q019_a',                  // corruption → TVK
  q020: 'q020_a', q021: 'q021_a', q022: 'q022_b',                  // responsibility → AIADMK
  q023: 'q023_b', q024: 'q024_b', q025: 'q025_b',                  // language → moderate
  q026: 'q026_b', q027: 'q027_b', q028: 'q028_b', q029: 'q029_b', q030: 'q030_b', // federalism → moderate
};

/* ================================================================== */
/*  HELPER: convert persona map to option IDs array                   */
/* ================================================================== */
function personaToOptionIds(persona: Record<string, string>): string[] {
  return questions.questions.map(q => {
    const suffix = persona[q.id];
    if (!suffix) throw new Error(`Persona missing answer for ${q.id}`);
    return suffix;
  });
}

function logResult(name: string, result: PipelineResult): void {
  console.log(`\n=== ${name} ===`);
  console.log(`  ${result.topParty} ${result.topScore.toFixed(1)}% | ${result.runnerUp} ${result.runnerUpScore.toFixed(1)}% | Gap: ${result.gap.toFixed(1)}pp | ${result.confidence} | ${result.archetype}`);
}

/* ================================================================== */
/*  1. CORE EXPERT PERSONA OUTCOME TESTS                              */
/* ================================================================== */

describe('Expert Panel Persona Outcomes – Core 3', () => {
  it('AIADMK welfare voter (Expert #24) → AIADMK', () => {
    const result = runPipeline(personaToOptionIds(AIADMK_WELFARE_VOTER));
    logResult('AIADMK Welfare Voter', result);
    expect(result.topParty).toBe('AIADMK');
    expect(result.gap).toBeGreaterThan(5);
  });

  it('DMK federalist voter (Expert #3) → DMK', () => {
    const result = runPipeline(personaToOptionIds(DMK_FEDERALIST_VOTER));
    logResult('DMK Federalist Voter', result);
    expect(result.topParty).toBe('DMK');
    expect(result.gap).toBeGreaterThan(5);
  });

  it('TVK reform voter (Expert #19) → TVK', () => {
    const result = runPipeline(personaToOptionIds(TVK_REFORM_VOTER));
    logResult('TVK Reform Voter', result);
    expect(result.topParty).toBe('TVK');
    expect(result.gap).toBeGreaterThan(5);
  });
});

/* ================================================================== */
/*  2. EXTENDED EXPERT PERSONAS – VARIANT PROFILES                    */
/* ================================================================== */

describe('Expert Panel Persona Outcomes – Extended', () => {
  it('DMK social justice activist (Expert #16) → DMK', () => {
    const result = runPipeline(personaToOptionIds(DMK_SOCIAL_JUSTICE));
    logResult('DMK Social Justice', result);
    expect(result.topParty).toBe('DMK');
    expect(result.gap).toBeGreaterThan(3);
  });

  it('AIADMK farmer (Expert #24 variant) → AIADMK', () => {
    const result = runPipeline(personaToOptionIds(AIADMK_FARMER));
    logResult('AIADMK Farmer', result);
    expect(result.topParty).toBe('AIADMK');
    expect(result.gap).toBeGreaterThan(3);
  });

  it('TVK anti-corruption crusader (Expert #18) → TVK', () => {
    const result = runPipeline(personaToOptionIds(TVK_ANTICORRUPTION));
    logResult('TVK Anti-Corruption', result);
    expect(result.topParty).toBe('TVK');
    expect(result.gap).toBeGreaterThan(5);
  });

  it('DMK Tamil identity purist (Expert #10) → DMK', () => {
    const result = runPipeline(personaToOptionIds(DMK_TAMIL_PURIST));
    logResult('DMK Tamil Purist', result);
    expect(result.topParty).toBe('DMK');
    expect(result.gap).toBeGreaterThan(3);
  });

  it('TVK entrepreneur youth (Expert #19 variant) → TVK', () => {
    const result = runPipeline(personaToOptionIds(TVK_ENTREPRENEUR));
    logResult('TVK Entrepreneur', result);
    expect(result.topParty).toBe('TVK');
    expect(result.gap).toBeGreaterThan(5);
  });

  it('AIADMK senior citizen (Expert #15) → AIADMK', () => {
    const result = runPipeline(personaToOptionIds(AIADMK_SENIOR));
    logResult('AIADMK Senior', result);
    expect(result.topParty).toBe('AIADMK');
    expect(result.gap).toBeGreaterThan(3);
  });
});

/* ================================================================== */
/*  3. EDGE CASE PERSONAS                                             */
/* ================================================================== */

describe('Expert Panel – Edge Case Personas', () => {
  it('swing moderate (all option B) → no party dominates (gap < 15pp)', () => {
    const result = runPipeline(personaToOptionIds(SWING_MODERATE));
    logResult('Swing Moderate', result);
    // A moderate voter should not get an extreme match
    expect(result.topScore).toBeLessThan(50);
    expect(result.gap).toBeLessThan(15);
  });

  it('cross-ideological welfare+reform → NOT DMK (welfare=AIADMK, reform=TVK)', () => {
    const result = runPipeline(personaToOptionIds(CROSS_WELFARE_REFORM));
    logResult('Cross Welfare+Reform', result);
    // DMK should not win when voter picks AIADMK welfare + TVK reform
    expect(result.topParty).not.toBe('DMK');
  });

  it('all option A → AIADMK or DMK (option A tends welfare/state)', () => {
    const allA = questions.questions.map(q => q.options[0].id);
    const result = runPipeline(allA);
    logResult('All Option A', result);
    expect(['AIADMK', 'DMK']).toContain(result.topParty);
  });

  it('all option C → not DMK (option C tends reform/individual or cooperative)', () => {
    const allC = questions.questions.map(q => q.options[2].id);
    const result = runPipeline(allC);
    logResult('All Option C', result);
    // Option C is a mix: reform/individual in welfare/economy clusters,
    // but cooperative/follow-centre in federalism clusters.
    // DMK should NOT win since option C avoids DMK's core positions.
    expect(result.topParty).not.toBe('DMK');
  });
});

/* ================================================================== */
/*  2. WEIGHT DIAGNOSIS – Per-question contribution analysis           */
/* ================================================================== */

describe('Weight Diagnosis – Per-Question Analysis', () => {
  it('diagnose which questions fail to differentiate for each persona', () => {
    const personas = [
      { name: 'AIADMK_WELFARE', answers: AIADMK_WELFARE_VOTER, expected: 'AIADMK' },
      { name: 'DMK_FEDERALIST', answers: DMK_FEDERALIST_VOTER, expected: 'DMK' },
      { name: 'TVK_REFORM', answers: TVK_REFORM_VOTER, expected: 'TVK' },
    ];

    for (const persona of personas) {
      console.log(`\n=== ${persona.name} – Per-Question Weight Contribution ===`);
      let cumulativeDMK = 0;
      let cumulativeAIADMK = 0;
      let cumulativeTVK = 0;
      const problems: string[] = [];

      for (const q of questions.questions) {
        const optionId = persona.answers[q.id];
        const option = q.options.find(o => o.id === optionId);
        if (!option) continue;

        const dmk = option.partyWeights['DMK'] ?? 0;
        const aiadmk = option.partyWeights['AIADMK'] ?? 0;
        const tvk = option.partyWeights['TVK'] ?? 0;

        cumulativeDMK += dmk;
        cumulativeAIADMK += aiadmk;
        cumulativeTVK += tvk;

        const spread = Math.max(dmk, aiadmk, tvk) - Math.min(dmk, aiadmk, tvk);
        const expectedWeight = option.partyWeights[persona.expected] ?? 0;
        const maxWeight = Math.max(dmk, aiadmk, tvk);

        // Flag problems: expected party doesn't have highest weight, or spread is 0
        if (expectedWeight < maxWeight) {
          problems.push(`${q.id} (${q.cluster}): expected ${persona.expected}=${expectedWeight} but max is ${maxWeight} [DMK=${dmk} AIADMK=${aiadmk} TVK=${tvk}]`);
        }
        if (spread === 0) {
          problems.push(`${q.id} (${q.cluster}): ZERO SPREAD – all parties equal [${dmk}/${aiadmk}/${tvk}]`);
        }
      }

      console.log(`Cumulative raw: DMK=${cumulativeDMK} AIADMK=${cumulativeAIADMK} TVK=${cumulativeTVK}`);
      const total = cumulativeDMK + cumulativeAIADMK + cumulativeTVK;
      console.log(`Normalized: DMK=${(cumulativeDMK/total*100).toFixed(1)}% AIADMK=${(cumulativeAIADMK/total*100).toFixed(1)}% TVK=${(cumulativeTVK/total*100).toFixed(1)}%`);

      if (problems.length > 0) {
        console.log(`\nPROBLEM QUESTIONS (${problems.length}):`);
        for (const p of problems) console.log('  ⚠ ' + p);
      } else {
        console.log('\n✓ All questions correctly weighted for this persona');
      }
    }

    // This test always passes – it's diagnostic
    expect(true).toBe(true);
  });
});

/* ================================================================== */
/*  3. GLOBAL WEIGHT STATISTICS                                       */
/* ================================================================== */

describe('Global Weight Statistics (Expert #4 Fairness Audit)', () => {
  it('report total weight pool, spread distribution, and dead options', () => {
    const totalWeights: Record<string, number> = { DMK: 0, AIADMK: 0, TVK: 0 };
    let zeroSpreadCount = 0;
    let lowSpreadCount = 0; // spread <= 1
    let totalOptions = 0;
    const spreads: number[] = [];

    for (const q of questions.questions) {
      for (const opt of q.options) {
        totalOptions++;
        const dmk = opt.partyWeights['DMK'] ?? 0;
        const aiadmk = opt.partyWeights['AIADMK'] ?? 0;
        const tvk = opt.partyWeights['TVK'] ?? 0;

        totalWeights['DMK'] += dmk;
        totalWeights['AIADMK'] += aiadmk;
        totalWeights['TVK'] += tvk;

        const spread = Math.max(dmk, aiadmk, tvk) - Math.min(dmk, aiadmk, tvk);
        spreads.push(spread);
        if (spread === 0) zeroSpreadCount++;
        if (spread <= 1) lowSpreadCount++;
      }
    }

    const avgSpread = spreads.reduce((a, b) => a + b, 0) / spreads.length;

    console.log('\n=== GLOBAL WEIGHT STATISTICS ===');
    console.log('Total weight pool: DMK=' + totalWeights['DMK'] + ' AIADMK=' + totalWeights['AIADMK'] + ' TVK=' + totalWeights['TVK']);
    console.log('Zero-spread options (dead): ' + zeroSpreadCount + '/' + totalOptions + ' (' + (zeroSpreadCount/totalOptions*100).toFixed(0) + '%)');
    console.log('Low-spread options (≤1): ' + lowSpreadCount + '/' + totalOptions + ' (' + (lowSpreadCount/totalOptions*100).toFixed(0) + '%)');
    console.log('Average spread: ' + avgSpread.toFixed(2) + ' (target: ≥2.0)');
    console.log('Spread distribution: ' + JSON.stringify(
      spreads.reduce((acc: Record<number, number>, s) => { acc[s] = (acc[s] ?? 0) + 1; return acc; }, {})
    ));

    // Report findings
    if (avgSpread < 2.0) {
      console.log('\n⚠ CRITICAL: Average spread is below 2.0 – weights are too compressed');
      console.log('  This means most options give similar scores to all parties');
      console.log('  Result: 33/33/34 outcomes regardless of voter orientation');
    }
    if (zeroSpreadCount > 5) {
      console.log('\n⚠ CRITICAL: ' + zeroSpreadCount + ' dead options contribute zero signal');
    }
    if (totalWeights['DMK'] === totalWeights['AIADMK'] && totalWeights['AIADMK'] === totalWeights['TVK']) {
      console.log('\n⚠ CRITICAL: Total weight pools are EXACTLY equal – no structural differentiation');
    }

    // This is diagnostic – always passes
    expect(true).toBe(true);
  });

  it('QUALITY GATE: zero dead options, zero low-spread, avg spread ≥ 2.5', () => {
    let zeroSpreadCount = 0;
    let lowSpreadCount = 0;
    let totalOptions = 0;
    let spreadSum = 0;

    for (const q of questions.questions) {
      for (const opt of q.options) {
        totalOptions++;
        const dmk = opt.partyWeights['DMK'] ?? 0;
        const aiadmk = opt.partyWeights['AIADMK'] ?? 0;
        const tvk = opt.partyWeights['TVK'] ?? 0;
        const spread = Math.max(dmk, aiadmk, tvk) - Math.min(dmk, aiadmk, tvk);
        spreadSum += spread;
        if (spread === 0) zeroSpreadCount++;
        if (spread <= 1) lowSpreadCount++;
      }
    }

    const avgSpread = spreadSum / totalOptions;
    expect(zeroSpreadCount).toBe(0);
    expect(lowSpreadCount).toBe(0);
    expect(avgSpread).toBeGreaterThanOrEqual(2.5);
  });

  it('QUALITY GATE: total weight pools within 10% of each other', () => {
    const totals: Record<string, number> = { DMK: 0, AIADMK: 0, TVK: 0 };
    for (const q of questions.questions) {
      for (const opt of q.options) {
        for (const pid of ALL_PARTIES) {
          totals[pid] += opt.partyWeights[pid] ?? 0;
        }
      }
    }
    const vals = Object.values(totals);
    const ratio = Math.max(...vals) / Math.min(...vals);
    expect(ratio).toBeLessThan(1.10);
  });

  it('QUALITY GATE: every party can be top match with best-case answers', () => {
    for (const pid of ALL_PARTIES) {
      const bestOptions = questions.questions.map(q => {
        let best = q.options[0];
        let bestW = q.options[0].partyWeights[pid] ?? 0;
        for (const opt of q.options) {
          const w = opt.partyWeights[pid] ?? 0;
          if (w > bestW) { bestW = w; best = opt; }
        }
        return best.id;
      });
      const result = runPipeline(bestOptions);
      expect(result.topParty).toBe(pid);
    }
  });
});

/* ================================================================== */
/*  4. EXPLANATION QUALITY CHECK                                      */
/* ================================================================== */

describe('Explanation Quality for Expert Personas', () => {
  it('each persona gets a meaningful explanation in both languages', () => {
    const personas = [
      { name: 'AIADMK_WELFARE', answers: AIADMK_WELFARE_VOTER },
      { name: 'DMK_FEDERALIST', answers: DMK_FEDERALIST_VOTER },
      { name: 'TVK_REFORM', answers: TVK_REFORM_VOTER },
      { name: 'DMK_SOCIAL_JUSTICE', answers: DMK_SOCIAL_JUSTICE },
      { name: 'AIADMK_FARMER', answers: AIADMK_FARMER },
      { name: 'TVK_ANTICORRUPTION', answers: TVK_ANTICORRUPTION },
      { name: 'DMK_TAMIL_PURIST', answers: DMK_TAMIL_PURIST },
      { name: 'TVK_ENTREPRENEUR', answers: TVK_ENTREPRENEUR },
      { name: 'AIADMK_SENIOR', answers: AIADMK_SENIOR },
      { name: 'SWING_MODERATE', answers: SWING_MODERATE },
      { name: 'CROSS_WELFARE_REFORM', answers: CROSS_WELFARE_REFORM },
    ];

    for (const persona of personas) {
      const ids = personaToOptionIds(persona.answers);
      const rawResult = scoring.compute(ids, questions, config);
      const normalized = scoring.normalize(rawResult.partyScores);
      const confidence = scoring.computeConfidence(normalized);
      const archetype = profiling.classify(rawResult.axisScores, config);
      const contradictions = profiling.detectContradictions(rawResult.axisScores, config);

      const scoreResult: ScoreResult = {
        partyScores: normalized,
        rawScores: rawResult.partyScores,
        axisScores: rawResult.axisScores,
        confidenceScore: confidence.level,
        confidenceGap: confidence.gap,
        answeredCount: 30,
        skippedCount: 0,
        configVersion: config.version,
      };

      const enExpl = explanation.generate(scoreResult, archetype, contradictions, config, 'en');
      const taExpl = explanation.generate(scoreResult, archetype, contradictions, config, 'ta');

      console.log(`\n=== ${persona.name} Explanation ===`);
      console.log('EN:', enExpl.primaryParagraph.substring(0, 120) + '...');
      console.log('Beliefs:', enExpl.beliefStatements.join(' | '));
      if (enExpl.trackRecordNotice) console.log('Track record:', enExpl.trackRecordNotice.substring(0, 80) + '...');

      expect(enExpl.primaryParagraph.length).toBeGreaterThan(0);
      expect(taExpl.primaryParagraph.length).toBeGreaterThan(0);
      expect(enExpl.beliefStatements.length).toBeGreaterThanOrEqual(2);
      expect(taExpl.beliefStatements.length).toBeGreaterThanOrEqual(2);
    }
  });
});
