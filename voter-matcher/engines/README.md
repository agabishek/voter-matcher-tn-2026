# Engines

This directory contains the core logic engines for the Voter Matcher application. Each engine is responsible for a specific aspect of the application's functionality.

## IdeologyMappingEngine

**File:** `ideologyMappingEngine.ts`

The IdeologyMappingEngine validates the question bank against the Party and Axis registries to ensure data integrity.

### Responsibilities

1. **Validate Party IDs**: Ensures all party IDs in question weights exist in Party_Registry
2. **Validate Axis IDs**: Ensures all axis IDs in question weights exist in Axis_Registry
3. **Check Active Party Coverage**: Verifies all active parties have weights defined for each option
4. **Validate Weight Ranges**: Ensures all weights are within the configured range [min, max]
5. **Emit Weights**: Retrieves party and axis weights for selected options

### Usage

```typescript
import { IdeologyMappingEngine } from '@/engines/ideologyMappingEngine';
import { ConfigLoader } from '@/lib/configLoader';

const loader = new ConfigLoader();
const config = loader.load();
const engine = new IdeologyMappingEngine();

// Validate question bank
try {
  const result = engine.validate(config.questions, config);
  console.log('Validation passed:', result.isValid);
} catch (error) {
  console.error('Validation failed:', error.message);
}

// Get weights for an option
const weights = engine.getWeights('q001_a', config.questions);
console.log('Party weights:', weights.partyWeights);
console.log('Axis weights:', weights.axisWeights);
```

### Validation Rules

The engine enforces the following validation rules:

1. **Unknown Party ID**: Throws error if a party ID in question weights doesn't exist in Party_Registry
2. **Unknown Axis ID**: Throws error if an axis ID in question weights doesn't exist in Axis_Registry
3. **Missing Active Party Weight**: Throws error if an active party is missing weights for an option
4. **Weight Out of Range**: Throws error if any weight is outside the configured range

### Error Messages

All validation errors include:
- Question ID
- Option ID (if applicable)
- Error type
- Descriptive message
- Additional details for debugging

Example error:
```
Question q001, Option q001_a: Unknown party ID "UNKNOWN_PARTY". 
Party does not exist in Party_Registry.
```

### Testing

The engine has comprehensive test coverage:

- **Unit tests**: `tests/ideologyMappingEngine.test.ts`
  - Tests validation logic with mock data
  - Tests error handling and edge cases
  - Tests weight retrieval functionality

- **Integration tests**: `tests/ideologyMappingEngine.integration.test.ts`
  - Tests validation against real config files
  - Verifies all 30 questions in the actual question bank
  - Ensures data integrity across the entire system

Run tests:
```bash
npm test -- ideologyMappingEngine
```

### Validation Script

A standalone validation script is available:

```bash
npx tsx scripts/validate-question-bank.ts
```

This script:
- Loads all config files
- Validates the question bank
- Reports validation results
- Demonstrates weight retrieval

### Design Principles

1. **Fail Fast**: Validation throws errors immediately on first failure
2. **Descriptive Errors**: All errors include context and debugging information
3. **Type Safety**: Full TypeScript type coverage with strict mode
4. **Immutability**: Weight retrieval returns copies, not references
5. **Zero Hardcoding**: All validation rules read from config files

### Future Enhancements

Potential future additions (not in current scope):

- Collinearity checking between questions
- Discriminating power analysis
- Weight distribution statistics
- Automated weight suggestion based on manifesto analysis


---

## ScoringEngine

**File:** `scoringEngine.ts`

The ScoringEngine computes raw party and axis scores from user-selected options. It aggregates weights across all selected options and handles the zero-input edge case.

### Responsibilities

1. **Sum Party Weights**: Aggregates Party_Weights per party across all selected options
2. **Sum Axis Weights**: Aggregates Axis_Weights per axis across all selected options
3. **Handle Zero-Input**: Returns equal split (100/N per party) when no answers provided
4. **Return Raw Scores**: Returns raw sums, not normalized percentages

### Usage

```typescript
import { ScoringEngine } from '@/engines/scoringEngine';
import { ConfigLoader } from '@/lib/configLoader';

const loader = new ConfigLoader();
const config = loader.load();
const engine = new ScoringEngine();

// Compute scores from selected options
const selectedOptions = ['q001_a', 'q002_b', 'q003_c'];
const result = engine.compute(selectedOptions, config.questions, config);

console.log('Party scores:', result.partyScores);
// { DMK: 45, AIADMK: 52, TVK: 38 }

console.log('Axis scores:', result.axisScores);
// { welfare: 12, economy: 15, governance: 8, ... }
```

### Scoring Rules

1. **Normal Case**: Sum all Party_Weights and Axis_Weights from selected options
2. **Zero-Input Case**: If no options selected, return 100/N for each party (equal split)
3. **Active Parties Only**: Only active parties from Party_Registry are included
4. **All Axes Initialized**: All axes from Axis_Registry are initialized to 0

### Edge Cases

#### Zero-Input (No Answers)
```typescript
const result = engine.compute([], config.questions, config);
// With 3 parties: { DMK: 33.333..., AIADMK: 33.333..., TVK: 33.333... }
// All axis scores: 0
```

#### Single Option
```typescript
const result = engine.compute(['q001_a'], config.questions, config);
// Returns weights from that single option
```

#### All Options from Same Question
```typescript
const result = engine.compute(['q001_a', 'q001_b'], config.questions, config);
// Sums weights from both options (unusual but valid)
```

### N-Party Scaling

The engine works for any number of active parties (N ≥ 2):

- **N=2**: Equal split = 50% each
- **N=3**: Equal split = 33.333...% each
- **N=5**: Equal split = 20% each

No hardcoded party counts — all logic reads from Party_Registry.

### Testing

The engine has comprehensive test coverage:

- **Unit tests**: `tests/scoringEngine.test.ts`
  - Tests weight aggregation logic
  - Tests zero-input edge case
  - Tests N-party scaling (N=2, N=3, N=5)
  - Tests active vs inactive party handling
  - Tests raw score output (not normalized)

- **Integration tests**: `tests/scoringEngine.integration.test.ts`
  - Tests with real config files
  - Verifies correct party and axis initialization
  - Tests zero-input with real Party_Registry

Run tests:
```bash
npm test -- scoringEngine
```

### Design Principles

1. **No Hardcoding**: Party count and axis list read from config
2. **Type Safety**: Full TypeScript strict mode compliance
3. **Immutability**: Uses `readonly` for input arrays
4. **Raw Scores**: Returns raw sums, not normalized percentages (normalization is a separate concern)
5. **Fail Fast**: Throws error if option ID not found

### Integration with Other Engines

The ScoringEngine depends on:
- **IdeologyMappingEngine**: Uses `getWeights()` to retrieve option weights
- **ConfigLoader**: Reads Party_Registry and Axis_Registry

Future engines will depend on ScoringEngine:
- **ProfilingEngine**: Will use axis scores for archetype classification
- **ExplanationEngine**: Will use party scores for result explanation
- **ConfidenceEngine**: Will use party scores to compute confidence levels

### Performance

- **Time Complexity**: O(S × P + S × A) where S = selected options, P = parties, A = axes
- **Space Complexity**: O(P + A) for score storage
- **Target**: < 200ms for 30 questions (per design doc performance targets)

The engine is designed for client-side execution with zero server cost.

---

## ProfilingEngine

**File:** `profilingEngine.ts`

The ProfilingEngine classifies users into psychological archetypes based on their axis scores. It reads archetype definitions and dominant axis mappings from the Archetype_Registry to determine primary and optional secondary archetypes.

### Responsibilities

1. **Classify Primary Archetype**: Identifies the archetype whose dominant axes have the highest combined score
2. **Detect Ambiguity**: Determines if the gap between top two archetypes is within the configured threshold
3. **Assign Secondary Archetype**: Optionally assigns a secondary archetype when result is ambiguous
4. **Handle Edge Cases**: Manages zero scores, tied archetypes, and single archetype configurations

### Usage

```typescript
import { ProfilingEngine } from '@/engines/profilingEngine';
import { ConfigLoader } from '@/lib/configLoader';

const loader = new ConfigLoader();
const config = loader.load();
const engine = new ProfilingEngine();

// Classify user based on axis scores
const axisScores = {
  welfare: 25,
  poverty: 20,
  social_justice: 5,
  governance: 3,
  corruption: 2,
  economy: 1,
  responsibility: 1,
  language_identity: 2,
  federalism: 1
};

const result = engine.classify(axisScores, config);

console.log('Primary archetype:', result.primary);
// "security_seeker"

console.log('Is ambiguous:', result.isAmbiguous);
// false

console.log('Secondary archetype:', result.secondary);
// undefined (not ambiguous)
```

### Classification Algorithm

1. **Compute Archetype Scores**: For each archetype, sum the axis scores for its dominant axes
2. **Sort by Score**: Rank archetypes by their computed scores (descending)
3. **Select Primary**: The archetype with the highest score becomes primary
4. **Check Ambiguity**: Calculate gap between top two archetypes
5. **Assign Secondary**: If gap ≤ ambiguityThreshold, assign secondary archetype

### Archetypes (TN 2026)

The current deployment defines four archetypes:

1. **Security Seeker** (`security_seeker`)
   - Dominant axes: `welfare`, `poverty`
   - Prioritizes direct government support and economic security

2. **Equity Builder** (`equity_builder`)
   - Dominant axes: `social_justice`, `governance`
   - Prioritizes systemic equality and institutional reform

3. **System Reformer** (`system_reformer`)
   - Dominant axes: `corruption`, `economy`, `responsibility`
   - Prioritizes transparency, accountability, and economic reform

4. **Identity Advocate** (`identity_advocate`)
   - Dominant axes: `language_identity`, `federalism`
   - Prioritizes Tamil cultural identity and state autonomy

### Ambiguity Detection

Ambiguity occurs when the top two archetypes have similar scores:

```typescript
// Example: Close scores
const axisScores = {
  welfare: 15.0,
  poverty: 14.05,   // security_seeker: 29.05
  social_justice: 14.5,
  governance: 14.5, // equity_builder: 29.0
  // ... other axes
};
// Gap = 0.05, threshold = 0.1 → Ambiguous

const result = engine.classify(axisScores, config);
// {
//   primary: 'security_seeker',
//   secondary: 'equity_builder',
//   isAmbiguous: true
// }
```

### Edge Cases

#### Zero Axis Scores
```typescript
const axisScores = {
  welfare: 0,
  poverty: 0,
  // ... all zeros
};

const result = engine.classify(axisScores, config);
// All archetypes have score 0
// First archetype becomes primary, marked as ambiguous
```

#### Missing Axis Scores
```typescript
const axisScores = {
  welfare: 20
  // Other axes missing
};

const result = engine.classify(axisScores, config);
// Missing axes treated as 0
```

#### Tied Archetypes
```typescript
const axisScores = {
  welfare: 10,
  poverty: 10,      // security_seeker: 20
  social_justice: 10,
  governance: 10,   // equity_builder: 20
  // ... other axes
};

const result = engine.classify(axisScores, config);
// Gap = 0, marked as ambiguous
// First in sorted order becomes primary
```

### Testing

The engine has comprehensive test coverage:

- **Unit tests**: `tests/profilingEngine.test.ts`
  - Tests primary archetype classification
  - Tests ambiguity detection and secondary assignment
  - Tests edge cases (zero scores, ties, single archetype)
  - Tests threshold handling
  - Tests with multiple dominant axes per archetype

- **Integration tests**: `tests/profilingEngine.integration.test.ts`
  - Tests with real Archetype_Registry and Axis_Registry
  - Verifies all four archetypes classify correctly
  - Tests ambiguity detection with real thresholds
  - Validates archetype registry structure

Run tests:
```bash
npm test -- profilingEngine
```

### Design Principles

1. **No Hardcoding**: All archetype definitions read from Archetype_Registry
2. **Archetype Independence**: Classification never reads party scores directly
3. **Type Safety**: Full TypeScript strict mode compliance
4. **Configurable Thresholds**: Each archetype has its own ambiguity threshold
5. **N-Archetype Scaling**: Works for any number of archetypes (N ≥ 1)

### Integration with Other Engines

The ProfilingEngine depends on:
- **ScoringEngine**: Uses axis scores computed by ScoringEngine
- **ConfigLoader**: Reads Archetype_Registry for archetype definitions

Future engines will depend on ProfilingEngine:
- **ExplanationEngine**: Will use archetype classification for result explanation
- **ConsistencyDetector**: May use archetype to contextualize contradictions

### Configuration

Archetype definitions in `config/archetype-registry.json`:

```json
{
  "id": "security_seeker",
  "names": { "en": "Security Seeker", "ta": "பாதுகாப்பு தேடுபவர்" },
  "dominantAxes": ["welfare", "poverty"],
  "ambiguityThreshold": 0.1,
  "descriptions": {
    "en": "You prioritize direct government support...",
    "ta": "நீங்கள் குடும்பங்களுக்கான நேரடி அரசு ஆதரவு..."
  }
}
```

### Performance

- **Time Complexity**: O(A × D) where A = archetypes, D = dominant axes per archetype
- **Space Complexity**: O(A) for archetype score storage
- **Target**: < 50ms (part of the 200ms total scoring time budget)

The engine is designed for client-side execution with zero server cost.

---

## ExplanationEngine

**File:** `explanationEngine.ts`

The ExplanationEngine generates all user-facing explanation text dynamically from registries. It sources content from Party_Registry, Axis_Registry, and Archetype_Registry with **zero hardcoded strings**.

### Responsibilities

1. **Generate Primary Paragraph**: Explains the top party match with confidence interpretation
2. **Generate Secondary Insight**: Provides context about ambiguity, contradictions, or runner-up party
3. **Generate Belief Statements**: Creates 2-4 statements based on top axis scores
4. **Source Archetype Description**: Retrieves archetype description from Archetype_Registry
5. **Generate Track Record Notice**: Adds notice for promise-based parties (no governance track record)

### Usage

```typescript
import { ExplanationEngine } from '@/engines/explanationEngine';
import { ConfigLoader } from '@/lib/configLoader';
import type { ScoreResult } from '@/engines/explanationEngine';
import type { ArchetypeResult, Contradiction } from '@/engines/profilingEngine';

const loader = new ConfigLoader();
const config = loader.load();
const engine = new ExplanationEngine();

// Generate explanation
const result: ScoreResult = {
  partyScores: { DMK: 45, AIADMK: 35, TVK: 20 },
  rawScores: { DMK: 90, AIADMK: 70, TVK: 40 },
  axisScores: { welfare: 50, economy: 30, social_justice: 20 },
  confidenceScore: 'High',
  confidenceGap: 15,
  answeredCount: 25,
  skippedCount: 5,
  configVersion: '1.0.0'
};

const archetype: ArchetypeResult = {
  primary: 'security_seeker',
  isAmbiguous: false
};

const contradictions: Contradiction[] = [];

const explanation = engine.generate(result, archetype, contradictions, config, 'en');

console.log(explanation.primaryParagraph);
// "Your responses align most closely with Dravida Munnetra Kazhagam (45%). 
//  This high confidence match suggests a strong alignment between your policy 
//  preferences and this party's positions."

console.log(explanation.beliefStatements);
// ["You prioritize government support programs", 
//  "You prioritize economic growth & jobs",
//  "You prioritize social justice & reservation"]

console.log(explanation.archetypeDescription);
// "You prioritize direct government support and economic security for families..."
```

### Explanation Components

#### 1. Primary Paragraph

Format: `"Your responses align most closely with [Party Full Name] ([Score]%). This [confidence level] match suggests [confidence interpretation]."`

Confidence interpretations:
- **High**: "a strong alignment between your policy preferences and this party's positions"
- **Medium**: "a moderate alignment with this party, though other parties also share some of your priorities"
- **Low**: "your preferences are distributed across multiple parties, indicating a cross-ideological profile"

#### 2. Secondary Insight

Priority order:
1. **Ambiguous Archetype**: Mentions secondary archetype if `isAmbiguous: true`
2. **Contradictions**: Frames contradictions as nuanced perspective
3. **Runner-up Party**: Mentions second-place party with score
4. **Fallback**: Generic statement about thoughtful consideration

#### 3. Belief Statements

- Generated from top 2-4 axis scores
- Uses plain civic language labels from Axis_Registry
- Format: `"You prioritize [axis label]"`
- Minimum 2 statements guaranteed

#### 4. Archetype Description

- Sourced directly from Archetype_Registry
- Available in both English and Tamil
- No modification or summarization

#### 5. Track Record Notice

- Shown only when matched party has `weightBasis: "promise"`
- Explains that alignment is based on manifesto promises, not governance track record
- Format: `"Note: [Party]'s alignment is based on manifesto promises rather than governance track record, as this party has not held state-level power."`

### Bilingual Support

All text is generated in both English and Tamil:

```typescript
// English
const explanationEN = engine.generate(result, archetype, contradictions, config, 'en');

// Tamil
const explanationTA = engine.generate(result, archetype, contradictions, config, 'ta');
```

Example Tamil output:
```
"உங்கள் பதில்கள் திராவிட முன்னேற்றக் கழகம் (45%) உடன் மிக நெருக்கமாக ஒத்துப்போகின்றன. 
இந்த உயர் நம்பிக்கை பொருத்தம் உங்கள் கொள்கை விருப்பங்களுக்கும் இந்த கட்சியின் 
நிலைப்பாடுகளுக்கும் இடையே வலுவான ஒத்திசைவு உள்ளது என்பதைக் குறிக்கிறது."
```

### Edge Cases

#### Promise-Based Party Match (TVK)
```typescript
// TVK has weightBasis: "promise" in Party_Registry
const result: ScoreResult = {
  partyScores: { TVK: 50, DMK: 30, AIADMK: 20 },
  // ... other fields
};

const explanation = engine.generate(result, archetype, [], config, 'en');

console.log(explanation.trackRecordNotice);
// "Note: TVK's alignment is based on manifesto promises rather than 
//  governance track record, as this party has not held state-level power."
```

#### Ambiguous Archetype
```typescript
const archetype: ArchetypeResult = {
  primary: 'security_seeker',
  secondary: 'equity_builder',
  isAmbiguous: true
};

const explanation = engine.generate(result, archetype, [], config, 'en');

console.log(explanation.secondaryInsight);
// "Your profile also shows characteristics of a Equity Builder, 
//  indicating a multifaceted political perspective."
```

#### Contradictions Detected
```typescript
const contradictions: Contradiction[] = [
  {
    axis1: 'welfare',
    axis2: 'economy',
    score1: 50,
    score2: 48
  }
];

const explanation = engine.generate(result, archetype, contradictions, config, 'en');

console.log(explanation.secondaryInsight);
// "You show strong interest in both Government Support Programs and 
//  Economic Growth & Jobs, reflecting a nuanced perspective that bridges 
//  different ideological priorities."
```

### Testing

The engine has comprehensive test coverage:

- **Unit tests**: `tests/explanationEngine.test.ts`
  - Tests all explanation components
  - Tests bilingual generation (English and Tamil)
  - Tests track record notice for promise-based parties
  - Tests ambiguous archetype handling
  - Tests contradiction framing
  - Tests belief statement generation
  - Tests all confidence levels (High, Medium, Low)
  - Tests error handling (missing party, missing archetype)

- **Integration tests**: `tests/explanationEngine.integration.test.ts`
  - Tests with real config files
  - Verifies all three parties (DMK, AIADMK, TVK)
  - Tests all four archetypes
  - Tests all nine axes
  - Validates bilingual output quality
  - Ensures no hardcoded strings

Run tests:
```bash
npm test -- explanationEngine
```

### Design Principles

1. **Zero Hardcoding**: All text sourced from registries — no hardcoded strings
2. **Bilingual First**: Equal support for Tamil and English
3. **Registry-Driven**: Party names, axis labels, archetype descriptions all from config
4. **Type Safety**: Full TypeScript strict mode compliance
5. **Neutral Framing**: Contradictions framed as nuance, not errors
6. **Transparency**: Track record notice for promise-based parties

### Integration with Other Engines

The ExplanationEngine depends on:
- **ScoringEngine**: Uses party scores and axis scores
- **ProfilingEngine**: Uses archetype classification and contradictions
- **ConfigLoader**: Reads Party_Registry, Axis_Registry, Archetype_Registry

Future UI components will depend on ExplanationEngine:
- **ResultDashboard**: Will display explanation components
- **ExplanationPanel**: Will render primary paragraph and secondary insight
- **ArchetypeCard**: Will display archetype description
- **TrackRecordNotice**: Will conditionally show track record notice

### Configuration

The engine reads from three registries:

**Party_Registry** (`config/party-registry.json`):
```json
{
  "id": "TVK",
  "names": { "en": "TVK", "ta": "தவக" },
  "fullNames": { "en": "Tamilaga Vettri Kazhagam", "ta": "தமிழக வெற்றி கழகம்" },
  "weightBasis": "promise"  // Triggers track record notice
}
```

**Axis_Registry** (`config/axis-registry.json`):
```json
{
  "id": "welfare",
  "labels": { "en": "Government Support Programs", "ta": "அரசு நலத் திட்டங்கள்" }
}
```

**Archetype_Registry** (`config/archetype-registry.json`):
```json
{
  "id": "security_seeker",
  "names": { "en": "Security Seeker", "ta": "பாதுகாப்பு தேடுபவர்" },
  "descriptions": {
    "en": "You prioritize direct government support...",
    "ta": "நீங்கள் குடும்பங்களுக்கான நேரடி அரசு ஆதரவு..."
  }
}
```

### Performance

- **Time Complexity**: O(P + A) where P = parties, A = axes
- **Space Complexity**: O(1) for explanation generation
- **Target**: < 50ms (part of the 200ms total scoring time budget)

The engine is designed for client-side execution with zero server cost.

### Expert Panel Review

This implementation has been reviewed against the following expert perspectives:

- **Political Neutrality Auditor**: All text is registry-driven, no loaded language
- **Tamil Language Expert**: Bilingual support with proper Tamil translations
- **Algorithmic Fairness Researcher**: No party benefits from explanation framing
- **Behavioral Psychologist**: Contradictions framed as nuance, not errors
- **Misinformation Researcher**: Track record notice provides transparency
