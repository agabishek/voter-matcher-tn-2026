---
inclusion: always
---

# Bilingual Support – Tamil & English (i18n)

This project MUST support both Tamil (ta) and English (en) throughout — UI, content, data, and code. Tamil is the primary language for the target voter demographic. English is the secondary language for urban and digitally fluent users.

Every requirement, design decision, and implementation task must account for both languages. Never design or build a feature assuming English-only.

---

## Language Strategy

- Default language: Tamil (ta) — shown first to all users
- Secondary language: English (en) — user can switch at any time
- Language preference is stored in browser localStorage (no account required)
- Language switch must be available on every screen, including mid-questionnaire
- Switching language mid-session must NOT reset answers or progress

---

## Content Requirements

### Questions & Options
- All 30 questions must have Tamil and English versions
- Option texts must be translated — not just transliterated
- Translations must be politically neutral and semantically equivalent
- Tamil text must use standard written Tamil (எழுத்து தமிழ்), not colloquial/spoken forms
- Reading level: accessible to a voter with 8th grade Tamil literacy

### Archetypes & Explanations
- All three archetype names must have Tamil equivalents:
  - Security Seeker → பாதுகாப்பு தேடுபவர்
  - Equity Builder → சமத்துவ கட்டுநர்
  - System Reformer → அமைப்பு சீர்திருத்தவாதி
- All explanation engine output must be available in both languages
- Belief statements on the result screen must be translated, not auto-generated from English

### UI Labels & Navigation
- Every button, label, heading, tooltip, error message, and placeholder must exist in both languages
- No hardcoded English strings anywhere in the codebase
- All strings must be externalized into translation files

### Party Names
- DMK, AIADMK, TVK are proper nouns — keep as-is in both languages
- Party full names in Tamil:
  - DMK → திராவிட முன்னேற்றக் கழகம்
  - AIADMK → அனைத்திந்திய அண்ணா திராவிட முன்னேற்றக் கழகம்
  - TVK → தமிழக வெற்றி கழகம்

---

## Technical Requirements

### i18n Framework
- Use a standard i18n library appropriate for the stack:
  - Next.js: `next-i18next` or `next-intl`
  - React (standalone): `react-i18next`
- All translation keys must follow a consistent naming convention: `module.component.key`
  - Example: `questionnaire.progress.label`, `result.archetype.description`

### Translation File Structure
```
/locales
  /en
    common.json
    questionnaire.json
    result.json
    explanation.json
  /ta
    common.json
    questionnaire.json
    result.json
    explanation.json
```

### Question Data Model
Every question object must include both language versions:
```json
{
  "id": 1,
  "question": {
    "en": "If the government has a limited budget...",
    "ta": "அரசாங்கத்திடம் வரையறுக்கப்பட்ட நிதி இருந்தால்..."
  },
  "options": [
    {
      "text": {
        "en": "Give cash directly to families",
        "ta": "குடும்பங்களுக்கு நேரடியாக பணம் வழங்கு"
      },
      "weights": { "AIADMK": 3, "DMK": 0, "TVK": 0 },
      "axis": { "welfare": 3 }
    }
  ]
}
```

### Font Support
- Tamil font: Use `Noto Sans Tamil` (Google Fonts) — covers full Unicode Tamil range
- English font: Use `Inter` or `Noto Sans`
- Both fonts must be loaded with `font-display: swap` for performance
- Minimum Tamil font size: 16px (Tamil script is less legible at small sizes)

### Text Direction & Layout
- Both Tamil and English are LTR — no RTL handling needed
- Tamil text is typically 20–30% longer than equivalent English — all UI containers must handle text overflow gracefully
- Do not use fixed-width containers that clip Tamil text
- Test all screens with Tamil text before finalizing layout

### Accessibility
- `lang` attribute on `<html>` must reflect the active language (`lang="ta"` or `lang="en"`)
- Screen reader support must work for both languages
- Tamil voice-over support is a stretch goal but should not be blocked by architecture

---

## Review Checklist (apply to every change)

Before marking any task complete, verify:

- [ ] All new strings are added to both `/locales/en/` and `/locales/ta/` files
- [ ] No hardcoded English strings exist in the changed code
- [ ] Tamil translations have been reviewed by the Tamil Language Expert (see expert-panel.md)
- [ ] UI layout tested with Tamil text (longer strings, larger font)
- [ ] Language switch does not break the changed feature
- [ ] Question data includes both `en` and `ta` fields if question content was modified

---

## Out of Scope (for now)
- Other Indian languages (Hindi, Telugu, etc.) — future enhancement
- Right-to-left language support
- Audio/voice narration in Tamil (stretch goal, not blocking)
