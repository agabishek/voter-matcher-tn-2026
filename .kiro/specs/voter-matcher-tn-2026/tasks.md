# Implementation Tasks – Voter Matcher TN 2026

## Task List

- [x] 1. Project Scaffold & Config Layer
  - [x] 1.1 Initialize Next.js project with TypeScript, Tailwind CSS, and `next-intl` for i18n
  - [x] 1.2 Create `/config/` directory with all registry JSON files: `party-registry.json`, `axis-registry.json`, `archetype-registry.json`, `language-registry.json`, `scoring-params.json`
  - [x] 1.3 Create `/config/questions.json` with all 30 questions, bilingual text (Tamil + English), and Party_Weights for DMK, AIADMK, TVK across all 9 axes
  - [x] 1.4 Implement `ConfigLoader` class — loads all config files, computes sha256 hash of each, verifies against embedded hash field, throws on mismatch
  - [x] 1.5 Implement `ConfigProvider` React context — loads ConfigBundle at app startup and makes it available to all 
  
  - [x] 1.6 Write PBT: config integrity property — system must refuse to render if any config hash mismatches

- [x] 2. Core Engine — Scoring & Mapping
  - [x] 2.1 Implement `IdeologyMappingEngine` — validates question bank against Party_Registry and Axis_Registry, rejects questions with missing weights or unknown IDs
  - [x] 2.2 Implement `ScoringEngine.compute()` — sums Party_Weights per party, sums Axis_Weights per axis, handles zero-input edge case (equal split)
  - [x] 2.3 Implement `ScoringEngine.normalize()` — converts raw scores to percentages summing to 100, works for any N parties
  - [x] 2.4 Implement `ScoringEngine.computeConfidence()` — dynamic thresholds using formula `High = 100/N+12, Medium = 100/N+2`, works for any N ≥ 2
  - [x] 2.5 Write PBT: normalization invariant — `sum(scores) === 100` for all valid inputs
  - [x] 2.6 Write PBT: zero-input invariant — all-skipped session yields `100/N` per party
  - [x] 2.7 Write PBT: determinism — same answers + same config version → identical result
  - [x] 2.8 Write PBT: confidence monotonicity — higher gap → equal or higher confidence

- [x] 3. Core Engine — Profiling & Consistency
  - [x] 3.1 Implement `ProfilingEngine.classify()` — reads dominant axis mappings from Archetype_Registry, classifies user into primary + optional secondary archetype
  - [x] 3.2 Implement `ProfilingEngine.detectContradictions()` — uses axis independence pairs from Axis_Registry, returns contradictions framed as nuance not error
  - [x] 3.3 Write PBT: archetype independence — archetype classification never reads party scores directly
  - [x] 3.4 Write PBT: confidence downgrade — contradiction detection reduces confidence by exactly one level

- [x] 4. Core Engine — Explanation
  - [x] 4.1 Implement `ExplanationEngine.generate()` — sources all text from registries (party descriptions, axis civic labels, archetype descriptions), no hardcoded strings
  - [x] 4.2 Implement demographic context injection — when age group provided, surface 1–2 relevant policy highlights from matched party's manifesto data
  - [x] 4.3 Implement track-record notice — when matched party has `weightBasis: "promise"` in Party_Registry, append notice to explanation
  - [x] 4.4 Write PBT: language completeness — every string key present in all language files

- [x] 5. Questionnaire Engine & Session Management
  - [x] 5.1 Implement `QuestionnaireEngine.createSession()` — cluster-randomizes questions, pins config version to session
  - [x] 5.2 Implement session state management — answer recording, skip tracking, back navigation with pre-selection
  - [x] 5.3 Implement warning logic — axis-level skip warning + total skip threshold warning (reads threshold from scoring-params.json)
  - [x] 5.4 Implement localStorage persistence — save session on every answer, restore on reconnect, verify config hash before restoring, and clear all session data from localStorage when session ends (result viewed, tab closed, or navigation away)
  - [x] 5.5 Write PBT: cluster randomization — questions within each cluster appear together, cluster order varies across sessions

- [x] 6. API Routes
  - [x] 6.1 Implement `GET /api/config` — returns public-safe ConfigBundle subset (no question weights)
  - [x] 6.2 Implement `POST /api/score` — server-side scoring fallback, validates configVersion matches server's active version
  - [x] 6.3 Implement `POST /api/share` — generates HMAC-SHA256 signed share URL, enforces rate limiting
  - [x] 6.4 Implement `GET /api/methodology` — returns axis definitions, weight basis docs, audit log summary
  - [x] 6.5 Implement rate limiting middleware — scoring API and share API endpoints
  - [x] 6.6 Implement bot detection — minimum session duration check + honeypot field validation

- [x] 7. UI — Landing & Onboarding
  - [x] 7.1 Build `LandingScreen` — hero section, party pills (rendered from Party_Registry), stats (from scoring-params.json), bilingual toggle (from Language_Registry)
  - [x] 7.2 Build `OnboardingScreen` — how-it-works steps, estimated time (from config), privacy statement, optional demographic context form
  - [x] 7.3 Implement `LanguageProvider` — reads Language_Registry, persists preference in localStorage, switches all text without page reload

- [x] 8. UI — Questionnaire
  - [x] 8.1 Build `QuestionCard` — renders question text + options in active language, tap/swipe selection, keyboard navigation alternative
  - [x] 8.2 Build `ProgressBar` — reads session progress dynamically, shows axis cluster label
  - [x] 8.3 Build `AxisWarning` and `SkipWarning` components — non-blocking, neutral framing
  - [x] 8.4 Implement swipe gesture handler with keyboard/switch-access fallback (ARIA compliant)

- [x] 9. UI — Processing & Results
  - [x] 9.1 Build `ProcessingScreen` — animated steps, text from active language translation file
  - [x] 9.2 Build `PartyMatchCards` — renders one card per party from Party_Registry, text + bar format (no color-only differentiation)
  - [x] 9.3 Build `AxisBreakdown` — renders one row per axis from Axis_Registry using plain civic language labels
  - [x] 9.4 Build `ArchetypeCard` — reads description from Archetype_Registry for active language
  - [x] 9.5 Build `ConfidencePanel` — label + plain-language explanation
  - [x] 9.6 Build `ExplanationPanel` — primary paragraph, secondary insight, belief tags
  - [x] 9.7 Build `ConsistencyNotice` — shown only when contradictions detected, framed as nuance
  - [x] 9.8 Build `TrackRecordNotice` — shown when matched party has promise-based weights
  - [x] 9.9 Build `SharePanel` — calls `/api/share`, renders share card preview, copy link button

- [x] 10. Share Card Generator
  - [x] 10.1 Implement `ShareCardService` — generates monochrome PNG with text-only party labels, disclaimer, verify URL
  - [x] 10.2 Implement HMAC-SHA256 URL signing and verification
  - [x] 10.3 Enforce anti-misinformation rules in generator — no party colors, no logos, disclaimer always visible

- [x] 11. Manifesto & Config Update Tooling
  - [x] 11.1 Build CLI script `scripts/update-manifesto.ts` — accepts new manifesto JSON, recomputes Party_Weights, updates questions.json, recomputes hashes, writes audit log entry
  - [x] 11.2 Build CLI script `scripts/add-party.ts` — adds party to Party_Registry, scaffolds Party_Weight fields in all questions, prompts operator to fill weights
  - [x] 11.3 Build CLI script `scripts/add-language.ts` — adds language to Language_Registry, scaffolds translation file with all existing keys, marks untranslated strings
  - [x] 11.4 Build CLI script `scripts/validate-config.ts` — runs all validation checks (hash, collinearity, discriminating power, language completeness) and reports results
  - [x] 11.5 Implement audit log writer — appends timestamped entry on every config change with previous/new version and changed fields

- [x] 12. Analytics (Optional)
  - [x] 12.1 Implement aggregated analytics collector — completion rate, answer distributions, party match distributions, archetype distributions, confidence distributions
  - [x] 12.2 Ensure no session-level identifiers in any analytics record
  - [x] 12.3 Build pre-session analytics disclosure component — shown only when analytics enabled

- [x] 13. Accessibility & Performance
  - [x] 13.1 Add ARIA labels to all interactive elements in both Tamil and English
  - [x] 13.2 Implement `lang` attribute switching on `<html>` element when language changes
  - [x] 13.3 Load Noto Sans Tamil and Inter fonts with `font-display: swap`
  - [x] 13.4 Implement client-side fallback scoring — cache question bank + scoring logic in service worker for offline/backend-down scenarios
  - [x] 13.5 Run Lighthouse performance audit — verify 4G load < 1s, scoring < 200ms

- [x] 14. Legal & Launch Readiness
  - [x] 14.1 Implement `GET /api/config/inspect` — authenticated operator endpoint returning active config versions
  - [x] 14.2 Build methodology page — renders axis definitions, weight basis documentation, audit log, disclaimer
  - [x] 14.3 Legal review checkpoint — disclaimer text, RPA/MCC compliance, DPDPA compliance (operator action, not code)
  - [x] 14.4 Independent weight audit checkpoint — domain expert review of Party_Weights (operator action, not code)
  - [x] 14.5 Run `scripts/validate-config.ts` — all checks must pass before launch
