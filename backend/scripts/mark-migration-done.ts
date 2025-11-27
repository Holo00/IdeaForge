/**
 * Utility script to mark a migration as already executed.
 *
 * Use this when:
 * - Setting up a new database where schema already exists
 * - Skipping migrations that were applied manually
 * - Fresh DB setup where SQL was run directly
 *
 * Usage:
 *   npx ts-node scripts/mark-migration-done.ts <migration_name>
 *   npx ts-node scripts/mark-migration-done.ts 001_initial_schema.sql
 *   npx ts-node scripts/mark-migration-done.ts --all  (marks all migrations as done)
 */

import { pool } from '../src/lib/db';
import fs from 'fs';
import path from 'path';

async function markMigrationDone(migrationName?: string, markAll: boolean = false) {
  try {
    // Create migrations tracking table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    if (markAll) {
      // Get all migration files
      const migrationsDir = path.join(__dirname, '../db/migrations');
      const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();

      for (const file of files) {
        await pool.query(
          'INSERT INTO schema_migrations (migration_name) VALUES ($1) ON CONFLICT (migration_name) DO NOTHING',
          [file]
        );
        console.log(`✓ Marked ${file} as executed`);
      }

      console.log(`\n✓ Marked all ${files.length} migrations as executed`);
    } else if (migrationName) {
      // Mark single migration
      await pool.query(
        'INSERT INTO schema_migrations (migration_name) VALUES ($1) ON CONFLICT (migration_name) DO NOTHING',
        [migrationName]
      );
      console.log(`✓ Marked ${migrationName} as executed`);
    } else {
      console.error('Usage:');
      console.error('  npx ts-node scripts/mark-migration-done.ts <migration_name>');
      console.error('  npx ts-node scripts/mark-migration-done.ts --all');
      console.error('\nExamples:');
      console.error('  npx ts-node scripts/mark-migration-done.ts 001_initial_schema.sql');
      console.error('  npx ts-node scripts/mark-migration-done.ts --all');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Parse command line arguments
const arg = process.argv[2];
const markAll = arg === '--all';
const migrationName = markAll ? undefined : arg;

markMigrationDone(migrationName, markAll);