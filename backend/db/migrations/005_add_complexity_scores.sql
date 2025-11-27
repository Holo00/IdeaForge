-- Add complexity_scores column to store derived execution complexity metrics

-- Add complexity_scores to store technical, regulatory, sales complexity
ALTER TABLE ideas
ADD COLUMN complexity_scores JSONB;

-- Add comment to document the structure
COMMENT ON COLUMN ideas.complexity_scores IS 'JSON structure: {technical: number, regulatory: number, sales: number, total: number}';

-- Example structure for documentation:
--
-- complexity_scores:
-- {
--   "technical": 7,       -- 11 - technicalFeasibility (1-10, higher = more complex)
--   "regulatory": 3,      -- Derived from timeToMarket evaluation (1-10)
--   "sales": 5,           -- 11 - ((marketSize + monetizationClarity) / 2)
--   "total": 15           -- Sum of technical + regulatory + sales (3-30)
-- }
--
-- Complexity Interpretation:
-- - Technical: How hard is it to build? (11 - technical feasibility score)
-- - Regulatory: How much red tape? (derived from time to market reasoning)
-- - Sales: How hard is it to sell? (inverse of market accessibility)
-- - Total: Overall execution complexity
--
-- Quadrant Classification:
-- - Quick Win: score > 60, total complexity < 15
-- - Big Bet: score > 60, total complexity >= 15
-- - Low Hanging Fruit: score <= 60, total complexity < 15
-- - Pass: score <= 60, total complexity >= 15
