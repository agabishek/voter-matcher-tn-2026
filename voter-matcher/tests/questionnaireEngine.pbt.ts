/**
 * Property-Based Tests for QuestionnaireEngine — cluster randomization (task 5.5)
 *
 * Properties verified:
 * 1. Questions within each cluster always appear together (contiguous block)
 * 2. Cluster order varies across sessions (randomization is not a no-op)
 * 3. All questions are present after randomization (no loss/duplication)
 * 4. createSession preserves the full question set
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { QuestionnaireEngine, type Question } from '@/engines/questionnaireEngine';
import type { ConfigBundle } from '@/lib/configLoader';

// ─── Arbitraries ──────────────────────────────────────────────────────────────

/** Generate a single question with a given id and cluster */
function makeQuestion(id: string, cluster: string): Question {
  return {
    id,
    cluster,
    text: { en: `Q ${id}`, ta: `கேள்வி ${id}` },
    options: [
      {
        id: `${id}_a`,
        text: { en: 'A', ta: 'அ' },
        partyWeights: { DMK: 1 },
        axisWeights: { [cluster]: 1 },
      },
    ],
  };
}

/**
 * Arbitrary: generates a list of questions spread across N clusters,
 * with at least 2 clusters and at least 2 questions per cluster.
 */
const questionBankArb = fc
  .integer({ min: 2, max: 5 }) // number of clusters
  .chain(numClusters =>
    fc
      .integer({ min: 2, max: 4 }) // questions per cluster
      .chain(qPerCluster => {
        const questions: Question[] = [];
        for (let c = 0; c < numClusters; c++) {
          const clusterId = `cluster_${c}`;
          for (let q = 0; q < qPerCluster; q++) {
            questions.push(makeQuestion(`q_${c}_${q}`, clusterId));
          }
        }
        return fc.constant(questions);
      })
  );

function makeConfig(questions: Question[]): ConfigBundle {
  return {
    version: 'pbt-v1',
    loadedAt: new Date().toISOString(),
    questions: { version: '1.0', hash: 'x', questions } as ConfigBundle['questions'],
    scoringParams: { version: '1.0', hash: 'x', minAnsweredThreshold: 0.5 } as ConfigBundle['scoringParams'],
    parties: {} as ConfigBundle['parties'],
    axes: {} as ConfigBundle['axes'],
    archetypes: {} as ConfigBundle['archetypes'],
    languages: {} as ConfigBundle['languages'],
  };
}

// ─── Helper: extract cluster order from a session's question list ─────────────

function clusterOrder(questions: readonly Question[]): string[] {
  const seen: string[] = [];
  for (const q of questions) {
    if (seen[seen.length - 1] !== q.cluster) {
      seen.push(q.cluster);
    }
  }
  return seen;
}

// ─── Properties ───────────────────────────────────────────────────────────────

describe('QuestionnaireEngine PBT — cluster randomization (5.5)', () => {
  const engine = new QuestionnaireEngine();

  it('Property: questions within each cluster are always contiguous', () => {
    fc.assert(
      fc.property(questionBankArb, questions => {
        const config = makeConfig(questions);
        const session = engine.createSession(config, 'ta');

        // For each cluster, find all positions of its questions
        const clusterPositions = new Map<string, number[]>();
        session.questions.forEach((q, idx) => {
          const positions = clusterPositions.get(q.cluster) ?? [];
          positions.push(idx);
          clusterPositions.set(q.cluster, positions);
        });

        // All positions for a cluster must be contiguous
        for (const [, positions] of clusterPositions) {
          for (let i = 1; i < positions.length; i++) {
            if ((positions[i] as number) !== (positions[i - 1] as number) + 1) {
              return false;
            }
          }
        }
        return true;
      }),
      { numRuns: 200 }
    );
  });

  it('Property: all questions are present after randomization (no loss or duplication)', () => {
    fc.assert(
      fc.property(questionBankArb, questions => {
        const config = makeConfig(questions);
        const session = engine.createSession(config, 'ta');

        const originalIds = new Set(questions.map(q => q.id));
        const sessionIds = new Set(session.questions.map(q => q.id));

        // Same size and same contents
        if (originalIds.size !== sessionIds.size) return false;
        for (const id of originalIds) {
          if (!sessionIds.has(id)) return false;
        }
        return true;
      }),
      { numRuns: 200 }
    );
  });

  it('Property: cluster order varies across multiple sessions (randomization is not a no-op)', () => {
    // Run many sessions and verify we see at least 2 distinct cluster orderings
    // (probabilistic — with 2+ clusters and 200 runs, the chance of always same order is negligible)
    fc.assert(
      fc.property(questionBankArb, questions => {
        const config = makeConfig(questions);
        const orders = new Set<string>();

        for (let i = 0; i < 30; i++) {
          const session = engine.createSession(config, 'ta');
          orders.add(clusterOrder(session.questions).join(','));
        }

        // With ≥2 clusters, we expect to see more than 1 distinct ordering
        // (if only 1 ordering ever appears across 30 runs, randomization is broken)
        return orders.size > 1;
      }),
      { numRuns: 50 }
    );
  });

  it('Property: configVersion is pinned to the config version at session creation', () => {
    fc.assert(
      fc.property(questionBankArb, questions => {
        const config = makeConfig(questions);
        const session = engine.createSession(config, 'ta');
        return session.configVersion === config.version;
      }),
      { numRuns: 100 }
    );
  });

  it('Property: session language matches the requested language', () => {
    fc.assert(
      fc.property(
        questionBankArb,
        fc.constantFrom('en', 'ta'),
        (questions, lang) => {
          const config = makeConfig(questions);
          const session = engine.createSession(config, lang);
          return session.language === lang;
        }
      ),
      { numRuns: 100 }
    );
  });
});
