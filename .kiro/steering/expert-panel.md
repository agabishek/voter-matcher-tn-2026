---
inclusion: always
---

# Expert Panel – Voter Matcher TN 2026

Every change to this project — whether it's a requirement, design decision, or implementation detail — must be reviewed through the lens of the following expert panel. When making or reviewing any change, simulate the perspective of each relevant expert and flag concerns before proceeding.

---

## 🏛️ Political & Ideological Experts

### 1. Tamil Nadu Political Analyst
**Role:** Validates that party ideological mappings (DMK, AIADMK, TVK) are accurate, fair, and grounded in documented policy positions — not perception or media narrative.
**Review focus:**
- Are axis weights for each party defensible with public policy evidence?
- Does any question wording subtly favor or disadvantage a party?
- Are the archetype-to-party associations (Security Seeker → AIADMK, Equity Builder → DMK, System Reformer → TVK) politically accurate and not reductive?
- Does the question bank reflect real trade-offs Tamil Nadu voters face?

### 2. Election Commission / Civic Governance Expert
**Role:** Ensures the tool complies with Model Code of Conduct principles and does not constitute political advertising or voter influence.
**Review focus:**
- Does any output language constitute a voting recommendation?
- Is the disclaimer on the result screen legally sufficient?
- Does the tool avoid any content that could be flagged as election interference?

### 3. Dravidian Political History Scholar
**Role:** Provides historical and ideological depth to ensure the axes and archetypes reflect the actual Dravidian political tradition, not a generic Indian political framework.
**Review focus:**
- Are the ideological axes (Welfare, Governance, Social Justice, etc.) appropriate for the Tamil Nadu political context?
- Does the system account for caste, language, and regional identity dimensions that are central to TN politics?

---

## ⚖️ Ethics & Fairness Experts

### 4. Algorithmic Fairness Researcher
**Role:** Audits the scoring and weighting logic for systemic bias — ensuring no party benefits from structural advantages in the algorithm.
**Review focus:**
- Is the normalization formula mathematically neutral?
- Can any combination of answers produce a structurally impossible result for a party?
- Are the weight ranges (0–5) applied consistently across all parties?
- Does the consistency detector penalize any ideological profile disproportionately?

### 5. Political Neutrality Auditor
**Role:** Reviews all user-facing text (questions, options, explanations, archetypes) for loaded language, framing bias, or implicit endorsement.
**Review focus:**
- Are question prompts framed neutrally without leading the user?
- Do option texts avoid emotionally charged or politically coded language?
- Are archetype descriptions (Security Seeker, Equity Builder, System Reformer) neutral and non-judgmental?
- Does the explanation engine output balanced language regardless of which party is matched?

---

## 🔒 Privacy & Security Experts

### 6. Data Privacy / PDPB Compliance Expert
**Role:** Ensures the system complies with India's Personal Data Protection Bill and general privacy best practices.
**Review focus:**
- Is Anonymous_Mode truly anonymous — no fingerprinting, no IP logging, no session linkage?
- Is the analytics data genuinely non-identifiable even in aggregate?
- Is the pre-session analytics disclosure legally adequate?
- Are TLS and data-in-transit requirements sufficient?

### 7. Cybersecurity Engineer
**Role:** Reviews the system for attack vectors, especially given the politically sensitive nature and 100K+ concurrent user scale.
**Review focus:**
- Can the scoring API be manipulated to produce skewed results at scale?
- Is the question data tamper-proof (version-controlled, integrity-checked)?
- Are there rate limiting and abuse prevention mechanisms?
- Can the share link/image generation be exploited for misinformation?

---

## 🧠 UX & Behavioral Science Experts

### 8. Cognitive Psychologist / Behavioral Economist
**Role:** Ensures the questionnaire design avoids cognitive biases that could distort results.
**Review focus:**
- Does question randomization adequately prevent anchoring and order effects?
- Are the trade-off questions genuinely forcing a choice, or do they allow fence-sitting?
- Is the 30-question length appropriate — not so long it causes fatigue, not so short it lacks signal?
- Does the skip mechanism introduce selection bias in results?

### 9. Mobile UX Designer
**Role:** Reviews the user interface for usability on low-end Android devices common among first-time voters in semi-urban Tamil Nadu.
**Review focus:**
- Does the UI work on 320px screens and low-RAM devices?
- Is the swipe/tap interaction intuitive without a tutorial?
- Is the progress indicator motivating rather than discouraging?
- Is the result dashboard scannable in under 30 seconds?

### 10. Tamil Language & Localization Expert
**Role:** Ensures Tamil translations are accurate, politically neutral, and accessible to voters with varying literacy levels.
**Review focus:**
- Are translated question texts grammatically correct and unambiguous in Tamil?
- Do archetype names and explanation text translate meaningfully without losing nuance?
- Is the reading level appropriate for a broad voter demographic?
- Are constituency names (234 constituencies) and district names spelled correctly in Tamil?
- Do UI labels, warnings, and disclaimers read naturally in Tamil — not like machine translations?

### 10a. Tamil ↔ English Translator & Semantic Equivalence Reviewer
**Role:** Dedicated bilingual reviewer who ensures Tamil and English versions of every string carry the same meaning, tone, and political neutrality — not just literal translation but semantic equivalence.
**Review focus:**
- Does the Tamil version of each question convey the same policy trade-off as the English version — no added connotation or lost nuance?
- Are politically sensitive terms (reservation, federalism, corruption) translated using standard Tamil political vocabulary, not colloquial or loaded alternatives?
- Do archetype names (பாதுகாப்பு தேடுபவர், சமத்துவ கட்டுநர், அமைப்பு சீர்திருத்தவாதி) carry the same psychological weight in Tamil as their English equivalents?
- Are option texts semantically equivalent — would a bilingual voter get the same result regardless of which language they use?
- Do explanation engine outputs read as natural Tamil prose, not transliterated English?
- Are constituency and district names in Tamil matching official Election Commission spellings?

---

## 🏗️ Technical Experts

### 11. Frontend Engineer (React / Next.js)
**Review focus:**
- Is the component architecture scalable and maintainable?
- Are performance budgets (1s load, 200ms scoring) achievable with the proposed design?
- Is client-side fallback scoring feasible with the data model?
- Does the share feature work across iOS and Android without native APIs?

### 12. Backend / Systems Engineer
**Review focus:**
- Can the scoring engine handle 100K concurrent sessions without state management issues?
- Is the question data format (JSON schema) versioned and validated at load time?
- Is the API design stateless to support horizontal scaling?
- Are there caching strategies for the static question bank?

### 13. Property-Based Testing (PBT) Engineer
**Review focus:**
- Are the correctness properties for the scoring engine formally specified and testable?
- Does the normalization formula hold for all valid input combinations (including all-skipped, all-same-party, tie scenarios)?
- Are consistency detection rules expressible as executable properties?
- Can the confidence score classification be exhaustively tested across all gap ranges?

---

## 📊 Domain Experts

### 14. Psephologist (Election Data Scientist)
**Role:** Validates that the psychological archetypes and axis model reflect real voter behavior patterns observed in Tamil Nadu elections.
**Review focus:**
- Are the three archetypes (Security Seeker, Equity Builder, System Reformer) empirically grounded?
- Does the axis model capture the actual dimensions that predict voting behavior in TN?
- Is the confidence score methodology statistically meaningful?

### 15. Sociologist (Tamil Nadu Demographics)
**Role:** Ensures the system accounts for the diversity of Tamil Nadu's voter population — urban/rural, caste, gender, age.
**Review focus:**
- Do the questions reflect concerns relevant to rural and semi-urban voters, not just urban digital users?
- Are any demographic groups implicitly disadvantaged by the question framing?
- Does the system avoid reinforcing caste-based political stereotypes?

---

## 🎓 Additional Scholars & Specialists

### 16. Caste Studies Scholar (Tamil Nadu)
**Role:** Ensures the ideological axes and question bank accurately reflect caste as a structural political force in Tamil Nadu — not a taboo topic to be avoided, but a real dimension that shapes voter behavior.
**Review focus:**
- Do the Social Justice and Welfare axes adequately capture caste-based policy trade-offs (reservation, OBC/MBC/SC/ST representation)?
- Do any questions inadvertently erase or flatten caste identity in ways that distort alignment?
- Are archetype descriptions free from upper-caste default assumptions?
- Does the system avoid reinforcing the idea that caste-based voting is irrational or uninformed?

### 17. Constitutional Law / Fundamental Rights Expert
**Role:** Reviews the system against Indian constitutional provisions — particularly around election law, privacy, and freedom of expression.
**Review focus:**
- Does the tool risk violating Article 324 (Election Commission powers) or the Representation of the People Act?
- Is the anonymous mode design sufficient to satisfy the right to privacy under Article 21 (post-Puttaswamy judgment)?
- Does the disclaimer adequately protect the platform from being classified as political advertising under election law?
- Are there any content liability risks under IT Act Section 66A successor provisions?

### 18. Media & Misinformation Researcher
**Role:** Assesses how the tool's outputs — especially shareable result cards — could be misused for political propaganda or disinformation campaigns.
**Review focus:**
- Can a result card be cropped or decontextualized to falsely imply party endorsement?
- Does the share image include sufficient context (disclaimer, methodology link) to resist misuse?
- Are there design choices that make the result look more authoritative than it is?
- Should the share feature include a watermark or URL that links back to the methodology page?
- Could the tool be used to manufacture fake "voter consensus" screenshots at scale?

### 19. First-Time Voter / Youth Civic Advocate
**Role:** Represents the primary target user — an 18–22 year old first-time voter in Tamil Nadu — ensuring the tool is comprehensible, trustworthy, and meaningful to someone with limited prior political engagement.
**Review focus:**
- Are political concepts (governance models, welfare axes) explained in terms a first-time voter understands without prior knowledge?
- Does the questionnaire feel like a civic tool or like a political test that could be failed?
- Is the result empowering or confusing for someone who has never voted before?
- Does the tool build civic confidence, or does it create anxiety about making the "wrong" choice?
- Is the onboarding (landing page) clear enough that no tutorial is needed?

### 20. Computational Social Scientist
**Role:** Validates the mathematical and structural soundness of the 7-axis ideological model — ensuring it has the right dimensionality to capture TN voter behavior without oversimplifying or over-engineering.
**Review focus:**
- Is 7 axes the right number — are any axes redundant or collinear in practice?
- Does the axis model have empirical grounding in political science literature on Indian state-level elections?
- Is the weighted aggregation approach (sum of weights) the most valid scoring method, or would a factor analysis or IRT model be more appropriate?
- Are the three archetypes (Security Seeker, Equity Builder, System Reformer) statistically separable, or do they overlap in ways that make classification unreliable?
- Does the confidence score gap method (percentage point difference) have a defensible statistical basis?

### 21. Disability & Digital Inclusion Expert
**Role:** Ensures the tool is genuinely usable by voters with visual impairments, low digital literacy, limited motor control, or low-end devices — not just technically WCAG-compliant on paper.
**Review focus:**
- Is the questionnaire navigable by screen reader users in both Tamil and English?
- Do swipe interactions have accessible keyboard/tap alternatives?
- Is the result dashboard understandable without color (for color-blind users) — are party match percentages conveyed in text, not just color-coded bars?
- Is the Tamil font size (minimum 16px) sufficient for users with mild visual impairment?
- Does the tool work on 2G/3G connections common in rural TN?
- Are error messages and warnings accessible — not just visual popups?

---

## How to Use This Panel

When reviewing any change to this project, ask:

1. **Requirements change** → Political Analyst, Neutrality Auditor, Fairness Researcher, Privacy Expert, Behavioral Psychologist, Constitutional Law Expert
2. **Design change** → Systems Engineer, Frontend Engineer, PBT Engineer, Cybersecurity Engineer, Computational Social Scientist, UI/Visual Design Expert (#25)
3. **Implementation change** → PBT Engineer, Systems Engineer, Frontend Engineer, Privacy Expert, Disability & Inclusion Expert
4. **Question/content change** → Political Analyst, History Scholar, Neutrality Auditor, Tamil Language Expert, Tamil ↔ English Translator (#10a), Sociologist, Caste Studies Scholar, Youth Advocate, Manifesto Analyst (#23)
5. **Result/explanation text change** → Neutrality Auditor, Political Analyst, Tamil Language Expert, Tamil ↔ English Translator (#10a), Behavioral Psychologist, Misinformation Researcher
6. **Share / social feature change** → Misinformation Researcher, Neutrality Auditor, Constitutional Law Expert, Cybersecurity Engineer, UI/Visual Design Expert (#25)
7. **Analytics change** → Privacy Expert, PDPB Compliance Expert, Psephologist, Computational Social Scientist
8. **Accessibility / UX change** → Disability & Inclusion Expert, Mobile UX Designer, Tamil Language Expert, Youth Advocate, Rural Voter Representative (#24)
9. **Scoring / axis model change** → Computational Social Scientist, Algorithmic Fairness Researcher, Psephologist, PBT Engineer, Manifesto Analyst (#23)
10. **Translation / i18n change** → Tamil Language Expert (#10), Tamil ↔ English Translator (#10a), Rural Voter Representative (#24)
11. **Constituency / geography change** → Electoral Geography Expert (#22), Tamil Language Expert (#10)
12. **Visual / theme change** → UI/Visual Design Expert (#25), Mobile UX Designer, Disability & Inclusion Expert

If a proposed change raises a concern from any expert perspective, document the concern and resolve it before proceeding.

---

## 🆕 Additional Experts (Added for Project Completeness)

### 22. Tamil Nadu Electoral Geography Expert
**Role:** Validates the accuracy of the 38-district, 234-constituency mapping and ensures constituency-level data is correct per the latest ECI delimitation.
**Review focus:**
- Are all 234 constituencies correctly mapped to their parent districts?
- Do constituency names match the official Election Commission of India gazette notification?
- Are reserved constituencies (SC/ST) correctly identified if used in any feature?
- Is the district-constituency hierarchy consistent with the 2007 delimitation order (as used in 2026)?
- Are newly created districts (Chengalpattu, Ranipet, Tirupattur, Kallakurichi, Tenkasi, Mayiladuthurai) correctly separated from their parent districts?

### 23. Manifesto & Policy Research Analyst
**Role:** Ensures that Party_Weights assigned to each question option are grounded in verifiable manifesto commitments and governance track records — not media perception or campaign rhetoric.
**Review focus:**
- Is every weight assignment traceable to a specific manifesto clause, budget allocation, or governance action?
- Are DMK and AIADMK weights based on track record (as flagged in Party_Registry), not just promises?
- Are TVK weights based solely on their published manifesto (weightBasis: "promise")?
- Are there any weights that reflect media narrative rather than documented policy?
- Has the weight assignment been cross-verified by at least two independent analysts?

### 24. Tamil Nadu Grassroots / Rural Voter Representative
**Role:** Represents the perspective of rural and semi-urban voters who may have limited digital literacy but strong political awareness — ensuring the tool doesn't inadvertently exclude or confuse this demographic.
**Review focus:**
- Are questions framed in terms that resonate with rural voters (agriculture, water, NREGA, PDS) — not just urban concerns?
- Is the Tamil used accessible to voters with 8th-grade literacy, not academic Tamil?
- Does the constituency selector work intuitively for someone who knows their village but not their constituency number?
- Are the 9 ideological axes meaningful to someone who thinks in terms of "what has the government done for my village" rather than abstract policy dimensions?
- Is the tool usable on a ₹5,000 Android phone with a 3G connection?

### 25. UI/Visual Design Expert (Tamil Nadu Cultural Context)
**Role:** Reviews the visual design for cultural appropriateness, aesthetic appeal to the Tamil Nadu demographic, and alignment with the mockup vision.
**Review focus:**
- Does the dark theme with purple accents feel modern and trustworthy to TN voters, or does it feel foreign?
- Are party colors (DMK red, AIADMK gold, TVK blue) used respectfully and equally?
- Are party election symbols (Rising Sun, Two Leaves, Whistle) displayed accurately and at equal prominence?
- Does the typography hierarchy work for both Tamil and English — especially given Tamil's wider character set?
- Is the result screen visually scannable in under 30 seconds on a mobile device?
- Does the share card design resist misuse while still being visually appealing enough to share?
