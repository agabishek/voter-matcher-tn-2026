# Coding Standards – Voter Matcher TN 2026

This document defines the coding standards for all implementation work on this project. Apply these rules to every file you create or modify.

---

## TypeScript

- Strict mode is enabled (`"strict": true` in tsconfig). Never use `any` — use `unknown` and narrow with type guards.
- Prefer `interface` for object shapes, `type` for unions/intersections/aliases.
- All functions must have explicit return types.
- Use `readonly` for arrays and object properties that should not be mutated.
- Avoid non-null assertions (`!`). Use optional chaining (`?.`) and nullish coalescing (`??`) instead.
- Enums are forbidden — use `as const` objects with a derived type instead.

```ts
// Good
const CONFIDENCE = { High: 'High', Medium: 'Medium', Low: 'Low' } as const;
type Confidence = typeof CONFIDENCE[keyof typeof CONFIDENCE];

// Bad
enum Confidence { High, Medium, Low }
```

---

## Naming Conventions

| Construct | Convention | Example |
|---|---|---|
| Files (components) | PascalCase | `QuestionCard.tsx` |
| Files (utilities/engines) | camelCase | `scoringEngine.ts` |
| Files (config/data) | kebab-case | `party-registry.json` |
| React components | PascalCase | `PartyMatchCards` |
| Classes | PascalCase | `ScoringEngine` |
| Functions / methods | camelCase | `computeConfidence()` |
| Variables / params | camelCase | `partyScores` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_WEIGHT` |
| Types / Interfaces | PascalCase | `ScoreResult`, `ConfigBundle` |
| Translation keys | `module.component.key` | `questionnaire.progress.label` |

---

## React & Next.js

- All components must be functional — no class components.
- Co-locate component-specific types in the same file; shared types go in `types/`.
- Never hardcode strings in JSX — all user-facing text must come from `next-intl` translation files.
- Never hardcode party names, axis IDs, archetype IDs, or party counts — always read from `ConfigBundle` via context.
- Use `useConfig()` hook to access `ConfigBundle`; use `useTranslations()` for i18n strings.
- Server Components are the default; add `'use client'` only when you need browser APIs or React state/effects.
- Keep `page.tsx` files thin — delegate rendering to named components.

---

## File & Folder Structure

```
voter-matcher/
  app/                  # Next.js App Router pages and layouts
  components/           # Reusable UI components (PascalCase filenames)
  engines/              # Core logic: ScoringEngine, ProfilingEngine, etc.
  config/               # JSON config files (versioned, hash-verified)
  lib/                  # Shared utilities (configLoader, hmac, etc.)
  locales/              # Translation files: /en/*.json, /ta/*.json
  scripts/              # CLI tooling scripts
  tests/                # Vitest unit + PBT tests
  types/                # Shared TypeScript interfaces and types
```

---

## i18n Rules

- Default language is Tamil (`ta`). English (`en`) is secondary.
- Every new string must be added to **both** `/locales/en/` and `/locales/ta/` files simultaneously.
- No hardcoded English strings anywhere in JSX or engine output.
- Translation key format: `module.component.key` (e.g., `result.confidence.high`).
- Tamil minimum font size: 16px. Never use fixed-width containers that clip Tamil text.

---

## Testing

- Test files live in `tests/` and follow the naming pattern `*.test.ts` or `*.pbt.ts`.
- Every engine module (`ScoringEngine`, `ProfilingEngine`, etc.) must have a corresponding test file.
- PBT tests use `fast-check`. Property names must describe the invariant being tested.
- Unit tests must cover edge cases: all-skipped session, single-party, N-party scaling.
- Run tests with `npm test` (single run via `vitest --run`).

---

## Config Integrity

- Never modify a config JSON file without recomputing its `hash` field.
- Use `scripts/validate-config.ts` to verify all hashes before committing.
- Config files are the source of truth — application code must never duplicate their data.

---

## Code Quality

- No `console.log` in production code — use structured error throwing or a logger utility.
- Functions must do one thing. If a function exceeds ~40 lines, consider splitting it.
- Avoid deeply nested conditionals — use early returns and guard clauses.
- All `async` functions must handle errors explicitly (try/catch or `.catch()`).
- No commented-out code in committed files.

---

## Review Checklist (before marking any task complete)

- [ ] No `any` types introduced
- [ ] All new strings added to both `/locales/en/` and `/locales/ta/`
- [ ] No hardcoded party names, axis IDs, or counts
- [ ] Config hash updated if any config file was modified
- [ ] Corresponding test file updated or created
- [ ] `npm run lint` passes with zero errors
- [ ] `npm test` passes
