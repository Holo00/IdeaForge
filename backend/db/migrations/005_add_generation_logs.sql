-- Migration: Add idea generation logs table for real-time logging
-- This table stores detailed logs of the idea generation process

CREATE TABLE IF NOT EXISTS idea_generation_logs (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  stage VARCHAR(50) NOT NULL,
  level VARCHAR(20) NOT NULL, -- 'info', 'success', 'warning', 'error'
  message TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookups by session_id (for real-time streaming)
CREATE INDEX idx_generation_logs_session ON idea_generation_logs(session_id, created_at DESC);

-- Index for recent logs queries
CREATE INDEX idx_generation_logs_created_at ON idea_generation_logs(created_at DESC);

-- Table to track current generation status
CREATE TABLE IF NOT EXISTS generation_status (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL, -- 'in_progress', 'completed', 'failed'
  current_stage VARCHAR(50),
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,
  idea_id UUID REFERENCES ideas(id) ON DELETE SET NULL
);

-- Index for status lookups
CREATE INDEX idx_generation_status_session ON generation_status(session_id);
CREATE INDEX idx_generation_status_status ON generation_status(status, updated_at DESC);
