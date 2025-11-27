-- Migration: Add slot_number to generation_status
-- Links generation sessions to specific slots for dashboard real-time monitoring
-- This supports both manual triggers and future job-triggered generations

ALTER TABLE generation_status
ADD COLUMN IF NOT EXISTS slot_number INTEGER DEFAULT NULL;

-- Create index for quick lookups by slot
CREATE INDEX IF NOT EXISTS idx_generation_status_slot ON generation_status(slot_number, status);

-- Note: The active_session_id column added in migration 013 to generation_slots
-- is not needed with this approach and can be ignored. We use generation_status
-- as the single source of truth for "what's running where".
