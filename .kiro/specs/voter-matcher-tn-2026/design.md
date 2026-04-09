    # Design Document – Voter Matcher TN 2026

## Overview

The Voter Matcher is a fully data-driven, modular web application. Every party, axis, archetype, language, question, and scoring parameter is externalized as versioned configuration. The application code contains zero hardcoded political content — it is a generic engine that renders whatever the Config Layer defines.

This design uses **Next.js** (frontend + API routes), a **JSON-based Config Layer** (versioned, hash-verified), and **client-side scoring** with a server-side fallback API. All modules communicate through well-defined interfaces so any module can be swapped or extended independently.

**Cost philosophy:** The system is designed for near-zero infrastructure cost. Scoring runs entirely in the browser — the server does almost nothing. All config is static JSON served by Vercel's free CDN. The only paid infrastructure is optional analytics storage (SQLite via Turso free tier). Total estimated monthly cost: **$0–$5**.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     BROWSER                             │
│  Next.js App (React + TypeScript)                       │
│  Landing → Onboarding → Questionnaire → Results         │
│                                                         │
│  ALL SCORING RUNS HERE (client-side, zero server cost)  │
│  Scoring · Profiling · Explanation · Consistency        │
│  Share card generated via Canvas API (no server)        │
│                                                         │
│  Config JSON loaded once at startup (~50KB, cached)     │
└─────────────────────────────────────────────────────────┘
         │ HTTPS (TLS 1.3) — only for rare fallback cases
┌─────────────────────────────────────────────────────────┐
│         VERCEL (Free/Hobby tier — ~$0/month)            │
│                                                         │
│  Static assets + config JSON served via Vercel CDN      │
│  Next.js API Routes (serverless, cold-start only):      │
│    POST /api/score    – fallback scoring (rarely called) │
│    POST /api/share    – HMAC sign URL (lightweight)      │
│    GET  /api/methodology – static methodology data      │
│                                                         │
│  Rate limiting: Vercel Edge Middleware (free, built-in) │
└─────────────────────────────────────────────────────────┘
         │ (optional — only if analytics enabled)
┌─────────────────────────────────────────────────────────┐
│  Turso (SQLite, free tier — $0/month up to 500 DB/mo)   │
│  Aggregated analytics only. No PII. 3 tables.           │
│  Audit log: Git commits (free — config is in repo)      │
└─────────────────────────────────────────────────────────┘
```

### Cost Breakdown

| Component | Solution | Monthly Cost |
|---|---|---|
| Hosting + CDN | Vercel Free/Hobby | $0 |
| Config file serving | Vercel static CDN (included) | $0 |
| API routes (fallback) | Vercel serverless (100K invocations free) | $0 |
| Rate limiting | Vercel Edge Middleware (free) | $0 |
| Analytics DB | Turso SQLite free tier | $0 |
| Audit log | Git commits in repo | $0 |
| Share card generation | Client-side Canvas API | $0 |
| **Total** | | **$0–$5/month** |

---

## Config Layer Design

All configuration lives in `/config/` and is loaded at build time (static) with runtime hash verification.

### `/config/party-registry.json`
```json
{
  "version": "1.0.0",
  "hash": "<sha256>",
  "parties": [
    {
      "id": "DMK",
      "names": { "en": "DMK", "ta": "திமுக" },
      "fullNames": {
        "en": "Dravida Munnetra Kazhagam",
        "ta": "திராவிட முன்னேற்றக் கழகம்"
      },
      "governanceStatus": "incumbent",
      "weightBasis": "track-record",
      "manifestoVersion": "dmk-2026-v1",
      "active": true
    }
  ]
}
```

### `/config/axis-registry.json`
```json
{
  "version": "1.0.0",
  "hash": "<sha256>",
  "axes": [
    {
      "id": "welfare",
      "labels": { "en": "Government Support Programs", "ta": "அரசு நலத் திட்டங்கள்" },
      "technicalName": { "en": "Welfare", "ta": "நலன்புரி" },
      "archetypeMapping": ["security_seeker"],
      "independentPairs": ["economy", "corruption"]
    }
  ]
}
```

### `/config/archetype-registry.json`
```json
{
  "version": "1.0.0",
  "hash": "<sha256>",
  "archetypes": [
    {
      "id": "security_seeker",
      "names": { "en": "Security Seeker", "ta": "பாதுகாப்பு தேடுபவர்" },
      "dominantAxes": ["welfare", "poverty"],
      "ambiguityThreshold": 0.10,
      "descriptions": {
        "en": "You prioritize direct government support and economic security for families. You believe the state's primary role is to protect citizens from hardship.",
        "ta": "நீங்கள் குடும்பங்களுக்கான நேரடி அரசு ஆதரவு மற்றும் பொருளாதார பாதுகாப்பை முன்னுரிமை அளிக்கிறீர்கள்."
      }
    }
  ]
}
```

### `/config/language-registry.json`
```json
{
  "version": "1.0.0",
  "hash": "<sha256>",
  "defaultLanguage": "ta",
  "languages": [
    {
      "code": "ta",
      "name": "தமிழ்",
      "fontStack": "'Noto Sans Tamil', sans-serif",
      "minFontSize": 16,
      "direction": "ltr",
      "translationPath": "/locales/ta"
    },
    {
      "code": "en",
      "name": "English",
      "fontStack": "'Inter', sans-serif",
      "minFontSize": 14,
      "direction": "ltr",
      "translationPath": "/locales/en"
    }
  ]
}
```

### `/config/scoring-params.json`
```json
{
  "version": "1.0.0",
  "hash": "<sha256>",
  "questionCount": 30,
  "optionsPerQuestion": 3,
  "weightRange": { "min": 0, "max": 5 },
  "minAnsweredThreshold": 0.5,
  "collinearityThreshold": 0.70,
  "discriminatingPowerThreshold": 1.0,
  "confidenceFormula": "dynamic",
  "estimatedCompletionMinutes": 3,
  "performanceTargets": {
    "loadTime4G": 1000,
    "loadTime2G": 3000,
    "scoringTime": 200,
    "concurrentUsers": 100000
  },
  "disclaimerText": {
    "en": "These results reflect your stated policy preferences and are not a voting recommendation. This tool is independent and not affiliated with any political party.",
    "ta": "இந்த முடிவுகள் உங்கள் கொள்கை விருப்பங்களை மட்டுமே பிரதிபலிக்கின்றன. இது வாக்களிக்க பரிந்துரை அல்ல. எந்த கட்சியுடனும் தொடர்பில்லை."
  }
}
```

### `/config/questions.json` (structure)
```json
{
  "version": "1.0.0",
  "hash": "<sha256>",
  "questions": [
    {
      "id": "q001",
      "cluster": "welfare",
      "text": {
        "en": "If the government has a limited budget, what should be the priority?",
        "ta": "அரசாங்கத்திடம் வரையறுக்கப்பட்ட நிதி இருந்தால், முன்னுரிமை என்னவாக இருக்க வேண்டும்?"
      },
      "options": [
        {
          "id": "q001_a",
          "text": {
            "en": "Give cash directly to families in need",
            "ta": "தேவைப்படும் குடும்பங்களுக்கு நேரடியாக பணம் வழங்கு"
          },
          "partyWeights": { "DMK": 2, "AIADMK": 4, "TVK": 3 },
          "axisWeights": { "welfare": 4, "poverty": 3 }
        }
      ]
    }
  ]
}
```

---

## Module Designs

### 1. Config Loader

**Responsibility:** Load, verify, and serve all config files at startup.

```typescript
interface ConfigBundle {
  parties: PartyRegistry;
  axes: AxisRegistry;
  archetypes: ArchetypeRegistry;
  languages: LanguageRegistry;
  questions: QuestionBank;
  scoringParams: ScoringParams;
  version: string;
  loadedAt: string;
}

class ConfigLoader {
  load(): ConfigBundle          // loads + verifies all hashes, throws on mismatch
  verify(file, hash): boolean   // sha256 verification
  getVersion(): string          // returns composite version string
}
```

**Hash verification:** On startup, each config file's sha256 is computed and compared against the `hash` field in the file itself. Mismatch = startup failure with error log.

---

### 2. Questionnaire Engine

**Responsibility:** Present questions, track answers, handle navigation and skipping.

```typescript
interface Session {
  id: string;
  questions: Question[];        // cluster-randomized at session start
  answers: Map<string, string>; // questionId → optionId
  skipped: Set<string>;
  startedAt: number;
  language: string;
}

class QuestionnaireEngine {
  createSession(config: ConfigBundle, lang: string): Session
  selectOption(session: Session, questionId: string, optionId: string): Session
  skipQuestion(session: Session, questionId: string): Session
  navigateBack(session: Session, questionId: string): Session
  getProgress(session: Session): { current: number; total: number; pct: number }
  isComplete(session: Session): boolean
  getWarnings(session: Session): Warning[]  // axis-level + total skip warnings
}
```

**Cluster randomization:** Questions are grouped by their `cluster` field. Cluster order is randomized; within each cluster, question order is randomized. This prevents global positional bias while keeping topically related questions together.

---

### 3. Scoring Engine

**Responsibility:** Compute party scores, axis scores, and confidence score from a completed session.

```typescript
interface ScoreResult {
  partyScores: Record<string, number>;      // partyId → normalized %
  rawScores: Record<string, number>;        // partyId → raw sum
  axisScores: Record<string, number>;       // axisId → sum
  confidenceScore: 'High' | 'Medium' | 'Low';
  confidenceGap: number;
  answeredCount: number;
  skippedCount: number;
  configVersion: string;
}

class ScoringEngine {
  compute(session: Session, config: ConfigBundle): ScoreResult
  normalize(raw: Record<string, number>): Record<string, number>
  computeConfidence(scores: Record<string, number>, partyCount: number): ConfidenceResult
  // Confidence thresholds derived dynamically: High = 100/N+12, Medium = 100/N+2
}
```

**Edge case:** If all raw scores are 0, assign 100/N to each party and return Low confidence.

---

### 4. Ideology Mapping Engine

**Responsibility:** Validate question bank against registries, emit weights on option selection.

```typescript
class IdeologyMappingEngine {
  validate(questions: QuestionBank, config: ConfigBundle): ValidationResult
  // Checks: all party IDs exist in registry, all axis IDs exist in registry,
  // no missing weights, collinearity check, discriminating power check
  
  getWeights(optionId: string, questions: QuestionBank): WeightEmission
  // Returns { partyWeights: {...}, axisWeights: {...} }
  
  checkCollinearity(questions: QuestionBank, axes: string[]): CollinearityReport
  checkDiscriminatingPower(questions: QuestionBank, parties: string[]): PowerReport
}
```

---

### 5. Profiling Engine

**Responsibility:** Classify user into an archetype and detect consistency issues.

```typescript
class ProfilingEngine {
  classify(axisScores: Record<string, number>, config: ConfigBundle): ArchetypeResult
  // Reads dominant axis mappings from Archetype_Registry
  // Returns primary + optional secondary archetype

  detectContradictions(session: Session, config: ConfigBundle): Contradiction[]
  // Uses axis independence pairs from Axis_Registry
  // Returns list of detected contradictions (framed as nuance, not error)
}

interface ArchetypeResult {
  primary: string;              // archetypeId
  secondary?: string;           // archetypeId if ambiguous
  isAmbiguous: boolean;
}
```

---

### 6. Explanation Engine

**Responsibility:** Generate all user-facing explanation text dynamically from registries.

```typescript
class ExplanationEngine {
  generate(result: ScoreResult, archetype: ArchetypeResult, 
           config: ConfigBundle, lang: string): Explanation
  
  // Sources: party descriptions from Party_Registry,
  //          axis labels from Axis_Registry (plain civic language),
  //          archetype descriptions from Archetype_Registry
  // No explanation text is hardcoded
}

interface Explanation {
  primaryParagraph: string;
  secondaryInsight: string;
  beliefStatements: string[];   // 2-4 items
  archetypeDescription: string;
  trackRecordNotice?: string;   // shown if matched party is promise-based only
}
```

---

### 7. Share Card Service

**Responsibility:** Generate tamper-proof, misinformation-resistant share cards **entirely client-side** using the Canvas API. No server PNG generation — zero cost.

```typescript
class ShareCardService {
  generateCanvas(result: ScoreResult, archetype: ArchetypeResult,
                 lang: string, config: ConfigBundle): HTMLCanvasElement
  // Renders monochrome PNG via Canvas API in browser — no server call
  
  sign(payload: string, secret: string): string   // HMAC-SHA256 via Web Crypto API
  verify(url: string, secret: string): boolean
  toDataURL(canvas: HTMLCanvasElement): string     // base64 PNG for download/share
}
```

**Why client-side Canvas:** Eliminates the most expensive server operation. Web Crypto API provides HMAC-SHA256 natively in all modern browsers. The signed URL is generated client-side using a public signing key — the server only needs to verify, not generate.

---

## Data Flow

```
User answers question
        ↓
QuestionnaireEngine.selectOption()
        ↓
Session updated in React state + localStorage
        ↓
On completion → ScoringEngine.compute()
        ↓
ProfilingEngine.classify() + detectContradictions()
        ↓
ExplanationEngine.generate()
        ↓
Result assembled → Result_Dashboard rendered
        ↓
User shares → ShareCardService.generate() → signed URL
```

---

## Manifesto Update Flow

```
Operator uploads new manifesto
        ↓
New questions.json generated with updated Party_Weights
        ↓
New hash computed and embedded in file
        ↓
ConfigLoader.verify() passes
        ↓
IdeologyMappingEngine.validate() runs collinearity + power checks
        ↓
Audit log entry written: { timestamp, previousVersion, newVersion, changedWeights }
        ↓
New sessions use updated weights
In-progress sessions complete with previous weights (version pinned to session)
```

---

## Add New Party Flow

```
Add party entry to party-registry.json
        ↓
Add Party_Weights for new party to all questions in questions.json
        ↓
Update hashes in both files
        ↓
ConfigLoader picks up new party at next startup
        ↓
ScoringEngine automatically includes new party in normalization
        ↓
Result_Dashboard automatically renders new party card
        ↓
Confidence thresholds auto-recalculate: High = 100/N+12, Medium = 100/N+2
```

---

## Add New Language Flow

```
Add language entry to language-registry.json
        ↓
Create /locales/{code}/ translation files
        ↓
Add translated text to all questions in questions.json
        ↓
Add translated descriptions to axis-registry, archetype-registry, party-registry
        ↓
Language toggle on UI automatically shows new language (reads Language_Registry)
        ↓
No code changes required
```

---

## Frontend Component Architecture

```
App
├── ConfigProvider          – loads + provides ConfigBundle via React context
├── LanguageProvider        – active language, toggle, reads Language_Registry
├── SessionProvider         – session state, localStorage sync
│
├── LandingScreen
├── OnboardingScreen
├── QuestionnaireScreen
│   ├── ProgressBar         – reads session.progress
│   ├── QuestionCard        – renders question + options from config
│   └── AxisWarning         – shown when axis cluster fully skipped
├── ProcessingScreen
└── ResultDashboard
    ├── PartyMatchCards     – renders N cards from Party_Registry
    ├── ConfidencePanel
    ├── ArchetypeCard       – reads Archetype_Registry
    ├── AxisBreakdown       – renders N axes from Axis_Registry
    ├── ExplanationPanel
    ├── ConsistencyNotice   – shown if contradictions detected
    ├── TrackRecordNotice   – shown if matched party is promise-based
    └── SharePanel
```

**Key principle:** Every component that renders party, axis, or archetype data reads from the ConfigBundle context — never from hardcoded arrays or strings.

---

## API Routes

### `GET /api/config`
Returns the current ConfigBundle (without question weights — public-safe subset).
Served as a static JSON file via Vercel CDN — no serverless invocation needed.

### `POST /api/score`
Server-side scoring fallback when client-side fails. Called rarely — only on client errors.
Vercel serverless function, cold-start acceptable since this is a fallback path.

### `POST /api/share`
Generates a signed share URL (HMAC-SHA256). Lightweight — just signs a payload string.
Share card PNG is generated client-side via Canvas API — this route only signs the URL.

### `GET /api/methodology`
Returns the public methodology page data. Served as static JSON — no serverless invocation.

## Analytics Storage (Optional)

If analytics are enabled, use **Turso** (SQLite at the edge, free tier: 500 databases, 1B row reads/month):

```typescript
// Turso client — replaces PostgreSQL entirely
import { createClient } from '@libsql/client'
const db = createClient({ url: process.env.TURSO_URL, authToken: process.env.TURSO_TOKEN })

// Same 3 tables as designed, but SQLite syntax
// analytics_sessions, analytics_answers, analytics_results
// config_audit_log → replaced by Git commit history (free)
```

**Why Turso over PostgreSQL:**
- Free tier covers the entire election period
- SQLite is sufficient for append-only aggregated analytics
- No managed database cost (~$25/month saved)
- Edge-native — low latency from Vercel functions

---

## Correctness Properties (for PBT)

1. **Normalization invariant:** `sum(partyScores.values()) === 100` for all non-zero inputs
2. **Zero-input invariant:** When all answers skipped, each party score = `100/N` exactly
3. **Determinism:** Same answers + same config version → identical ScoreResult always
4. **Confidence monotonicity:** Higher score gap → equal or higher confidence level
5. **Archetype independence:** Archetype classification never directly reads party scores
6. **Weight range invariant:** No Party_Weight or Axis_Weight outside configured [min, max]
7. **Party count scaling:** Confidence thresholds satisfy `High > Medium > Low` for all N ≥ 2
8. **Config integrity:** System refuses to start if any config file hash mismatches
9. **Share card integrity:** A share URL with tampered payload fails verification
10. **Language completeness:** For every string key in any language file, all other language files contain the same key
