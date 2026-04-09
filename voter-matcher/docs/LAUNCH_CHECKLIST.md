# Launch Checklist — Voter Matcher TN 2026

## Pre-Launch Operator Actions

### Legal Review (Task 14.3)
- [ ] Disclaimer text reviewed by legal counsel
- [ ] RPA (Representation of the People Act) compliance verified — tool does not constitute political advertising or voter influence
- [ ] MCC (Model Code of Conduct) compliance verified — no content that could be flagged as election interference
- [ ] DPDPA (Digital Personal Data Protection Act) compliance verified — no PII collected, anonymous mode confirmed
- [ ] IT Act compliance reviewed — no content liability risks

### Independent Weight Audit (Task 14.4)
- [ ] Domain expert has reviewed all Party_Weights in `config/questions.json`
- [ ] Weights verified against published manifesto documents
- [ ] No structural bias detected in weight distribution across parties
- [ ] Weight basis (track-record vs promise) correctly assigned per party in `config/party-registry.json`
- [ ] Audit findings documented and signed off

### Config Validation (Task 14.5)
- [ ] `npx tsx scripts/validate-question-bank.ts` passes all checks
- [ ] All config file hashes verified via `npx tsx scripts/compute-hashes.ts`
- [ ] Config versions confirmed via `GET /api/config/inspect` (authenticated)

### Final Checks
- [ ] Methodology page (`/methodology`) renders correctly in both Tamil and English
- [ ] Disclaimer visible on result screen and methodology page
- [ ] Share cards include disclaimer text
- [ ] All 30 questions have bilingual text
- [ ] Lighthouse performance audit completed
