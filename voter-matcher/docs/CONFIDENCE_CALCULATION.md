# Confidence Calculation - ScoringEngine

## Overview

The `computeConfidence()` method in `ScoringEngine` calculates a confidence level for party match results based on the gap between the top two parties. It uses **dynamic thresholds** that automatically scale with the number of parties in the race.

## Formula

The confidence thresholds are calculated using these formulas:

- **High Threshold** = `100/N + 12`
- **Medium Threshold** = `100/N + 2`

Where `N` is the number of parties.

## Confidence Levels

1. **High**: Gap ≥ High Threshold
   - Clear winner with significant lead
   - User's preferences strongly align with one party

2. **Medium**: Medium Threshold ≤ Gap < High Threshold
   - Moderate lead for the top party
   - User has a preference but it's not overwhelming

3. **Low**: Gap < Medium Threshold
   - Close race between top parties
   - User's preferences are split or ambiguous

## Examples

### N=2 Parties (Two-Party System)
- High Threshold = 100/2 + 12 = **62**
- Medium Threshold = 100/2 + 2 = **52**

Example: `{PARTY_A: 85, PARTY_B: 15}`
- Gap = 70 → **High confidence**

### N=3 Parties (Tamil Nadu)
- High Threshold = 100/3 + 12 ≈ **45.33**
- Medium Threshold = 100/3 + 2 ≈ **35.33**

Example: `{DMK: 60, AIADMK: 20, TVK: 20}`
- Gap = 40 → **Medium confidence**

Example: `{DMK: 34, AIADMK: 33, TVK: 33}`
- Gap = 1 → **Low confidence**

### N=5 Parties (Multi-Party System)
- High Threshold = 100/5 + 12 = **32**
- Medium Threshold = 100/5 + 2 = **22**

Example: `{P1: 40, P2: 25, P3: 20, P4: 10, P5: 5}`
- Gap = 15 → **Low confidence**

## Why Dynamic Thresholds?

The formula adapts to the number of parties:

1. **More parties → Lower thresholds**: In a 5-party race, a 25-point gap is significant. In a 2-party race, it's expected.

2. **Mathematically fair**: The `100/N` term represents the "equal split" baseline. The constants (12 and 2) provide reasonable separation between confidence levels.

3. **Works for any N ≥ 2**: The system automatically handles new parties without code changes.

## API

### Method Signature

```typescript
computeConfidence(normalizedScores: Record<string, number>): ConfidenceResult
```

### Input

- `normalizedScores`: Party scores as percentages (must sum to 100)

### Output

```typescript
interface ConfidenceResult {
  level: 'High' | 'Medium' | 'Low';
  gap: number;                    // Difference between 1st and 2nd place
  thresholds: {
    high: number;                 // High threshold value
    medium: number;               // Medium threshold value
  };
}
```

## Usage Example

```typescript
import { ScoringEngine } from '@/engines/scoringEngine';

const engine = new ScoringEngine();

// Get raw scores from user answers
const rawScores = engine.compute(selectedOptions, questions, config);

// Normalize to percentages
const normalized = engine.normalize(rawScores.partyScores);

// Compute confidence
const confidence = engine.computeConfidence(normalized);

console.log(`Confidence: ${confidence.level}`);
console.log(`Gap: ${confidence.gap.toFixed(1)} percentage points`);
console.log(`Thresholds: High=${confidence.thresholds.high.toFixed(1)}, Medium=${confidence.thresholds.medium.toFixed(1)}`);
```

## Edge Cases

1. **Single party (N=1)**: Returns Low confidence with gap=0 and thresholds=0
2. **Tie between top 2**: Gap=0 → Low confidence
3. **Equal split**: Gap≈0 → Low confidence
4. **One party dominates**: Large gap → High confidence

## Testing

The implementation includes 61 comprehensive unit tests covering:
- All three confidence levels
- N=2, 3, 5, 7, 10 party scenarios
- Boundary conditions (exact threshold values)
- Edge cases (ties, single party, equal splits)
- Threshold ordering verification
- Integration with normalize() and compute()

Run tests:
```bash
npm test scoringEngine.test.ts
```

## Design Rationale

### Why gap-based instead of absolute score?

The gap between 1st and 2nd place is more meaningful than the absolute score:
- A party with 40% in a 5-party race (gap=15) is less decisive than 60% in a 3-party race (gap=40)
- Gap captures the "decisiveness" of the match

### Why these specific constants (12 and 2)?

- **High (+12)**: Requires a substantial lead beyond the equal-split baseline
- **Medium (+2)**: Requires a modest lead, but still distinguishable
- The 10-point separation (12-2) provides clear differentiation between levels

### Why not use standard deviation or other statistical measures?

- Simplicity: Gap is intuitive and explainable to users
- Transparency: Users can understand "you scored 40 points higher with Party X"
- Performance: O(N log N) sorting vs. more complex statistical calculations
- Determinism: No assumptions about score distributions

## Correctness Properties

The implementation satisfies these properties (verified by tests):

1. **Threshold ordering**: `High > Medium > 0` for all N ≥ 2
2. **Monotonicity**: Higher gap → equal or higher confidence level
3. **Determinism**: Same scores → same confidence result
4. **N-scaling**: Works correctly for any N ≥ 2
5. **Edge case handling**: Single party, ties, equal splits handled gracefully

## Future Enhancements

Potential improvements (not currently implemented):

1. **Confidence score (0-100)**: Continuous score instead of discrete levels
2. **Second-place indicator**: Show which party is the runner-up
3. **Margin of error**: Statistical confidence intervals
4. **Historical calibration**: Adjust thresholds based on actual user feedback

## References

- Design Document: `.kiro/specs/voter-matcher-tn-2026/design.md`
- Implementation: `voter-matcher/engines/scoringEngine.ts`
- Tests: `voter-matcher/tests/scoringEngine.test.ts`
- Demo: `voter-matcher/examples/confidence-demo.ts`
