-- Increase field lengths for domain, problem, and solution
-- These fields often contain longer descriptive text from AI generation

ALTER TABLE ideas
  ALTER COLUMN domain TYPE VARCHAR(500),
  ALTER COLUMN subdomain TYPE VARCHAR(500),
  ALTER COLUMN problem TYPE TEXT,
  ALTER COLUMN solution TYPE TEXT;

-- Also update learnings table to match
ALTER TABLE learnings
  ALTER COLUMN domain TYPE VARCHAR(500),
  ALTER COLUMN problem TYPE TEXT,
  ALTER COLUMN solution TYPE TEXT;
