-- Fix the single_active_config constraint
-- The current constraint UNIQUE NULLS NOT DISTINCT (is_active) prevents multiple false values
-- We need a partial unique index that only applies when is_active = true

-- Drop the existing constraint
ALTER TABLE configuration_profiles DROP CONSTRAINT IF EXISTS single_active_config;

-- Add a partial unique index that only enforces uniqueness for true values
CREATE UNIQUE INDEX single_active_config ON configuration_profiles (is_active) WHERE is_active = true;
