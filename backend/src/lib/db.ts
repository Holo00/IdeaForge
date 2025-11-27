import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Create PostgreSQL connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 50, // Increased from 20 to handle concurrent requests
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increased from 2000ms to 10000ms
});

// Handle pool errors (don't log successful connections - creates too much noise)
pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  process.exit(-1);
});

// Log pool status periodically to monitor connection usage
setInterval(() => {
  console.log('[DB Pool] Total:', pool.totalCount, 'Idle:', pool.idleCount, 'Waiting:', pool.waitingCount);
}, 5000);

// Helper function to execute queries
export async function query<T>(text: string, params?: any[]): Promise<T[]> {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result.rows;
  } catch (error) {
    console.error('Database query error:', { text, error });
    throw error;
  }
}

// Helper for single row queries
export async function queryOne<T>(text: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}

// Transaction helper
export async function transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
