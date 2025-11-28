-- Configuration Profiles table
-- Stores metadata about configuration sets (hybrid: DB metadata + filesystem YAMLs)
CREATE TABLE IF NOT EXISTS configuration_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  folder_name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index for quick active profile lookup
CREATE INDEX IF NOT EXISTS idx_configuration_profiles_active ON configuration_profiles(is_active) WHERE is_active = true;

-- Insert default configuration profile if not exists
INSERT INTO configuration_profiles (name, folder_name, description, is_active)
VALUES (
  'Default Configuration',
  'default',
  'Standard configuration copied from research-system',
  true
) ON CONFLICT (name) DO NOTHING;

-- Add comment for documentation
COMMENT ON TABLE configuration_profiles IS 'Stores metadata for configuration profiles. YAML files are stored in backend/configs/{folder_name}/';

-- Note: pgvector extension and embedding column are optional
-- They will be added by migration 003b if the vector extension is available
