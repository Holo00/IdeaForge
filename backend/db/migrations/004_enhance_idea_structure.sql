-- Add new JSONB columns to store enhanced idea components

-- Add idea_components to store monetization, target audience, technology, market size
ALTER TABLE ideas
ADD COLUMN idea_components JSONB;

-- Add evaluation_questions to store Q&A for each criterion
ALTER TABLE ideas
ADD COLUMN evaluation_questions JSONB;

-- Add quick_notes to store strengths, weaknesses, assumptions, next steps, references
ALTER TABLE ideas
ADD COLUMN quick_notes JSONB;

-- Add comments to document the structure
COMMENT ON COLUMN ideas.idea_components IS 'JSON structure: {monetization, targetAudience, technology, marketSize}';
COMMENT ON COLUMN ideas.evaluation_questions IS 'JSON structure: {criterionName: {questions: [{question, answer}]}}';
COMMENT ON COLUMN ideas.quick_notes IS 'JSON structure: {strengths: [], weaknesses: [], keyAssumptions: [], nextSteps: [], references: []}';

-- Example structures for documentation:
--
-- idea_components:
-- {
--   "monetization": "Monthly Subscription (per therapist)",
--   "targetAudience": "Mental Health Professionals (therapists, counselors, psychologists)",
--   "technology": "AI/ML + Voice Transcription + HIPAA-compliant cloud infrastructure",
--   "marketSize": "Mid-Market (350,000+ licensed therapists in US alone)"
-- }
--
-- evaluation_questions:
-- {
--   "problemSeverity": {
--     "questions": [
--       {
--         "question": "How often does this problem occur?",
--         "answer": "Every single session, multiple times per day"
--       },
--       {
--         "question": "What's the cost of not solving it?",
--         "answer": "5-10 hours/week unpaid work, burnout, therapists leaving profession"
--       },
--       {
--         "question": "Do people actively seek solutions?",
--         "answer": "Yes - 'therapy documentation software' gets significant searches"
--       }
--     ]
--   },
--   "marketSize": {
--     "questions": [...]
--   },
--   ... (8 criteria total)
-- }
--
-- quick_notes:
-- {
--   "strengths": [
--     "Severe pain point: Documentation is #1 therapist complaint",
--     "Clear, massive ROI: Saves $60K+/year in time",
--     "Large, accessible market: 350K+ US therapists"
--   ],
--   "weaknesses": [
--     "Privacy sensitivity: Patients may not want sessions recorded",
--     "Clinical accuracy critical: Mistakes could have legal consequences"
--   ],
--   "keyAssumptions": [
--     "Therapists will adopt voice recording during sessions",
--     "AI can achieve 95%+ accuracy on clinical notes"
--   ],
--   "nextSteps": [
--     "Interview 10-15 therapists about documentation pain",
--     "Test manual prototype with GPT-4"
--   ],
--   "references": [
--     "Number of therapists: 350,000+ licensed in US (APA, BLS data)",
--     "Documentation time: 20-30 min per session"
--   ]
-- }
