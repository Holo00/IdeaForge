import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './api/middleware/errorHandler';
import { pool } from './lib/db';
import ideasRouter from './api/routes/ideas';
import generationRouter from './api/routes/generation';
import configRouter from './api/routes/config';
import logsRouter from './api/routes/logs';
import authRouter, { requireAuth } from './api/routes/auth';
import { startAutoGenerationScheduler, stopAutoGenerationScheduler } from './services/autoGenerationScheduler';
import { runMigrations } from './lib/runMigrations';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRouter);

// Public API routes (ideas has internal auth for write operations)
app.use('/api/ideas', ideasRouter);

// Protected API routes (require authentication)
app.use('/api', requireAuth, generationRouter);
app.use('/api/config', requireAuth, configRouter);
app.use('/api/logs', requireAuth, logsRouter);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
async function startServer() {
  // Start HTTP server first so healthcheck passes
  const server = app.listen(PORT, () => {
    console.log(`\n✓ Server running on port ${PORT}`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`  API: http://localhost:${PORT}/api`);
    console.log(`  Health: http://localhost:${PORT}/health`);
  });

  // Then initialize database and scheduler
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✓ Database connection successful');

    // Run database migrations
    await runMigrations();

    // Start auto-generation scheduler
    startAutoGenerationScheduler();
    console.log('✓ Auto-generation scheduler started');
  } catch (error) {
    console.error('Database/migration error (server still running):', error);
    // Don't exit - let the server keep running for debugging
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  stopAutoGenerationScheduler();
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  stopAutoGenerationScheduler();
  await pool.end();
  process.exit(0);
});

startServer();
