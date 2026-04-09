/**
 * ScoringEngine - Computes party and axis scores from user answers
 * 
 * This module implements the core scoring logic that aggregates weights
 * from selected options to produce party match percentages and axis scores.
 * 
 * Scoring Rules:
 * - Party scores: Sum of Party_Weights across all selected options
 * - Axis scores: Sum of Axis_Weights across all selected options
 * - Zero-input edge case: If no answers provided, return equal split (100/N per party)
 * - Returns raw scores (not normalized) - normalization happens in a separate step
 * 
 * @module engines/scoringEngine
 */

import type { ConfigBundle, QuestionBank } from '@/lib/configLoader';
import { IdeologyMappingEngine } from './ideologyMappingEngine';

export interface RawScoreResult {
  partyScores: Record<string, number>;
  axisScores: Record<string, number>;
}

export interface ConfidenceResult {
  level: 'High' | 'Medium' | 'Low';
  gap: number;
  thresholds: {
    high: number;
    medium: number;
  };
}

/**
 * ScoringEngine - Computes raw party and axis scores
 * 
 * Responsibilities:
 * - Sum Party_Weights per party across selected options
 * - Sum Axis_Weights per axis across selected options
 * - Handle zero-input edge case (no answers) → equal split
 * - Return raw scores (not normalized)
 */
export class ScoringEngine {
  private readonly ideologyEngine: IdeologyMappingEngine;

  constructor() {
    this.ideologyEngine = new IdeologyMappingEngine();
  }

  /**
   * Normalize raw scores to percentages that sum to exactly 100
   * @param rawScores Record of party IDs to raw scores
   * @returns Record of party IDs to normalized percentages (sum = 100)
   */
  normalize(rawScores: Record<string, number>): Record<string, number> {
    const partyIds = Object.keys(rawScores);
    const total = Object.values(rawScores).reduce((sum, score) => sum + score, 0);

    // Edge case: all scores are 0 → equal split
    if (total === 0) {
      const equalShare = 100 / partyIds.length;
      const normalized: Record<string, number> = {};
      for (const partyId of partyIds) {
        normalized[partyId] = equalShare;
      }
      return normalized;
    }

    // Convert to percentages
    const normalized: Record<string, number> = {};
    for (const partyId of partyIds) {
      normalized[partyId] = (rawScores[partyId] / total) * 100;
    }

    // Ensure sum equals exactly 100 by adjusting the largest score
    // This handles floating point precision issues
    const sum = Object.values(normalized).reduce((acc, val) => acc + val, 0);
    const diff = 100 - sum;

    // Always adjust if there's any difference (even tiny floating point errors)
    if (diff !== 0) {
      // Find party with largest score and adjust it
      const largestParty = partyIds.reduce((max, id) => 
        normalized[id] > normalized[max] ? id : max
      );
      normalized[largestParty] += diff;
    }

    return normalized;
  }

  /**
   * Compute confidence level based on gap between top 2 parties
   * 
   * Uses dynamic thresholds that scale with number of parties:
   * - High threshold = 100/N + 12
   * - Medium threshold = 100/N + 2
   * 
   * @param normalizedScores Record of party IDs to normalized percentages (sum = 100)
   * @returns ConfidenceResult with level, gap, and thresholds
   */
  computeConfidence(normalizedScores: Record<string, number>): ConfidenceResult {
    const partyIds = Object.keys(normalizedScores);
    const N = partyIds.length;

    // Edge case: single party always has Low confidence (no competition)
    if (N < 2) {
      return {
        level: 'Low',
        gap: 0,
        thresholds: {
          high: 0,
          medium: 0
        }
      };
    }

    // Sort scores in descending order
    const sortedScores = Object.values(normalizedScores).sort((a, b) => b - a);

    // Gap = difference between 1st and 2nd place
    const gap = sortedScores[0] - sortedScores[1];

    // Dynamic thresholds based on party count
    // For N=3: High > 15pp gap, Medium > 5pp gap
    // These thresholds reflect realistic score distributions with 30 questions
    const highThreshold = Math.max(15, 100 / N - 18);
    const mediumThreshold = Math.max(5, 100 / N - 28);

    // Determine confidence level
    let level: 'High' | 'Medium' | 'Low';
    if (gap >= highThreshold) {
      level = 'High';
    } else if (gap >= mediumThreshold) {
      level = 'Medium';
    } else {
      level = 'Low';
    }

    return {
      level,
      gap,
      thresholds: {
        high: highThreshold,
        medium: mediumThreshold
      }
    };
  }

  /**
   * Compute raw party and axis scores from selected options
   * @param selectedOptionIds Array of option IDs that the user selected
   * @param questions QuestionBank containing all questions and options
   * @param config ConfigBundle containing party and axis registries
   * @returns RawScoreResult with party and axis scores
   */
  compute(
    selectedOptionIds: readonly string[],
    questions: QuestionBank,
    config: ConfigBundle
  ): RawScoreResult {
    // Get all active party IDs from Party_Registry
    const activePartyIds = config.parties.parties
      .filter(party => party.active)
      .map(party => party.id);

    // Get all axis IDs from Axis_Registry
    const axisIds = config.axes.axes.map(axis => axis.id);

    // Initialize scores to 0 for all parties and axes
    const partyScores: Record<string, number> = {};
    const axisScores: Record<string, number> = {};

    for (const partyId of activePartyIds) {
      partyScores[partyId] = 0;
    }

    for (const axisId of axisIds) {
      axisScores[axisId] = 0;
    }

    // Handle zero-input edge case: no answers provided
    if (selectedOptionIds.length === 0) {
      // Return equal split: 100/N per party
      const equalShare = 100 / activePartyIds.length;
      for (const partyId of activePartyIds) {
        partyScores[partyId] = equalShare;
      }
      // Axis scores remain 0
      return { partyScores, axisScores };
    }

    // Sum weights across all selected options
    for (const optionId of selectedOptionIds) {
      const weights = this.ideologyEngine.getWeights(optionId, questions);

      // Sum party weights
      for (const [partyId, weight] of Object.entries(weights.partyWeights)) {
        if (partyId in partyScores) {
          partyScores[partyId] += weight;
        }
      }

      // Sum axis weights
      for (const [axisId, weight] of Object.entries(weights.axisWeights)) {
        if (axisId in axisScores) {
          axisScores[axisId] += weight;
        }
      }
    }

    return { partyScores, axisScores };
  }
}
