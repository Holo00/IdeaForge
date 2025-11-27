-- Add ai_prompt column to ideas table to store the complete prompt sent to the AI

ALTER TABLE ideas
ADD COLUMN ai_prompt TEXT;

COMMENT ON COLUMN ideas.ai_prompt IS 'Stores the complete prompt sent to the AI model for debugging and reproducibility';
