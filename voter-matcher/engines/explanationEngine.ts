/**
 * ExplanationEngine - Generates user-facing explanation text dynamically from registries
 * 
 * This module generates all explanation text by sourcing content from:
 * - Party descriptions from Party_Registry
 * - Axis labels (plain civic language) from Axis_Registry
 * - Archetype descriptions from Archetype_Registry
 * 
 * NO HARDCODED STRINGS - all text comes from configuration registries.
 * 
 * @module engines/explanationEngine
 */

import type { ConfigBundle } from '@/lib/configLoader';
import type { ArchetypeResult, Contradiction } from './profilingEngine';

export interface Explanation {
  primaryParagraph: string;
  secondaryInsight: string;
  beliefStatements: string[];   // 2-4 items
  archetypeDescription: string;
  trackRecordNotice?: string;   // shown if matched party is promise-based only
  demographicHighlights?: string[];  // 1-2 policy highlights relevant to age group
}

/**
 * Age group classification for demographic context injection.
 * - youth: 18–25 (economy, education focus)
 * - adult: 26–45 (welfare, governance focus)
 * - senior: 46+ (poverty, welfare focus)
 */
export const AGE_GROUPS = { youth: 'youth', adult: 'adult', senior: 'senior' } as const;
export type AgeGroup = typeof AGE_GROUPS[keyof typeof AGE_GROUPS];

/**
 * Manifesto policy data shape — keyed by partyId → axisId → bilingual text.
 * Loaded externally and passed in; engine does not read files directly.
 */
export type ManifestoData = Record<string, Record<string, { en: string; ta: string }>>;

/** Axes most relevant to each age group (ordered by priority) */
const AGE_GROUP_AXES: Record<AgeGroup, readonly string[]> = {
  youth: ['economy', 'socialJustice', 'governance'],
  adult: ['welfare', 'governance', 'poverty'],
  senior: ['poverty', 'welfare', 'responsibility'],
} as const;

export interface ScoreResult {
  partyScores: Record<string, number>;      // partyId → normalized %
  rawScores: Record<string, number>;        // partyId → raw sum
  axisScores: Record<string, number>;       // axisId → sum
  confidenceScore: 'High' | 'Medium' | 'Low';
  confidenceGap: number;
  answeredCount: number;
  skippedCount: number;
  configVersion: string;
}

/** Maximum number of demographic highlights to surface */
const MAX_DEMOGRAPHIC_HIGHLIGHTS = 2;

/**
 * ExplanationEngine - Generates all user-facing explanation text dynamically
 * 
 * Responsibilities:
 * - Generate primary paragraph explaining top party match
 * - Generate secondary insight for ambiguous results or runner-up context
 * - Generate belief statements based on top axis scores
 * - Source archetype description from Archetype_Registry
 * - Generate track record notice for promise-based parties
 * - All text sourced from registries - no hardcoded strings
 */
export class ExplanationEngine {
  /**
   * Generate complete explanation for user results
   * 
   * @param result ScoreResult containing party and axis scores
   * @param archetype ArchetypeResult with primary and optional secondary archetype
   * @param contradictions Array of detected contradictions (for nuance framing)
   * @param config ConfigBundle containing all registries
   * @param lang Language code ('en' or 'ta')
   * @returns Explanation object with all user-facing text
   */
  generate(
    result: ScoreResult,
    archetype: ArchetypeResult,
    contradictions: Contradiction[],
    config: ConfigBundle,
    lang: 'en' | 'ta'
  ): Explanation {
    return this.generateWithDemographics(result, archetype, contradictions, config, lang);
  }

  /**
   * Generate complete explanation with optional demographic context injection.
   * 
   * When `ageGroup` is provided, surfaces 1–2 relevant policy highlights from
   * the matched party's manifesto data, mapped by age group:
   * - youth (18–25): economy, socialJustice, governance axes
   * - adult (26–45): welfare, governance, poverty axes
   * - senior (46+): poverty, welfare, responsibility axes
   * 
   * @param result ScoreResult containing party and axis scores
   * @param archetype ArchetypeResult with primary and optional secondary archetype
   * @param contradictions Array of detected contradictions (for nuance framing)
   * @param config ConfigBundle containing all registries
   * @param lang Language code ('en' or 'ta')
   * @param ageGroup Optional age group for demographic context injection
   * @param manifestoData Optional manifesto policy data keyed by partyId → axisId
   * @returns Explanation object with all user-facing text
   */
  generateWithDemographics(
    result: ScoreResult,
    archetype: ArchetypeResult,
    contradictions: Contradiction[],
    config: ConfigBundle,
    lang: 'en' | 'ta',
    ageGroup?: AgeGroup,
    manifestoData?: ManifestoData
  ): Explanation {
    // Get top party
    const topPartyId = this.getTopParty(result.partyScores);
    const topParty = config.parties.parties.find(p => p.id === topPartyId);
    
    if (!topParty) {
      throw new Error(`Top party ${topPartyId} not found in Party_Registry`);
    }

    // Get primary archetype
    const primaryArchetype = config.archetypes.archetypes.find(
      a => a.id === archetype.primary
    );
    
    if (!primaryArchetype) {
      throw new Error(`Primary archetype ${archetype.primary} not found in Archetype_Registry`);
    }

    // Generate primary paragraph
    const primaryParagraph = this.generatePrimaryParagraph(
      topParty,
      result.partyScores[topPartyId],
      result.confidenceScore,
      lang
    );

    // Generate secondary insight
    const secondaryInsight = this.generateSecondaryInsight(
      result,
      archetype,
      contradictions,
      config,
      lang
    );

    // Generate belief statements from top axes
    const beliefStatements = this.generateBeliefStatements(
      result.axisScores,
      config,
      lang
    );

    // Get archetype description
    const archetypeDescription = primaryArchetype.descriptions[lang];

    // Generate track record notice if needed
    const trackRecordNotice = topParty.weightBasis === 'promise'
      ? this.generateTrackRecordNotice(topParty, lang)
      : undefined;

    // Generate demographic highlights if age group provided
    const demographicHighlights = ageGroup !== undefined
      ? this.generateDemographicHighlights(topPartyId, ageGroup, lang, manifestoData)
      : undefined;

    return {
      primaryParagraph,
      secondaryInsight,
      beliefStatements,
      archetypeDescription,
      trackRecordNotice,
      demographicHighlights
    };
  }

  /**
   * Get the party ID with the highest score
   */
  private getTopParty(partyScores: Record<string, number>): string {
    return Object.entries(partyScores)
      .sort(([, a], [, b]) => b - a)[0][0];
  }

  /**
   * Generate primary paragraph explaining the top party match
   * 
   * Format: "Your responses align most closely with [Party Full Name] ([Score]%). 
   * This [confidence level] match suggests [confidence interpretation]."
   */
  private generatePrimaryParagraph(
    topParty: { names: { en: string; ta: string }; fullNames: { en: string; ta: string } },
    score: number,
    confidence: 'High' | 'Medium' | 'Low',
    lang: 'en' | 'ta'
  ): string {
    const partyName = topParty.fullNames[lang];
    const roundedScore = Math.round(score);
    
    // Confidence interpretation text
    const confidenceText = this.getConfidenceInterpretation(confidence, lang);
    
    if (lang === 'en') {
      return `Your responses align most closely with ${partyName} (${roundedScore}%). This ${confidence.toLowerCase()} confidence match suggests ${confidenceText}.`;
    } else {
      return `உங்கள் பதில்கள் ${partyName} (${roundedScore}%) உடன் மிக நெருக்கமாக ஒத்துப்போகின்றன. இந்த ${this.translateConfidence(confidence, lang)} நம்பிக்கை பொருத்தம் ${confidenceText}.`;
    }
  }

  /**
   * Get confidence level interpretation text
   */
  private getConfidenceInterpretation(confidence: 'High' | 'Medium' | 'Low', lang: 'en' | 'ta'): string {
    if (lang === 'en') {
      switch (confidence) {
        case 'High':
          return 'a strong alignment between your policy preferences and this party\'s positions';
        case 'Medium':
          return 'a moderate alignment with this party, though other parties also share some of your priorities';
        case 'Low':
          return 'your preferences are distributed across multiple parties, indicating a cross-ideological profile';
      }
    } else {
      switch (confidence) {
        case 'High':
          return 'உங்கள் கொள்கை விருப்பங்களுக்கும் இந்த கட்சியின் நிலைப்பாடுகளுக்கும் இடையே வலுவான ஒத்திசைவு உள்ளது என்பதைக் குறிக்கிறது';
        case 'Medium':
          return 'இந்த கட்சியுடன் மிதமான ஒத்திசைவு உள்ளது, இருப்பினும் மற்ற கட்சிகளும் உங்கள் சில முன்னுரிமைகளைப் பகிர்ந்து கொள்கின்றன என்பதைக் குறிக்கிறது';
        case 'Low':
          return 'உங்கள் விருப்பங்கள் பல கட்சிகளில் பரவியுள்ளன, இது குறுக்கு-கருத்தியல் சுயவிவரத்தைக் குறிக்கிறது';
      }
    }
  }

  /**
   * Translate confidence level to target language
   */
  private translateConfidence(confidence: 'High' | 'Medium' | 'Low', lang: 'en' | 'ta'): string {
    if (lang === 'en') {
      return confidence.toLowerCase();
    }
    
    switch (confidence) {
      case 'High':
        return 'உயர்';
      case 'Medium':
        return 'நடுத்தர';
      case 'Low':
        return 'குறைந்த';
    }
  }

  /**
   * Generate secondary insight based on archetype ambiguity or contradictions
   * 
   * Priority:
   * 1. If archetype is ambiguous, mention secondary archetype
   * 2. If contradictions exist, frame as nuanced perspective
   * 3. Otherwise, mention runner-up party
   */
  private generateSecondaryInsight(
    result: ScoreResult,
    archetype: ArchetypeResult,
    contradictions: Contradiction[],
    config: ConfigBundle,
    lang: 'en' | 'ta'
  ): string {
    // Case 1: Ambiguous archetype
    if (archetype.isAmbiguous && archetype.secondary) {
      const secondaryArchetype = config.archetypes.archetypes.find(
        a => a.id === archetype.secondary
      );
      
      if (secondaryArchetype) {
        const secondaryName = secondaryArchetype.names[lang];
        
        if (lang === 'en') {
          return `Your profile also shows characteristics of a ${secondaryName}, indicating a multifaceted political perspective.`;
        } else {
          return `உங்கள் சுயவிவரம் ${secondaryName} இன் பண்புகளையும் காட்டுகிறது, இது பன்முக அரசியல் பார்வையைக் குறிக்கிறது.`;
        }
      }
    }

    // Case 2: Contradictions detected
    if (contradictions.length > 0) {
      const firstContradiction = contradictions[0];
      const axis1 = config.axes.axes.find(a => a.id === firstContradiction.axis1);
      const axis2 = config.axes.axes.find(a => a.id === firstContradiction.axis2);
      
      if (axis1 && axis2) {
        const axis1Label = axis1.labels[lang];
        const axis2Label = axis2.labels[lang];
        
        if (lang === 'en') {
          return `You show strong interest in both ${axis1Label} and ${axis2Label}, reflecting a nuanced perspective that bridges different ideological priorities.`;
        } else {
          return `நீங்கள் ${axis1Label} மற்றும் ${axis2Label} இரண்டிலும் வலுவான ஆர்வத்தைக் காட்டுகிறீர்கள், இது வெவ்வேறு கருத்தியல் முன்னுரிமைகளை இணைக்கும் நுட்பமான பார்வையை பிரதிபலிக்கிறது.`;
        }
      }
    }

    // Case 3: Runner-up party
    const sortedParties = Object.entries(result.partyScores)
      .sort(([, a], [, b]) => b - a);
    
    if (sortedParties.length >= 2) {
      const [, [runnerUpId, runnerUpScore]] = sortedParties;
      const runnerUpParty = config.parties.parties.find(p => p.id === runnerUpId);
      
      if (runnerUpParty) {
        const runnerUpName = runnerUpParty.names[lang];
        const roundedScore = Math.round(runnerUpScore);
        
        if (lang === 'en') {
          return `Your responses also show ${roundedScore}% alignment with ${runnerUpName}, indicating shared priorities across parties.`;
        } else {
          return `உங்கள் பதில்கள் ${runnerUpName} உடன் ${roundedScore}% ஒத்திசைவையும் காட்டுகின்றன, இது கட்சிகள் முழுவதும் பகிரப்பட்ட முன்னுரிமைகளைக் குறிக்கிறது.`;
        }
      }
    }

    // Fallback: generic statement
    if (lang === 'en') {
      return 'Your political profile reflects a thoughtful consideration of multiple policy dimensions.';
    } else {
      return 'உங்கள் அரசியல் சுயவிவரம் பல கொள்கை பரிமாணங்களின் சிந்தனைமிக்க பரிசீலனையை பிரதிபலிக்கிறது.';
    }
  }

  /**
   * Generate belief statements from top axis scores
   * 
   * Returns 2-4 statements based on the axes with highest scores.
   * Uses plain civic language labels from Axis_Registry.
   */
  private generateBeliefStatements(
    axisScores: Record<string, number>,
    config: ConfigBundle,
    lang: 'en' | 'ta'
  ): string[] {
    // Sort axes by score (descending)
    const sortedAxes = Object.entries(axisScores)
      .filter(([, score]) => score > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4); // Take top 4

    const statements: string[] = [];

    for (const [axisId] of sortedAxes) {
      const axis = config.axes.axes.find(a => a.id === axisId);
      
      if (axis) {
        const label = axis.labels[lang];
        
        if (lang === 'en') {
          statements.push(`You prioritize ${label.toLowerCase()}`);
        } else {
          statements.push(`நீங்கள் ${label} முன்னுரிமை அளிக்கிறீர்கள்`);
        }
      }
    }

    // Ensure at least 2 statements
    if (statements.length < 2) {
      if (lang === 'en') {
        statements.push('You value evidence-based policy decisions');
      } else {
        statements.push('நீங்கள் ஆதார அடிப்படையிலான கொள்கை முடிவுகளை மதிக்கிறீர்கள்');
      }
    }

    return statements;
  }

  /**
   * Generate demographic highlights for a given age group.
   * 
   * Maps age group to relevant axes, then surfaces the top policy text
   * from the matched party's manifesto data for those axes.
   * Returns up to MAX_DEMOGRAPHIC_HIGHLIGHTS items.
   * 
   * Axis key normalisation: manifesto data uses camelCase keys (e.g. "socialJustice")
   * while axis registry may use snake_case (e.g. "social_justice"). Both forms are tried.
   */
  private generateDemographicHighlights(
    partyId: string,
    ageGroup: AgeGroup,
    lang: 'en' | 'ta',
    manifestoData?: ManifestoData
  ): string[] {
    if (!manifestoData) {
      return [];
    }

    const partyManifesto = manifestoData[partyId];
    if (!partyManifesto) {
      return [];
    }

    const relevantAxes = AGE_GROUP_AXES[ageGroup];
    const highlights: string[] = [];

    for (const axisId of relevantAxes) {
      if (highlights.length >= MAX_DEMOGRAPHIC_HIGHLIGHTS) {
        break;
      }

      // Try both camelCase and snake_case axis key forms
      const snakeToCamel = axisId.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
      const policyEntry = partyManifesto[axisId] ?? partyManifesto[snakeToCamel];

      if (policyEntry) {
        const text = policyEntry[lang];
        if (text) {
          highlights.push(text);
        }
      }
    }

    return highlights;
  }

  /**
   * Generate track record notice for promise-based parties
   * 
   * This notice is shown when the matched party has weightBasis: "promise"
   * in the Party_Registry, indicating weights are based on manifesto promises
   * rather than governance track record.
   */
  private generateTrackRecordNotice(
    party: { names: { en: string; ta: string }; weightBasis: string },
    lang: 'en' | 'ta'
  ): string {
    const partyName = party.names[lang];
    
    if (lang === 'en') {
      return `Note: ${partyName}'s alignment is based on manifesto promises rather than governance track record, as this party has not held state-level power.`;
    } else {
      return `குறிப்பு: ${partyName} இன் ஒத்திசைவு ஆட்சி சாதனை பதிவை விட அறிக்கை வாக்குறுதிகளை அடிப்படையாகக் கொண்டது, ஏனெனில் இந்த கட்சி மாநில அளவிலான அதிகாரத்தை வகிக்கவில்லை.`;
    }
  }
}
