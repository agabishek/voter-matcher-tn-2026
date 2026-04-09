# Requirements Document

## Introduction

The Voter Matcher System is a web-based political alignment tool designed for Tamil Nadu Election 2026. It helps voters discover which registered party best aligns with their personal belief system through a structured questionnaire mapped to ideological axes.

The system is designed to be **fully data-driven and modular** — parties, axes, archetypes, questions, languages, and scoring parameters are all externalized as configuration. No part of the system shall hardcode party names, party count, axis definitions, question count, archetype definitions, or supported languages. All such parameters are loaded at runtime from versioned configuration files, enabling the system to be extended to new elections, new parties, new regions, and new languages without code changes.

The system supports high-traffic public use (configurable concurrency target), requires no personal data storage by default, and must be perceived as politically neutral and transparent.

---

## Glossary

- **Voter_Matcher**: The overall system described in this document.
- **Party_Registry**: A versioned configuration file listing all active parties, their metadata, and their governance status. The system derives all party-related behavior from this registry — no party names or counts are hardcoded.
- **Axis_Registry**: A versioned configuration file listing all active Ideological_Axes, their definitions, plain-language labels (per language), and their archetype mappings. The system derives all axis-related behavior from this registry.
- **Archetype_Registry**: A versioned configuration file listing all active Archetypes, their dominant axis mappings, descriptions (per language), and classification thresholds.
- **Language_Registry**: A versioned configuration file listing all supported languages, their locale codes, font requirements, and text direction. Adding a new language requires only adding an entry here and providing translation files.
- **Manifesto_Version**: A timestamped, hash-verified snapshot of a party's policy positions used to derive Party_Weights. Each party in the Party_Registry references a specific Manifesto_Version.
- **Questionnaire_Engine**: The module responsible for presenting questions to the user sequentially. It reads question count, option count, and cluster structure from configuration.
- **Scoring_Engine**: The module that computes cumulative and normalized party scores. It reads party list, weight ranges, and confidence thresholds from configuration — never from hardcoded values.
- **Ideology_Mapping_Engine**: The module that maps each answer to ideological axis weights. It reads axis definitions from the Axis_Registry.
- **Explanation_Engine**: The module that generates human-readable text explaining the user's result. It reads party descriptions, axis labels, and archetype descriptions from configuration per active language.
- **Profiling_Engine**: The module that classifies the user into a psychological archetype. It reads archetype definitions and thresholds from the Archetype_Registry.
- **Confidence_Score**: A numeric measure (Low / Medium / High) of alignment strength, computed using a formula that dynamically adjusts based on the number of active parties in the Party_Registry.
- **Ideological_Axis**: A dimension of political belief defined in the Axis_Registry. The system supports any number of axes; the current deployment uses nine.
- **Archetype**: A psychological voter profile defined in the Archetype_Registry. The system supports any number of archetypes; the current deployment uses four.
- **Party**: A political entity registered in the Party_Registry. The system supports any number of parties; the current deployment uses three.
- **Question**: A single item in the questionnaire containing a prompt (in all supported languages) and a configurable number of options.
- **Option**: A selectable answer to a Question, carrying Party_Weights for all registered parties and Axis_Weights for all registered axes.
- **Party_Weight**: A numeric value within the configured weight range assigned to an Option indicating alignment with a given Party.
- **Axis_Weight**: A numeric value within the configured weight range assigned to an Option indicating contribution to a given Ideological_Axis.
- **Consistency_Detector**: The sub-module within the Profiling_Engine that identifies contradictory response patterns using axis-pair independence rules defined in configuration.
- **Anonymous_Mode**: An operational mode in which no user-identifying data is stored or transmitted.
- **Result_Dashboard**: The UI screen that displays party match percentages, archetype, confidence score, and explanation text — all rendered dynamically from the active party and axis registries.
- **Progress_Indicator**: A UI element showing the user how many questions remain.
- **Session**: A single user's interaction from questionnaire start to result display.
- **Onboarding_Screen**: A pre-questionnaire screen that explains the tool's purpose, estimated time, and how results are generated.
- **Share_Card**: A shareable image or link generated from the result screen, containing match percentages, archetype, disclaimer, and methodology link.
- **Config_Layer**: The collective set of versioned, externalized configuration files (Party_Registry, Axis_Registry, Archetype_Registry, Language_Registry, question bank, scoring parameters) that drive all system behavior.

---

## Requirements

### Requirement 0: Configuration Layer (Modularity Foundation)

**User Story:** As a system operator, I want all parties, axes, archetypes, languages, and scoring parameters to be externalized as versioned configuration, so that I can add a new party, update a manifesto, add a language, or change scoring thresholds without touching application code.

#### Acceptance Criteria

1. THE Voter_Matcher SHALL load all of the following from external, versioned configuration files at runtime — none of these SHALL be hardcoded in application logic:
   - The list of active parties (Party_Registry)
   - The list of active ideological axes (Axis_Registry)
   - The list of active archetypes (Archetype_Registry)
   - The list of supported languages (Language_Registry)
   - The question bank and all option weights
   - The minimum answered question threshold for low-confidence warning
   - The weight range (min/max) for Party_Weights and Axis_Weights
   - The confidence score classification thresholds
   - The collinearity threshold for axis validation
   - The discriminating power threshold for axis validation
   - The concurrency target for performance requirements

2. THE Party_Registry SHALL define for each party: a unique machine-readable ID, display names in all supported languages, governance status (incumbent / new / opposition), the Manifesto_Version reference, and a flag indicating whether weights are track-record-based or promise-based.

3. THE Axis_Registry SHALL define for each axis: a unique machine-readable ID, display names in all supported languages, plain civic language labels in all supported languages, the archetype(s) it maps to, and the independence pairs (axes that are known to be non-contradictory).

4. THE Archetype_Registry SHALL define for each archetype: a unique machine-readable ID, display names in all supported languages, the dominant axes that trigger it, classification thresholds, and 2–3 sentence descriptions in all supported languages.

5. THE Language_Registry SHALL define for each supported language: locale code, font stack, text direction, and the path to its translation file bundle. Adding a new language SHALL require only adding an entry here and providing translation files — no code changes.

6. WHEN a new party is added to the Party_Registry, THE Voter_Matcher SHALL automatically include that party in all scoring, result display, and explanation output without any code changes. The question bank SHALL be updated to include Party_Weights for the new party.

7. WHEN a manifesto is updated, THE Ideology_Mapping_Engine SHALL load the new Manifesto_Version and recompute Party_Weights. The previous Manifesto_Version SHALL be retained in the audit log per Requirement 17 AC 5.

8. WHEN the Party_Registry contains N parties, THE Scoring_Engine SHALL dynamically adjust the confidence score thresholds using the formula: High threshold = 100/N + 12, Medium threshold = 100/N + 2 — ensuring thresholds scale correctly as party count changes.

9. WHEN the Axis_Registry is updated (axis added, removed, or redefined), THE Questionnaire_Engine SHALL validate that the question bank covers all active axes with at least 2 questions per axis before accepting the update.

10. ALL configuration files SHALL be stored in a version-controlled repository with a cryptographic hash. THE Voter_Matcher SHALL verify the hash of each configuration file at startup and reject any file whose hash does not match the expected value.

11. THE Voter_Matcher SHALL expose a read-only configuration inspection endpoint (accessible only to authenticated operators) that returns the currently active versions of all configuration files, enabling operators to verify what is running in production.

---

### Requirement 1: Onboarding

**User Story:** As a first-time voter, I want to understand what this tool does and how it works before I start answering questions, so that I feel confident and informed going in.

#### Acceptance Criteria

1. THE Voter_Matcher SHALL display an Onboarding_Screen before the questionnaire begins.
2. THE Onboarding_Screen SHALL explain in plain language (no political jargon) that the tool matches the user's beliefs to parties based on policy trade-offs, not party loyalty.
3. THE Onboarding_Screen SHALL state the estimated time to complete — this value SHALL be read from configuration, not hardcoded.
4. THE Onboarding_Screen SHALL state that no personal data is collected and no account is required.
5. THE Onboarding_Screen SHALL include a "How it works" summary: answer questions → system maps beliefs → result shows alignment.
6. THE Onboarding_Screen SHALL render in the user's active language as determined by the Language_Registry, defaulting to the first language listed in the registry (currently Tamil). The language toggle SHALL display all languages listed in the Language_Registry.
7. WHEN a user dismisses the Onboarding_Screen, THE Questionnaire_Engine SHALL begin the session.

---

### Requirement 2: Questionnaire Presentation

**User Story:** As a voter, I want to answer a structured set of questions about my beliefs, so that the system can determine my political alignment.

#### Acceptance Criteria

1. THE Questionnaire_Engine SHALL present the number of questions defined in configuration per session — currently 30, but this value SHALL be configurable without code changes.
2. WHEN a session begins, THE Questionnaire_Engine SHALL randomize questions within topic clusters (not globally) to reduce positional bias while maintaining topical coherence and reducing cognitive fatigue.
3. THE Questionnaire_Engine SHALL display one question at a time in sequential order.
4. WHEN a question is displayed, THE Questionnaire_Engine SHALL present the number of options defined per question in the question bank — currently 3, but this value SHALL be configurable per question.
5. WHEN a user selects an option, THE Questionnaire_Engine SHALL record the selection and advance to the next unanswered question.
6. WHEN a user chooses to skip a question, THE Questionnaire_Engine SHALL mark that question as skipped and advance to the next question without recording a score contribution for that question.
7. WHILE a session is in progress, THE Progress_Indicator SHALL display the current question number and total question count dynamically based on the configured question set.
8. WHEN a user reaches the final question and submits a response, THE Questionnaire_Engine SHALL trigger the Scoring_Engine to compute results.
9. IF a session contains fewer answered questions than the configured minimum threshold (currently 50% of total questions), THEN THE Questionnaire_Engine SHALL display a warning that results may have low confidence before proceeding to scoring.
10. IF a user skips all questions within a single Ideological_Axis cluster, THEN THE Questionnaire_Engine SHALL display an axis-level warning noting that results for that specific dimension may be incomplete.
11. WHEN a user navigates back to a previously answered question, THE Questionnaire_Engine SHALL display the previously selected option as pre-selected.

---

### Requirement 3: Ideological Axis Mapping

**User Story:** As a system designer, I want every question option to carry explicit party and axis weights, so that scoring is deterministic and auditable.

#### Acceptance Criteria

1. THE Ideology_Mapping_Engine SHALL map every Option to one or more axes defined in the Axis_Registry with a numeric Axis_Weight within the configured weight range (currently 0–5).
2. THE Ideology_Mapping_Engine SHALL map every Option to all parties registered in the Party_Registry with a numeric Party_Weight within the configured weight range (currently 0–5).
3. THE Ideology_Mapping_Engine SHALL support all axes defined in the Axis_Registry — currently nine: Welfare, Governance, Economy, Poverty, Social_Justice, Corruption, Responsibility, Language_Identity, and Federalism. New axes can be added by updating the Axis_Registry without code changes.
4. THE Language_Identity axis SHALL capture voter beliefs about Tamil language rights, cultural preservation, and resistance to linguistic imposition — a foundational dimension of Dravidian politics.
5. THE Federalism axis SHALL distinguish between two distinct positions: (a) cooperative federalism — working within the current constitutional framework to negotiate better Centre-State terms, and (b) structural federalism reform — demanding constitutional amendments to fundamentally redistribute power. Questions on this axis SHALL present this distinction explicitly.
6. THE Social_Justice axis SHALL cover at minimum three distinct sub-dimensions: (a) reservation policy (69% quota, internal sub-quotas for MBC/OBC), (b) caste census and proportional representation, and (c) private sector inclusion. Questions SHALL be designed to differentiate voter positions across these sub-dimensions.
7. WHEN an Option is selected, THE Ideology_Mapping_Engine SHALL emit the Party_Weights for all registered parties and Axis_Weights for all registered axes to the Scoring_Engine.
8. THE Ideology_Mapping_Engine SHALL store question and option data in a structured, version-controlled data format that is separate from application logic and references parties and axes by their registry IDs — never by hardcoded names.
9. IF a question definition references a party ID or axis ID not present in the current registries, THEN THE Ideology_Mapping_Engine SHALL reject that question at load time and log a descriptive validation error.
10. IF a question definition is missing a Party_Weight for any registered party or an Axis_Weight for any mapped axis, THEN THE Ideology_Mapping_Engine SHALL reject that question at load time and log a descriptive validation error.
11. THE Ideology_Mapping_Engine SHALL ensure that the Poverty axis and Welfare axis questions are empirically validated to be non-collinear before deployment — the Pearson correlation coefficient between axis scores across the full question set SHALL be less than the configured collinearity threshold (currently 0.70).
12. THE Ideology_Mapping_Engine SHALL ensure that each axis has sufficient discriminating power — the variance in Party_Weights across all registered parties SHALL exceed the configured discriminating power threshold (currently 1.0 on the weight scale).
13. THE Ideology_Mapping_Engine SHALL distinguish between Party_Weights assigned based on documented governance track record and Party_Weights assigned based on manifesto promises only, as flagged in the Party_Registry. This distinction SHALL be documented in the methodology page and disclosed on the Result_Dashboard.
14. WHEN a new Manifesto_Version is loaded for a party, THE Ideology_Mapping_Engine SHALL recompute all Party_Weights for that party and log the change in the audit trail per Requirement 17 AC 5. Existing sessions in progress SHALL complete using the previous weights; new sessions SHALL use the updated weights.
4. THE Language_Identity axis SHALL capture voter beliefs about Tamil language rights, cultural preservation, and resistance to linguistic imposition — a foundational dimension of Dravidian politics.
5. THE Federalism axis SHALL distinguish between two distinct positions: (a) cooperative federalism — working within the current constitutional framework to negotiate better Centre-State terms, and (b) structural federalism reform — demanding constitutional amendments to fundamentally redistribute power. Questions on this axis SHALL present this distinction explicitly.
6. THE Social_Justice axis SHALL cover at minimum three distinct sub-dimensions: (a) reservation policy (69% quota, internal sub-quotas for MBC/OBC), (b) caste census and proportional representation, and (c) private sector inclusion. Questions SHALL be designed to differentiate voter positions across these sub-dimensions, not treat Social_Justice as a single binary.
7. WHEN an Option is selected, THE Ideology_Mapping_Engine SHALL emit the Party_Weights and Axis_Weights for that Option to the Scoring_Engine.
8. THE Ideology_Mapping_Engine SHALL store question and option data in a structured, version-controlled data format that is separate from application logic.
9. IF a question definition is missing a Party_Weight or Axis_Weight for any required field, THEN THE Ideology_Mapping_Engine SHALL reject that question at load time and log a descriptive validation error.
10. THE Ideology_Mapping_Engine SHALL ensure that the Poverty axis and Welfare axis questions are empirically validated to be non-collinear before deployment — the Pearson correlation coefficient between axis scores across the full question set SHALL be less than 0.70. Questions that exceed this threshold SHALL be consolidated or redesigned.
11. THE Ideology_Mapping_Engine SHALL ensure that each Ideological_Axis has sufficient discriminating power — the variance in Party_Weights across the three parties for questions on that axis SHALL be greater than 1.0 on the 0–5 scale. Axes that fail this threshold SHALL be redesigned or merged.
12. THE Ideology_Mapping_Engine SHALL distinguish between Party_Weights assigned based on documented governance track record (for incumbent parties DMK and AIADMK) and Party_Weights assigned based on manifesto promises only (for TVK and any future new party). This distinction SHALL be documented in the methodology page and SHALL be disclosed to the user on the Result_Dashboard.

---

### Requirement 4: Weighted Scoring

**User Story:** As a voter, I want my answers to be aggregated into a meaningful score per party, so that the result reflects the full picture of my beliefs.

#### Acceptance Criteria

1. WHEN all answered questions have been processed, THE Scoring_Engine SHALL compute a cumulative raw score for each party in the Party_Registry by summing the Party_Weights of all selected Options.
2. THE Scoring_Engine SHALL normalize the raw Party scores into percentages that sum to 100 — the normalization formula SHALL work correctly for any number of registered parties.
3. IF the sum of all raw Party scores across all registered parties is zero (e.g., all questions skipped), THEN THE Scoring_Engine SHALL assign equal scores of 100/N % to each of the N registered parties and set the Confidence_Score to "Low" without performing division.
4. WHEN fewer than the configured total questions are answered due to skipping, THE Scoring_Engine SHALL compute scores using only the answered questions without penalizing the user for skipped questions.
5. THE Scoring_Engine SHALL compute an axis-level score for each axis in the Axis_Registry by summing the Axis_Weights of all selected Options for that axis.
6. THE Scoring_Engine SHALL complete all score computations within the configured scoring time target of receiving the final answer.
7. THE Scoring_Engine SHALL produce a deterministic result: given the same set of answers and the same configuration version, the scores SHALL always be identical.

---

### Requirement 5: Confidence Score

**User Story:** As a voter, I want to know how strongly my answers align with the top-matched party, so that I can judge how decisive my result is.

#### Acceptance Criteria

1. WHEN party scores are normalized, THE Scoring_Engine SHALL compute a Confidence_Score using a plurality-adjusted formula that dynamically accounts for the number of active parties in the Party_Registry — not just the gap between the top two.
2. THE Scoring_Engine SHALL derive confidence classification thresholds dynamically from the Party_Registry using the formula defined in Requirement 0 AC 8. For the current 3-party configuration this yields: High when top score > 45% AND gap > 20pp; Medium when top score 35–45% OR gap 10–20pp; Low when top score < 35% OR gap < 10pp.
3. THE Scoring_Engine SHALL classify the Confidence_Score as "High", "Medium", or "Low" using the dynamically computed thresholds.
4. THE Result_Dashboard SHALL display the Confidence_Score label alongside the party match percentages.
5. THE Result_Dashboard SHALL display a plain-language explanation of what the Confidence_Score means (e.g., "Your beliefs align strongly with one party" or "Your beliefs are spread across multiple parties").

---

### Requirement 6: Result Output

**User Story:** As a voter, I want to see a clear result showing which party I align with and by how much, so that I can make an informed decision.

#### Acceptance Criteria

1. WHEN scoring is complete, THE Result_Dashboard SHALL display the match percentage for all parties registered in the Party_Registry — the display SHALL dynamically render one card per registered party.
2. THE Result_Dashboard SHALL identify and prominently display the Party with the highest score as the primary match.
3. THE Result_Dashboard SHALL identify and display the Party with the second-highest score as the secondary match.
4. THE Result_Dashboard SHALL display the user's Confidence_Score and its plain-language explanation.
5. THE Result_Dashboard SHALL display the user's assigned Archetype with a 2–3 sentence plain-language description sourced from the Archetype_Registry.
6. THE Result_Dashboard SHALL display the axis-level breakdown for all axes in the Axis_Registry, with axis names rendered using the plain civic language labels defined in the Axis_Registry for the active language.
7. THE Result_Dashboard SHALL display party match percentages in both numeric text and visual bar format — color alone SHALL NOT be the only differentiator between parties.
8. THE Result_Dashboard SHALL display the disclaimer text sourced from configuration — not hardcoded — so it can be updated for legal compliance without code changes.
9. WHEN a user selects the share option, THE Voter_Matcher SHALL generate a Share_Card as defined in Requirement 15.

---

### Requirement 7: Explanation Engine

**User Story:** As a voter, I want a plain-language explanation of why I matched a particular party, so that I can understand and trust the result.

#### Acceptance Criteria

1. WHEN results are displayed, THE Explanation_Engine SHALL generate a primary explanation paragraph describing why the user matched the top Party, referencing the dominant axes in plain civic language sourced from the Axis_Registry for the active language.
2. THE Explanation_Engine SHALL generate a secondary alignment insight describing the user's partial alignment with the second-ranked Party.
3. THE Explanation_Engine SHALL generate a list of 2 to 4 belief statements derived from the user's highest-scoring axes, written in neutral, non-hierarchical language that does not imply any ideological position is more sophisticated than another.
4. THE Explanation_Engine SHALL generate all explanation text without referencing specific question numbers or raw numeric scores visible to the user.
5. THE Explanation_Engine SHALL produce explanation text in the user's active language as determined by the Language_Registry.
6. WHEN the user switches language, THE Explanation_Engine SHALL re-render all explanation text in the newly selected language without requiring a new session.
7. THE Explanation_Engine SHALL source all party descriptions, axis labels, and archetype descriptions from the respective registries — no explanation text SHALL be hardcoded in application logic.

---

### Requirement 8: Psychological Profiling

**User Story:** As a voter, I want to be classified into a voter archetype, so that I can understand my broader political psychology.

#### Acceptance Criteria

1. WHEN axis scores are computed, THE Profiling_Engine SHALL classify the user into exactly one Archetype from the Archetype_Registry — currently four: Security_Seeker, Equity_Builder, System_Reformer, or Identity_Advocate. New archetypes can be added by updating the Archetype_Registry without code changes.
2. THE Profiling_Engine SHALL assign archetypes based solely on the dominant axis mappings defined in the Archetype_Registry — no archetype-to-axis mappings SHALL be hardcoded in application logic.
3. THE Profiling_Engine SHALL NOT hard-code a one-to-one mapping between Archetypes and Parties — the archetype classification and the party scoring SHALL operate as independent engines whose outputs may or may not agree.
4. WHEN axis scores do not clearly indicate a single dominant archetype (i.e., the top two archetype scores are within the configured ambiguity threshold, currently 10%), THE Profiling_Engine SHALL assign the archetype corresponding to the highest axis score and note the secondary archetype in the result.
5. THE Result_Dashboard SHALL display the 2–3 sentence description of the assigned Archetype sourced from the Archetype_Registry for the active language — neutral and non-judgmental regardless of which archetype is assigned.
6. BEFORE deployment, THE Profiling_Engine SHALL be validated to confirm that each Archetype is statistically separable from the others — no two archetypes SHALL produce identical or near-identical party score distributions across a representative sample of 1,000 simulated answer sets. IF two archetypes are found to be inseparable, they SHALL be merged or redesigned.

---

### Requirement 9: Consistency Detection

**User Story:** As a voter, I want the system to flag if my answers are contradictory, so that I can reconsider and improve the accuracy of my result.

#### Acceptance Criteria

1. WHEN all answers are submitted, THE Consistency_Detector SHALL analyze the answer set for contradictory response patterns across related Ideological_Axes.
2. THE Consistency_Detector SHALL define a contradiction as selecting options that assign high Axis_Weight to opposing poles of the same axis in different questions (e.g., selecting both maximum-welfare and minimum-state options across questions on the Welfare axis).
3. WHEN one or more contradictions are detected, THE Result_Dashboard SHALL display a non-blocking notice informing the user that some answers appear to reflect nuanced or cross-ideological views, with a neutral explanation of the detected tension — framed as complexity, not error.
4. WHEN contradictions are detected, THE Consistency_Detector SHALL reduce the Confidence_Score by one level (e.g., High → Medium) to reflect answer ambiguity.
5. THE Consistency_Detector SHALL NOT penalize voters for holding cross-ideological views on axes that are defined as independent pairs in the Axis_Registry. The list of independent axis pairs SHALL be configurable — no axis independence rules SHALL be hardcoded.
6. WHEN no contradictions are detected, THE Consistency_Detector SHALL not display any inconsistency notice.

---

### Requirement 10: Performance

**User Story:** As a user on a mobile device, I want the questionnaire and results to load quickly, so that I am not frustrated by delays.

#### Acceptance Criteria

1. THE Questionnaire_Engine SHALL load the full question set and render the first question within the configured load time target (currently 1 second) under broadband or 4G network conditions.
2. THE Questionnaire_Engine SHALL load the full question set and render the first question within the configured low-bandwidth load time target (currently 3 seconds) under 2G or 3G network conditions.
3. THE Scoring_Engine SHALL complete all score computations and deliver results to the Result_Dashboard within the configured scoring time target (currently 200 milliseconds) of receiving the final answer.
4. WHILE the system is processing results, THE Voter_Matcher SHALL display a processing indicator with text sourced from the active language's translation file.
5. THE Voter_Matcher SHALL support the configured minimum concurrent user sessions (currently 100,000) without degradation of the response time requirements stated in criteria 1, 2, and 3.

---

### Requirement 11: Privacy and Data Security

**User Story:** As a voter, I want to use this tool without my personal data being stored, so that I can answer honestly without privacy concerns.

#### Acceptance Criteria

1. THE Voter_Matcher SHALL operate in Anonymous_Mode by default, storing no personally identifiable information during or after a session.
2. THE Voter_Matcher SHALL not require user registration or login to complete the questionnaire or view results.
3. IF a user's session data is transmitted to a backend service, THEN THE Voter_Matcher SHALL transmit it over TLS 1.3 or higher.
4. THE Voter_Matcher SHALL not store raw answer data linked to any device identifier, IP address, or browser fingerprint in Anonymous_Mode.
5. WHERE analytics collection is enabled, THE Voter_Matcher SHALL collect only aggregated, non-identifiable data and SHALL display a specific pre-session disclosure stating: what data is collected, that it is aggregated and non-identifiable, the purpose of collection, and that no individual responses are stored.
6. WHEN a session ends (user closes browser, navigates away, or views results), THE Voter_Matcher SHALL clear all session answer data from browser localStorage within the same session lifecycle.
7. THE Voter_Matcher SHALL document the localStorage data lifecycle in its privacy disclosure so users understand that locally cached data does not persist after session end.

---

### Requirement 12: Fairness and Transparency

**User Story:** As a voter, I want to trust that the system is not biased toward any party, so that I can rely on the result.

#### Acceptance Criteria

1. THE Voter_Matcher SHALL apply identical scoring logic to all three Parties without hard-coded advantages or penalties for any Party.
2. THE Voter_Matcher SHALL make the scoring methodology (axis definitions, weight ranges, normalization formula) available to users via a publicly accessible methodology page linked from both the Onboarding_Screen and the Result_Dashboard.
3. THE Ideology_Mapping_Engine SHALL assign Party_Weights to options based solely on documented, publicly verifiable policy positions — with no option receiving a Party_Weight of 0 for all three Parties simultaneously.
4. THE Ideology_Mapping_Engine SHALL undergo an independent weight audit by a panel of at least two political domain experts (one from academia, one from civil society) before public launch. The audit SHALL verify that no single party dominates more than three of the nine axes with a weight of 5.
5. THE Questionnaire_Engine SHALL present questions in cluster-randomized order per session to prevent positional bias.
6. THE Voter_Matcher SHALL include the disclaimer defined in Requirement 6 AC 8 on the Result_Dashboard.
7. THE Voter_Matcher SHALL implement rate limiting on the scoring API to prevent automated bulk requests that could be used to reverse-engineer optimal answer sequences.
8. THE Voter_Matcher SHALL implement bot detection (e.g., minimum session duration check, honeypot fields) to prevent automated questionnaire completion.
9. THE Voter_Matcher SHALL sign Share_Card URLs with a server-side hash to prevent forgery of result links.
10. THE Result_Dashboard SHALL display a notice when the matched party is TVK (or any party with fewer than 2 years of governance history) stating: "Note: [Party]'s alignment scores are based on manifesto promises. Unlike parties with governance records, these positions have not yet been tested in office."

---

### Requirement 13: Accessibility and UX

**User Story:** As a first-time voter using a mobile device, I want the interface to be easy to use, so that I can complete the questionnaire without confusion.

#### Acceptance Criteria

1. THE Questionnaire_Engine SHALL support both tap-based and swipe-based option selection on touch devices.
2. THE Questionnaire_Engine SHALL provide a keyboard-navigable and switch-access-compatible alternative to swipe interaction for users with motor impairments.
3. THE Voter_Matcher SHALL render correctly on screen widths from 320px to 1440px without horizontal scrolling.
4. THE Voter_Matcher SHALL meet WCAG 2.1 Level AA color contrast requirements for all text and interactive elements.
5. THE Voter_Matcher SHALL convey all party match information in both text and visual format — color SHALL NOT be the sole differentiator between parties on any screen.
6. THE Voter_Matcher SHALL be navigable by screen reader in both Tamil and English, with appropriate ARIA labels on all interactive elements.
7. THE Voter_Matcher SHALL complete the full user flow — from landing page to result display — within a median session time of 3 minutes for a user answering all 30 questions.

---

### Requirement 14: Reliability

**User Story:** As a voter during peak election season, I want the system to be available when I need it, so that I am not blocked from completing my alignment check.

#### Acceptance Criteria

1. THE Voter_Matcher SHALL maintain a monthly uptime of 99.9% or greater, measured at the application layer.
2. IF a backend service becomes unavailable, THEN THE Voter_Matcher SHALL fall back to client-side scoring using locally cached question data and scoring logic — the cached data SHALL contain no user-identifiable information.
3. WHEN a session is interrupted due to a network error, THE Questionnaire_Engine SHALL preserve the user's answers in local browser storage and offer to resume the session upon reconnect.
4. WHEN a session is resumed from local storage, THE Voter_Matcher SHALL verify the integrity of cached question data before proceeding.

---

### Requirement 15: Share Card

**User Story:** As a voter, I want to share my result with others, so that I can discuss my political alignment — without the share content being misused as propaganda.

#### Acceptance Criteria

1. WHEN a user selects the share option, THE Voter_Matcher SHALL generate a Share_Card containing: party match percentages, assigned Archetype, Confidence_Score, the disclaimer text, and a URL linking to the methodology page.
2. THE Share_Card SHALL NOT display party logos, official party colors, or any imagery that could imply official party endorsement or affiliation.
3. THE Share_Card SHALL use a neutral monochrome or brand-neutral color palette — party results SHALL be differentiated using text labels and percentage numbers only, not color coding.
4. THE Share_Card SHALL include the text: "This is a personal belief alignment result. It is not a voting recommendation and is not affiliated with any political party."
5. THE Share_Card URL SHALL be signed with a server-side hash so that the result cannot be forged or tampered with.
6. THE Voter_Matcher SHALL rate-limit Share_Card generation to prevent bulk automated generation of fake result cards.
7. THE Share_Card SHALL be available in both Tamil and English, matching the user's active language at the time of sharing.
8. THE Share_Card SHALL include the tool's URL and the text "Verify at [url]" so recipients can check the result independently.

---

### Requirement 16: Analytics (Optional)

**User Story:** As a product analyst, I want to collect aggregated usage data, so that I can understand how voters are using the tool and improve it.

#### Acceptance Criteria

1. WHERE analytics collection is enabled, THE Voter_Matcher SHALL record the completion rate (ratio of sessions reaching the result screen to sessions starting the questionnaire).
2. WHERE analytics collection is enabled, THE Voter_Matcher SHALL record the aggregated distribution of answers per question across all sessions.
3. WHERE analytics collection is enabled, THE Voter_Matcher SHALL record the aggregated distribution of Party match results across all sessions.
4. WHERE analytics collection is enabled, THE Voter_Matcher SHALL record the per-question drop-off rate to identify questions that cause users to abandon the session.
5. WHERE analytics collection is enabled, THE Voter_Matcher SHALL record the aggregated distribution of assigned Archetypes across all sessions.
6. WHERE analytics collection is enabled, THE Voter_Matcher SHALL record the aggregated distribution of Confidence_Score levels across all sessions.
7. THE Voter_Matcher SHALL NOT include any session-level or user-level identifiers in analytics data.
8. THE Voter_Matcher SHALL NOT store analytics data in a form that could be re-identified even through aggregation attacks (e.g., no combination of rare answer patterns that uniquely identify a user).

---

### Requirement 17: Legal Compliance

**User Story:** As the platform operator, I want the system to comply with Indian election law and data protection law, so that the platform is not exposed to legal liability.

#### Acceptance Criteria

1. THE Voter_Matcher SHALL display the disclaimer defined in Requirement 6 AC 8 on every screen that shows party-related results.
2. THE Voter_Matcher SHALL obtain legal review of all disclaimer language against the Representation of the People Act, 1951 and the Model Code of Conduct before public launch.
3. THE Voter_Matcher SHALL comply with India's Digital Personal Data Protection Act, 2023 (DPDPA) for all data handling, including the pre-session disclosure requirements in Requirement 11 AC 5.
4. THE Voter_Matcher SHALL NOT display or store any content that could be classified as political advertising under Section 127A of the Representation of the People Act.
5. THE Voter_Matcher SHALL maintain an audit log of question data versions so that any change to Party_Weights or Axis_Weights can be traced and reviewed for bias post-deployment.

---

### Requirement 18: Demographic Context in Explanations

**User Story:** As a young first-time voter, I want the explanation to surface policies that are directly relevant to my life situation, so that the result feels personally meaningful rather than abstract.

#### Acceptance Criteria

1. THE Explanation_Engine SHALL optionally accept a user-declared demographic context (age group: 18–25, 26–40, 41–60, 60+; and voter type: first-time, returning) collected on the Onboarding_Screen.
2. WHEN demographic context is provided, THE Explanation_Engine SHALL include 1–2 contextually relevant policy highlights from the matched party that are specifically applicable to the user's declared demographic (e.g., for 18–25: unemployment allowance, education loans, internships; for 41–60: pension, healthcare, agricultural support).
3. THE demographic context collection SHALL be entirely optional — users who decline SHALL receive the standard explanation without demographic tailoring.
4. THE Voter_Matcher SHALL NOT use demographic context to alter party scores or axis weights — it SHALL only influence the explanation text.
5. THE demographic context data SHALL be treated as session-only data and SHALL be cleared under the same rules as answer data per Requirement 11 AC 6.

---

### Requirement 19: Axis Weight Audit and Validation

**User Story:** As a fairness auditor, I want the axis weight assignments to be independently verified against manifesto content, so that no party gains a structural advantage from the weight design.

#### Acceptance Criteria

1. THE Ideology_Mapping_Engine's Party_Weight assignments SHALL be reviewed by an independent panel of at least two domain experts before public launch, as specified in Requirement 12 AC 4.
2. THE audit SHALL verify that no single party scores 5/5 on more than three of the nine axes — if this condition is violated, the affected weights SHALL be recalibrated.
3. THE audit SHALL verify that the Responsibility axis has sufficient discriminating power (variance > 1.0 across parties) — if not, the axis SHALL be redesigned or merged with the Governance axis.
4. THE audit SHALL produce a written report documenting the basis for each Party_Weight assignment, citing specific manifesto clauses or governance actions as evidence.
5. THE audit report SHALL be published on the methodology page alongside the tool's launch.
6. FOR TVK and any party with fewer than 2 years of governance history, THE audit SHALL separately document which weights are promise-based versus track-record-based, and this distinction SHALL be reflected in the Result_Dashboard per Requirement 12 AC 10.
