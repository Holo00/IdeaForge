import { pool } from '../src/lib/db';
import * as fs from 'fs';
import * as path from 'path';

async function runMigrations() {
  console.log('Starting database migrations...');

  try {
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

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir).sort();

    for (const file of files) {
      if (!file.endsWith('.sql')) continue;

      // Skip if already executed
      if (executedMigrations.has(file)) {
        console.log(`⊘ Skipping (already executed): ${file}`);
        continue;
      }

      console.log(`Running migration: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      await pool.query(sql);

      // Record the migration as executed
      await pool.query(
        'INSERT INTO schema_migrations (migration_name) VALUES ($1)',
        [file]
      );

      console.log(`✓ Completed: ${file}`);
    }

    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
