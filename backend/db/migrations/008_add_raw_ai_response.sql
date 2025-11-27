-- Add raw_ai_response column to ideas table to store the complete AI response for debugging

ALTER TABLE ideas
ADD COLUMN raw_ai_response TEXT;

COMMENT ON COLUMN ideas.raw_ai_response IS 'Stores the complete raw response from the AI model for debugging and analysis purposes';
