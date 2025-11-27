-- Add action_plan column to store execution roadmap

-- Add action_plan to store next steps, resources, timeline, and critical path
ALTER TABLE ideas
ADD COLUMN action_plan JSONB;

-- Add comment to document the structure
COMMENT ON COLUMN ideas.action_plan IS 'JSON structure: {nextSteps: [{step, title, description, duration, blockers, successMetric}], requiredResources: {technical, financial, team, legal}, timeline: {mvp, firstRevenue, breakeven}, criticalPath: []}';

-- Example structure for documentation:
--
-- action_plan:
-- {
--   "nextSteps": [
--     {
--       "step": 1,
--       "title": "Validate problem with target users",
--       "description": "Interview 15 therapists about documentation pain points and current workflows",
--       "duration": "2 weeks",
--       "blockers": [],
--       "successMetric": "At least 80% confirm this is a top-3 pain point"
--     },
--     {
--       "step": 2,
--       "title": "Build manual prototype",
--       "description": "Use GPT-4 to manually transcribe and generate notes for 3 test sessions",
--       "duration": "1 week",
--       "blockers": ["Step 1: Need user access"],
--       "successMetric": "Notes pass therapist quality review with 90%+ accuracy"
--     }
--   ],
--   "requiredResources": {
--     "technical": ["Python", "OpenAI API", "HIPAA-compliant hosting (AWS)", "Encryption libraries"],
--     "financial": "$5K-10K (API costs: $1K, infrastructure: $2K, legal review: $2-5K)",
--     "team": ["1 full-stack developer", "1 therapist advisor (part-time)"],
--     "legal": ["HIPAA compliance review", "BAA agreements", "Privacy policy"]
--   },
--   "timeline": {
--     "mvp": "2-3 months",
--     "firstRevenue": "4 months",
--     "breakeven": "12-15 months (assumes 50 customers @$100/mo)"
--   },
--   "criticalPath": [
--     "HIPAA compliance is blocking - must be in place before any real patient data",
--     "Need 3-5 design partners willing to beta test with real sessions",
--     "Voice transcription accuracy must be 95%+ for clinical notes"
--   ]
-- }
