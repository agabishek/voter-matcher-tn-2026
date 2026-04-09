/**
 * IdeologyMappingEngine - Validates question bank against Party and Axis registries
 * 
 * This module implements validation logic to ensure question weights are consistent
 * with the registered parties and axes in the configuration system.
 * 
 * Validation Rules:
 * - All party IDs in question weights must exist in Party_Registry
 * - All axis IDs in question weights must exist in Axis_Registry
 * - All active parties must have weights defined for each option
 * - Weight values must be within the configured range
 * 
 * @module engines/ideologyMappingEngine
 */

import type { ConfigBundle, QuestionBank } from '@/lib/configLoader';

export interface ValidationError {
  questionId: string;
  optionId?: string;
  errorType: 'missing_party_weight' | 'unknown_party_id' | 'unknown_axis_id' | 'weight_out_of_range';
  message: string;
  details?: Record<string, unknown>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface WeightEmission {
  partyWeights: Record<string, number>;
  axisWeights: Record<string, number>;
}

/**
 * IdeologyMappingEngine - Validates question bank integrity
 * 
 * Responsibilities:
 * - Validate all party IDs in questions exist in Party_Registry
 * - Validate all axis IDs in questions exist in Axis_Registry
 * - Ensure all active parties have weights for each option
 * - Verify weight values are within configured range
 * - Emit weights for selected options
 */
export class IdeologyMappingEngine {
  /**
   * Validate question bank against Party and Axis registries
   * @param questions QuestionBank to validate
   * @param config ConfigBundle containing registries and scoring params
   * @returns ValidationResult with errors if any
   * @throws Error if validation fails with descriptive message
   */
  validate(questions: QuestionBank, config: ConfigBundle): ValidationResult {
    const errors: ValidationError[] = [];
    
    // Extract active party IDs from Party_Registry
    const activePartyIds = new Set(
      config.parties.parties
        .filter(party => party.active)
        .map(party => party.id)
    );
    
    // Extract all valid axis IDs from Axis_Registry
    const validAxisIds = new Set(
      config.axes.axes.map(axis => axis.id)
    );
    
    // Get weight range from scoring params
    const { min: minWeight, max: maxWeight } = config.scoringParams.weightRange;
    
    // Validate each question
    for (const question of questions.questions) {
      // Validate each option in the question
      for (const option of question.options) {
        // Check 1: Validate all party IDs in partyWeights exist in Party_Registry
        for (const partyId of Object.keys(option.partyWeights)) {
          if (!config.parties.parties.some(party => party.id === partyId)) {
            errors.push({
              questionId: question.id,
              optionId: option.id,
              errorType: 'unknown_party_id',
              message: `Question ${question.id}, Option ${option.id}: Unknown party ID "${partyId}". Party does not exist in Party_Registry.`,
              details: { partyId, availableParties: Array.from(activePartyIds) }
            });
          }
        }
        
        // Check 2: Validate all axis IDs in axisWeights exist in Axis_Registry
        for (const axisId of Object.keys(option.axisWeights)) {
          if (!validAxisIds.has(axisId)) {
            errors.push({
              questionId: question.id,
              optionId: option.id,
              errorType: 'unknown_axis_id',
              message: `Question ${question.id}, Option ${option.id}: Unknown axis ID "${axisId}". Axis does not exist in Axis_Registry.`,
              details: { axisId, availableAxes: Array.from(validAxisIds) }
            });
          }
        }
        
        // Check 3: Ensure all active parties have weights defined
        for (const partyId of activePartyIds) {
          if (!(partyId in option.partyWeights)) {
            errors.push({
              questionId: question.id,
              optionId: option.id,
              errorType: 'missing_party_weight',
              message: `Question ${question.id}, Option ${option.id}: Missing weight for active party "${partyId}".`,
              details: { partyId, definedParties: Object.keys(option.partyWeights) }
            });
          }
        }
        
        // Check 4: Validate weight values are within range
        for (const [partyId, weight] of Object.entries(option.partyWeights)) {
          if (weight < minWeight || weight > maxWeight) {
            errors.push({
              questionId: question.id,
              optionId: option.id,
              errorType: 'weight_out_of_range',
              message: `Question ${question.id}, Option ${option.id}: Party weight for "${partyId}" is ${weight}, which is outside the valid range [${minWeight}, ${maxWeight}].`,
              details: { partyId, weight, minWeight, maxWeight }
            });
          }
        }
        
        for (const [axisId, weight] of Object.entries(option.axisWeights)) {
          if (weight < minWeight || weight > maxWeight) {
            errors.push({
              questionId: question.id,
              optionId: option.id,
              errorType: 'weight_out_of_range',
              message: `Question ${question.id}, Option ${option.id}: Axis weight for "${axisId}" is ${weight}, which is outside the valid range [${minWeight}, ${maxWeight}].`,
              details: { axisId, weight, minWeight, maxWeight }
            });
          }
        }
      }
    }
    
    // If there are errors, throw with descriptive message
    if (errors.length > 0) {
      const errorSummary = errors.map(e => e.message).join('\n');
      throw new Error(
        `Question bank validation failed with ${errors.length} error(s):\n${errorSummary}`
      );
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Get weights for a selected option
   * @param optionId Option ID to get weights for
   * @param questions QuestionBank containing the option
   * @returns WeightEmission with party and axis weights
   * @throws Error if option is not found
   */
  getWeights(optionId: string, questions: QuestionBank): WeightEmission {
    // Find the option in the question bank
    for (const question of questions.questions) {
      const option = question.options.find(opt => opt.id === optionId);
      if (option) {
        return {
          partyWeights: { ...option.partyWeights },
          axisWeights: { ...option.axisWeights }
        };
      }
    }
    
    throw new Error(`Option with ID "${optionId}" not found in question bank.`);
  }
}
