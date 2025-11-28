-- Ensure default configuration profile exists
-- This handles cases where migration 003 partially failed

INSERT INTO configuration_profiles (name, folder_name, description, is_active)
VALUES (
  'Default Configuration',
  'config',
  'Standard configuration',
  true
) ON CONFLICT (name) DO NOTHING;