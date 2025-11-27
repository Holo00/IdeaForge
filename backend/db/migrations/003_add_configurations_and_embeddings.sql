-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Configuration Profiles table
-- Stores metadata about configuration sets (hybrid: DB metadata + filesystem YAMLs)
CREATE TABLE configuration_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  folder_name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Only one profile can be active at a time
  CONSTRAINT single_active_config UNIQUE NULLS NOT DISTINCT (is_active)
);

-- Index for quick active profile lookup
CREATE INDEX idx_configuration_profiles_active ON configuration_profiles(is_active) WHERE is_active = true;

-- Add embedding column to ideas table for semantic duplicate detection
ALTER TABLE ideas
ADD COLUMN embedding vector(1536); -- OpenAI embedding dimension

-- Create vector similarity index for fast semantic search
CREATE INDEX ON ideas USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Insert default configuration profile
INSERT INTO configuration_profiles (name, folder_name, description, is_active)
VALUES (
  'Default Configuration',
  'default',
  'Standard configuration copied from research-system',
  true
);

-- Add comment for documentation
COMMENT ON TABLE configuration_profiles IS 'Stores metadata for configuration profiles. YAML files are stored in backend/configs/{folder_name}/';
COMMENT ON COLUMN ideas.embedding IS 'Vector embedding of idea (domain+problem+solution+summary) for semantic similarity search';
