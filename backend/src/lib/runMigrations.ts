import { pool } from './db';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Run all pending database migrations
 * Returns true if successful, throws error on failure
 */
export async function runMigrations(): Promise<boolean> {
  console.log('Starting database migrations...');

  // Create migrations tracking table if it doesn't exist
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      migration_name VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Get list of already executed migrations
  const executedResult = await pool.query(
    'SELECT migration_name FROM schema_migrations ORDER BY migration_name'
  );
  const executedMigrations = new Set(
    executedResult.rows.map((row: any) => row.migration_name)
  );

  // In production (compiled), __dirname is dist/lib, migrations are in backend/db/migrations
  // In development (ts-node), __dirname is backend/src/lib
  const migrationsDir = path.join(__dirname, '..', '..', 'db', 'migrations');
  const files = fs.readdirSync(migrationsDir).sort();

  let migrationsRun = 0;

  for (const file of files) {
    if (!file.endsWith('.sql')) continue;

    // Skip if already executed
    if (executedMigrations.has(file)) {
      console.log(`  ⊘ Skipping (already executed): ${file}`);
      continue;
    }

    console.log(`  → Running migration: ${file}`);
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    await pool.query(sql);

    // Record the migration as executed
    await pool.query(
      'INSERT INTO schema_migrations (migration_name) VALUES ($1)',
      [file]
    );

    console.log(`  ✓ Completed: ${file}`);
    migrationsRun++;
  }

  if (migrationsRun > 0) {
    console.log(`✓ ${migrationsRun} migration(s) completed successfully!`);
  } else {
    console.log('✓ Database is up to date (no new migrations)');
  }

  return true;
}
