/**
 * ProfilingEngine - Classifies users into psychological archetypes
 * 
 * This module implements archetype classification based on axis scores.
 * It reads archetype definitions and dominant axis mappings from the
 * Archetype_Registry to determine primary and optional secondary archetypes.
 * 
 * Classification Rules:
 * - Archetype assignment is based solely on dominant axis scores
 * - Primary archetype: the one whose dominant axes have the highest combined score
 * - Secondary archetype: assigned if ambiguity threshold is met
 * - Ambiguity: when top two archetype scores are within the configured threshold
 * 
 * @module engines/profilingEngine
 */

import type { ConfigBundle } from '@/lib/configLoader';

export interface ArchetypeResult {
  primary: string;              // archetypeId
  secondary?: string;           // archetypeId if ambiguous
  isAmbiguous: boolean;
}

export interface Contradiction {
  axis1: string;
  axis2: string;
  score1: number;
  score2: number;
  message?: string;
}

/**
 * ProfilingEngine - Classifies users into archetypes based on axis scores
 * 
 * Responsibilities:
 * - Read archetype definitions from Archetype_Registry
 * - Compute archetype scores based on dominant axis mappings
 * - Classify user into primary archetype
 * - Optionally identify secondary archetype if result is ambiguous
 * - Detect contradictions using axis independence pairs
 * - Handle edge cases (no axis scores, tied archetypes, etc.)
 */
export class ProfilingEngine {
  /**
   * Classify user into primary and optional secondary archetype
   * 
   * Algorithm:
   * 1. For each archetype in the registry, sum the axis scores for its dominant axes
   * 2. Identify the archetype with the highest combined score as primary
   * 3. Check if the gap between top two archetypes is within ambiguity threshold
   * 4. If ambiguous, assign secondary archetype
   * 
   * @param axisScores Record of axis IDs to their scores
   * @param config ConfigBundle containing Archetype_Registry
   * @returns ArchetypeResult with primary, optional secondary, and ambiguity flag
   */
  classify(axisScores: Record<string, number>, config: ConfigBundle): ArchetypeResult {
    const archetypes = config.archetypes.archetypes;

    // Edge case: no archetypes defined
    if (archetypes.length === 0) {
      throw new Error('No archetypes defined in Archetype_Registry');
    }

    // Compute score for each archetype by summing its dominant axis scores
    const archetypeScores: Array<{ id: string; score: number; threshold: number }> = [];

    for (const archetype of archetypes) {
      let score = 0;
      
      // Sum scores for all dominant axes of this archetype
      for (const axisId of archetype.dominantAxes) {
        score += axisScores[axisId] ?? 0;
      }

      archetypeScores.push({
        id: archetype.id,
        score,
        threshold: archetype.ambiguityThreshold
      });
    }

    // Sort archetypes by score (descending)
    archetypeScores.sort((a, b) => b.score - a.score);

    // Primary archetype is the one with highest score
    const primary = archetypeScores[0];

    // Edge case: single archetype
    if (archetypeScores.length === 1) {
      return {
        primary: primary.id,
        isAmbiguous: false
      };
    }

    // Check for ambiguity: is the gap between top two within threshold?
    const secondary = archetypeScores[1];
    const gap = primary.score - secondary.score;

    // Use the primary archetype's ambiguity threshold
    const isAmbiguous = gap <= primary.threshold;

    if (isAmbiguous) {
      return {
        primary: primary.id,
        secondary: secondary.id,
        isAmbiguous: true
      };
    }

    return {
      primary: primary.id,
      isAmbiguous: false
    };
  }

  /**
   * Detect contradictions in user's axis scores
   * 
   * Contradictions occur when a user has high scores on axes that are
   * conceptually independent or contradictory according to the Axis_Registry.
   * These are framed as nuance, not errors - they indicate a complex or
   * cross-ideological political profile.
   * 
   * Algorithm:
   * 1. Read independentPairs from each axis in Axis_Registry
   * 2. For each pair, check if both axes have "high" scores
   * 3. A score is considered "high" if it's at or above the median of all axis scores
   * 4. Return list of detected contradictions with descriptive messages
   * 
   * @param axisScores Record of axis IDs to their scores
   * @param config ConfigBundle containing Axis_Registry
   * @returns Array of Contradiction objects
   */
  detectContradictions(axisScores: Record<string, number>, config: ConfigBundle): Contradiction[] {
    const axes = config.axes.axes;
    const contradictions: Contradiction[] = [];

    // Calculate median axis score to determine what counts as "high"
    const scores = Object.values(axisScores).filter(score => score > 0);
    
    // Edge case: no scores or only one score
    if (scores.length < 2) {
      return [];
    }

    // Calculate median
    const sortedScores = [...scores].sort((a, b) => a - b);
    const median = sortedScores.length % 2 === 0
      ? (sortedScores[sortedScores.length / 2 - 1] + sortedScores[sortedScores.length / 2]) / 2
      : sortedScores[Math.floor(sortedScores.length / 2)];

    // Track which pairs we've already checked to avoid duplicates
    const checkedPairs = new Set<string>();

    // Check each axis's independent pairs
    for (const axis of axes) {
      const axis1Id = axis.id;
      const axis1Score = axisScores[axis1Id] ?? 0;

      // Only check if axis1 has a high score (at or above median)
      if (axis1Score < median) {
        continue;
      }

      // Check each independent pair for this axis
      for (const axis2Id of axis.independentPairs) {
        const axis2Score = axisScores[axis2Id] ?? 0;

        // Only flag if both axes have high scores (at or above median)
        if (axis2Score < median) {
          continue;
        }

        // Create a canonical pair key to avoid duplicates (e.g., "welfare-economy" and "economy-welfare")
        const pairKey = [axis1Id, axis2Id].sort().join('-');
        
        if (checkedPairs.has(pairKey)) {
          continue;
        }

        checkedPairs.add(pairKey);

        // Find axis labels for the message
        const axis1Label = axis.labels.en; // Default to English for now
        const axis2Axis = axes.find(a => a.id === axis2Id);
        const axis2Label = axis2Axis?.labels.en ?? axis2Id;

        contradictions.push({
          axis1: axis1Id,
          axis2: axis2Id,
          score1: axis1Score,
          score2: axis2Score,
          message: `You show strong interest in both ${axis1Label} and ${axis2Label}, which reflects a nuanced political perspective that bridges different ideological priorities.`
        });
      }
    }

    return contradictions;
  }
}
