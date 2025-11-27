/**
 * Migration script to rename old criteria keys to new ones in existing ideas
 *
 * This handles:
 * 1. Renaming keys in the `scores` JSONB field
 * 2. Renaming keys in the `evaluation_details` JSONB field
 *
 * Old -> New mappings based on current config (Prod1/evaluation-criteria.yaml):
 * - problemSeverity -> customerDesperationLevel
 * - marketSize -> (keep for now, different concept)
 * - competition/competitionLevel -> (no direct mapping, remove)
 * - monetization/monetizationClarity -> (no direct mapping, keep monetization data)
 * - technicalFeasibility -> (no direct mapping, keep)
 * - personalInterest -> (no direct mapping, remove)
 * - unfairAdvantage -> switchingCostAdvantage (closest match)
 * - timeToMarket -> timeToValueSpeed
 * - regulatoryMoatPotential -> regulatoryComplexity
 * - scalabilityPotential -> expansionRevenuePotential (closest match)
 * - networkEffects -> (no direct mapping, remove)
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Mapping of old keys to new keys
// null means remove the key (no equivalent in new schema)
const KEY_MAPPINGS: Record<string, string | null> = {
  // Direct mappings
  'regulatoryMoatPotential': 'regulatoryComplexity',
  'time-to-valueSpeed': 'timeToValueSpeed', // Fix hyphen issue

  // Conceptual mappings (old -> closest new equivalent)
  'problemSeverity': 'customerDesperationLevel',
  'timeToMarket': 'timeToValueSpeed',
  'unfairAdvantage': 'switchingCostAdvantage',
  'scalabilityPotential': 'expansionRevenuePotential',

  // Keys to remove (no equivalent in new schema)
  'competition': null,
  'competitionLevel': null,
  'personalInterest': null,
  'networkEffects': null,
  'marketSize': null, // Different concept now
  'monetization': null, // Different concept now
  'monetizationClarity': null,
  'technicalFeasibility': null,
};

async function migrateIdea(ideaId: string, scores: any, evaluationDetails: any): Promise<{ scores: any; evaluationDetails: any }> {
  const newScores = { ...scores };
  const newEvaluationDetails = { ...evaluationDetails };

  for (const [oldKey, newKey] of Object.entries(KEY_MAPPINGS)) {
    // Migrate scores
    if (oldKey in newScores) {
      if (newKey === null) {
        // Remove the key
        delete newScores[oldKey];
      } else if (!(newKey in newScores)) {
        // Rename: copy to new key, delete old
        newScores[newKey] = newScores[oldKey];
        delete newScores[oldKey];
      } else {
        // New key already exists, just delete old
        delete newScores[oldKey];
      }
    }

    // Migrate evaluation details
    if (oldKey in newEvaluationDetails) {
      if (newKey === null) {
        delete newEvaluationDetails[oldKey];
      } else if (!(newKey in newEvaluationDetails)) {
        newEvaluationDetails[newKey] = newEvaluationDetails[oldKey];
        delete newEvaluationDetails[oldKey];
      } else {
        delete newEvaluationDetails[oldKey];
      }
    }
  }

  return { scores: newScores, evaluationDetails: newEvaluationDetails };
}

async function main() {
  console.log('Starting criteria key migration...\n');

  try {
    // Get all ideas with scores
    const result = await pool.query(`
      SELECT id, name, scores, evaluation_details
      FROM ideas
      WHERE scores IS NOT NULL
    `);

    console.log(`Found ${result.rows.length} ideas to process\n`);

    let updated = 0;
    let skipped = 0;

    for (const row of result.rows) {
      const { id, name, scores, evaluation_details } = row;

      // Check if any old keys exist
      const hasOldKeys = Object.keys(KEY_MAPPINGS).some(
        oldKey => (scores && oldKey in scores) || (evaluation_details && oldKey in evaluation_details)
      );

      if (!hasOldKeys) {
        skipped++;
        continue;
      }

      // Migrate the keys
      const { scores: newScores, evaluationDetails: newEvaluationDetails } = await migrateIdea(
        id,
        scores || {},
        evaluation_details || {}
      );

      // Update the database
      await pool.query(`
        UPDATE ideas
        SET scores = $1, evaluation_details = $2, updated_at = NOW()
        WHERE id = $3
      `, [JSON.stringify(newScores), JSON.stringify(newEvaluationDetails), id]);

      console.log(`✓ Updated: ${name.substring(0, 50)}...`);
      updated++;
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`Migration complete!`);
    console.log(`  Updated: ${updated} ideas`);
    console.log(`  Skipped: ${skipped} ideas (already using new keys)`);
    console.log(`${'='.repeat(50)}\n`);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();