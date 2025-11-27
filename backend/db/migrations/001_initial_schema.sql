-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ideas table
CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(500) NOT NULL,
  folder_name VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  score INTEGER NOT NULL,

  -- Classification
  domain VARCHAR(255) NOT NULL,
  subdomain VARCHAR(255),
  problem VARCHAR(255) NOT NULL,
  solution VARCHAR(255) NOT NULL,

  -- Scoring breakdown (individual scores 1-10)
  scores JSONB NOT NULL,

  -- Content
  quick_summary TEXT NOT NULL,
  concrete_example JSONB NOT NULL,
  evaluation_details JSONB NOT NULL,

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  generation_framework VARCHAR(100),

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Relationships
  parent_idea_id UUID REFERENCES ideas(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('draft', 'validation', 'research', 'build', 'archived')),
  CONSTRAINT valid_score CHECK (score >= 0 AND score <= 100)
);

-- Config table (stores YAML configs as JSONB)
CREATE TABLE config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(100) NOT NULL UNIQUE,
  data JSONB NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_category CHECK (category IN (
    'business_domains',
    'problem_types',
    'solution_types',
    'monetization_models',
    'target_audiences',
    'technologies',
    'market_sizes',
    'evaluation_criteria',
    'competitive_advantages',
    'idea_prompts'
  ))
);

-- Generation jobs table
CREATE TABLE generation_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  idea_id UUID REFERENCES ideas(id) ON DELETE SET NULL,
  error TEXT,
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,

  CONSTRAINT valid_job_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Idea history table (track evolution)
CREATE TABLE idea_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  change_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  before_data JSONB,
  after_data JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_change_type CHECK (change_type IN (
    'created', 'updated', 'status_changed', 'refined', 'merged', 'archived'
  ))
);

-- Learnings table
CREATE TABLE learnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain VARCHAR(255) NOT NULL,
  problem VARCHAR(255) NOT NULL,
  solution VARCHAR(255),
  insight TEXT NOT NULL,
  source VARCHAR(255) NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_ideas_status ON ideas(status);
CREATE INDEX idx_ideas_domain ON ideas(domain);
CREATE INDEX idx_ideas_score ON ideas(score DESC);
CREATE INDEX idx_ideas_created_at ON ideas(created_at DESC);
CREATE INDEX idx_ideas_tags ON ideas USING GIN(tags);
CREATE INDEX idx_generation_jobs_status ON generation_jobs(status);
CREATE INDEX idx_idea_history_idea_id ON idea_history(idea_id);
CREATE INDEX idx_learnings_domain ON learnings(domain);
CREATE INDEX idx_learnings_tags ON learnings USING GIN(tags);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_ideas_updated_at
  BEFORE UPDATE ON ideas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_config_updated_at
  BEFORE UPDATE ON config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
