-- Migration: Add auto-generation fields to generation_slots
-- Enables automatic idea generation at configurable intervals

ALTER TABLE generation_slots
ADD COLUMN IF NOT EXISTS auto_generate BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_generate_interval_minutes INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS next_auto_generate_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_auto_generate_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add constraint for minimum interval (1 minute)
ALTER TABLE generation_slots
ADD CONSTRAINT check_auto_generate_interval
CHECK (auto_generate_interval_minutes >= 1 AND auto_generate_interval_minutes <= 1440);

-- Create index for finding slots due for auto-generation
CREATE INDEX IF NOT EXISTS idx_generation_slots_next_auto
ON generation_slots(next_auto_generate_at)
WHERE auto_generate = true AND is_enabled = true;
