-- Migration: Add indexes for advanced filtering
-- This improves query performance for JSONB fields used in filtering

-- Enable pg_trgm extension for trigram search (required for ILIKE performance)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN index for idea_components JSONB field (supports all JSONB operators)
CREATE INDEX IF NOT EXISTS idx_ideas_idea_components ON ideas USING GIN (idea_components);

-- B-tree indexes for specific JSONB paths used in filtering
CREATE INDEX IF NOT EXISTS idx_ideas_monetization ON ideas ((idea_components->>'monetization'));
CREATE INDEX IF NOT EXISTS idx_ideas_target_audience ON ideas ((idea_components->>'targetAudience'));
CREATE INDEX IF NOT EXISTS idx_ideas_technology ON ideas ((idea_components->>'technology'));
CREATE INDEX IF NOT EXISTS idx_ideas_team_size ON ideas (((idea_components->>'estimatedTeamSize')::int));

-- GIN index for scores JSONB field
CREATE INDEX IF NOT EXISTS idx_ideas_scores ON ideas USING GIN (scores);

-- Index for generation_framework (used in filtering)
CREATE INDEX IF NOT EXISTS idx_ideas_generation_framework ON ideas (generation_framework);

-- Index for subdomain (now filterable)
CREATE INDEX IF NOT EXISTS idx_ideas_subdomain ON ideas (subdomain);

-- Full-text search index for name and quick_summary
CREATE INDEX IF NOT EXISTS idx_ideas_name_trgm ON ideas USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_ideas_summary_trgm ON ideas USING GIN (quick_summary gin_trgm_ops);

-- Note: The trigram indexes above require the pg_trgm extension
-- Run this if not already enabled: CREATE EXTENSION IF NOT EXISTS pg_trgm;