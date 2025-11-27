-- Migration: Add generation slots table
-- Stores configuration for each generation slot on the dashboard
-- Each slot can have a different profile and will later support automated job scheduling

CREATE TABLE IF NOT EXISTS generation_slots (
    id SERIAL PRIMARY KEY,
    slot_number INTEGER NOT NULL UNIQUE,
    profile_id UUID REFERENCES configuration_profiles(id) ON DELETE SET NULL,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_generation_slots_slot_number ON generation_slots(slot_number);
CREATE INDEX IF NOT EXISTS idx_generation_slots_profile_id ON generation_slots(profile_id);

-- Insert default slots (will be created based on settings, but start with 3)
INSERT INTO generation_slots (slot_number, profile_id, is_enabled)
SELECT
    s.num,
    (SELECT id FROM configuration_profiles WHERE is_active = true LIMIT 1),
    true
FROM generate_series(1, 3) AS s(num)
ON CONFLICT (slot_number) DO NOTHING;

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_generation_slots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generation_slots_updated_at ON generation_slots;
CREATE TRIGGER trigger_generation_slots_updated_at
    BEFORE UPDATE ON generation_slots
    FOR EACH ROW
    EXECUTE FUNCTION update_generation_slots_updated_at();
