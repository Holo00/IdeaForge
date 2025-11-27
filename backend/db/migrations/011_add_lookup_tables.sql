-- ============================================
-- Migration 011: Add Lookup Tables for Filtering
-- ============================================
-- This migration adds normalized lookup tables for monetization models
-- and target audiences to enable efficient filtering without JSONB operators.
--
-- Benefits:
-- - Simple JOINs instead of JSONB casts for filtering
-- - Referential integrity via foreign keys
-- - Dropdown values automatically match filter values
-- - Can add metadata without changing ideas table
-- ============================================

-- Create monetization_models lookup table
CREATE TABLE IF NOT EXISTS monetization_models (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  typical_pricing VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create target_audiences lookup table
CREATE TABLE IF NOT EXISTS target_audiences (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add columns to ideas table
-- Using nullable FKs initially to allow gradual migration of existing data
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS monetization_model_id INTEGER REFERENCES monetization_models(id) ON DELETE SET NULL;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS target_audience_id INTEGER REFERENCES target_audiences(id) ON DELETE SET NULL;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS estimated_team_size INTEGER;

-- Create indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_ideas_monetization_model ON ideas(monetization_model_id);
CREATE INDEX IF NOT EXISTS idx_ideas_target_audience ON ideas(target_audience_id);
CREATE INDEX IF NOT EXISTS idx_ideas_estimated_team_size ON ideas(estimated_team_size);

-- Create indexes on lookup tables
CREATE INDEX IF NOT EXISTS idx_monetization_models_name ON monetization_models(name);
CREATE INDEX IF NOT EXISTS idx_target_audiences_name ON target_audiences(name);

-- Insert monetization models from master config
-- These are the standard models from monetization-models.yaml
INSERT INTO monetization_models (name, description, typical_pricing) VALUES
  ('Monthly Subscription', 'Recurring monthly fee for access', '$9-$99/month'),
  ('Annual Subscription', 'Yearly fee, often with discount vs monthly', '$99-$999/year'),
  ('Freemium', 'Free basic version, paid premium features', 'Free + $10-$50/month premium'),
  ('Usage-Based Pricing', 'Pay per use or consumption', 'Varies by usage volume'),
  ('Transaction Fee', 'Percentage or flat fee per transaction', '2-30% per transaction'),
  ('Commission/Marketplace Fee', 'Cut of sales or bookings made on platform', '5-30% commission'),
  ('One-Time Purchase', 'Single upfront payment for lifetime access', '$29-$999 one-time'),
  ('Advertising', 'Revenue from displaying ads to users', 'CPM, CPC, or CPA model'),
  ('Sponsorship', 'Companies pay to be featured or associated', '$1,000-$100,000+ per sponsor'),
  ('Affiliate Revenue', 'Commission for referring customers to other products', '5-50% of referred sale'),
  ('Licensing', 'Charge for right to use IP or technology', '$10,000-$1M+ per license'),
  ('White-Label/Reseller', 'Others rebrand and resell your solution', '30-70% revenue share'),
  ('Enterprise Contracts', 'Large custom deals with enterprises', '$50,000-$10M+ annually'),
  ('Data Monetization', 'Sell aggregated or anonymized user data', 'Varies widely by data type'),
  ('Premium Support', 'Charge for enhanced customer support', '$100-$10,000+ monthly'),
  ('Professional Services', 'Consulting, implementation, or customization', '$100-$500+ per hour'),
  ('Training & Certification', 'Charge for courses or certification programs', '$100-$5,000 per course'),
  ('API Access', 'Charge for programmatic access to service', 'Tiered by API calls or features'),
  ('Hardware + Software Bundle', 'Combine physical device with software service', 'Device cost + $10-$50/month'),
  ('Donations/Tip Jar', 'Voluntary payments from users', 'Variable user contributions'),
  ('NFT/Digital Assets', 'Sell unique digital items or access', '$10-$1M+ per asset'),
  ('Premium Content', 'Charge for exclusive or high-value content', '$5-$50/month or per piece'),
  ('Lead Generation', 'Charge for qualified customer leads', '$10-$500+ per lead'),
  ('Reverse Auction', 'Buyers post needs, sellers bid', 'Commission on winning bid')
ON CONFLICT (name) DO NOTHING;

-- Insert target audiences from master config
-- These are the standard audiences from target-audiences.yaml
INSERT INTO target_audiences (name, description) VALUES
  ('Small Businesses', 'Companies with 1-50 employees'),
  ('Medium Businesses', 'Companies with 50-500 employees'),
  ('Enterprise/Large Companies', 'Companies with 500+ employees'),
  ('Freelancers/Solopreneurs', 'Individual professionals working independently'),
  ('Startups', 'Early-stage companies building products'),
  ('Developers/Technical Users', 'Software engineers and IT professionals'),
  ('Marketing Professionals', 'Marketing teams and agencies'),
  ('Sales Teams', 'Sales professionals and organizations'),
  ('Healthcare Providers', 'Medical professionals and facilities'),
  ('Educational Institutions', 'Schools, universities, and training centers'),
  ('Students', 'K-12 and higher education learners'),
  ('Parents', 'Mothers and fathers raising children'),
  ('Seniors/Elderly', 'Older adults 65+'),
  ('Remote Workers', 'People working from home or remotely'),
  ('Content Creators', 'People creating media for audiences'),
  ('E-commerce Merchants', 'Online store owners and operators'),
  ('Real Estate Professionals', 'Agents, brokers, and property managers'),
  ('Fitness Enthusiasts', 'People focused on health and exercise'),
  ('Gamers', 'Video game players and enthusiasts'),
  ('Pet Owners', 'People with pets (dogs, cats, etc)'),
  ('Travelers', 'People who travel frequently'),
  ('Investors', 'People managing investment portfolios'),
  ('Nonprofits', 'Charitable and social organizations'),
  ('Government Agencies', 'Local, state, and federal government'),
  ('Restaurants/Food Service', 'Food and beverage establishments'),
  ('Manufacturing Companies', 'Product manufacturing operations'),
  ('Professional Services', 'Consultants, lawyers, accountants'),
  ('Creative Agencies', 'Design, marketing, and media agencies'),
  ('Event Planners', 'People organizing events and conferences'),
  ('Farmers/Agricultural', 'Agricultural producers and operations')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- Data Migration: Populate FK columns from JSONB
-- ============================================
-- This updates existing ideas to set the FK columns based on
-- the monetizationModel and targetAudienceCategory in idea_components JSONB

-- Update monetization_model_id from idea_components->monetizationModel
UPDATE ideas i
SET monetization_model_id = mm.id
FROM monetization_models mm
WHERE i.monetization_model_id IS NULL
  AND i.idea_components IS NOT NULL
  AND i.idea_components->>'monetizationModel' IS NOT NULL
  AND LOWER(TRIM(i.idea_components->>'monetizationModel')) = LOWER(TRIM(mm.name));

-- Update target_audience_id from idea_components->targetAudienceCategory
UPDATE ideas i
SET target_audience_id = ta.id
FROM target_audiences ta
WHERE i.target_audience_id IS NULL
  AND i.idea_components IS NOT NULL
  AND i.idea_components->>'targetAudienceCategory' IS NOT NULL
  AND LOWER(TRIM(i.idea_components->>'targetAudienceCategory')) = LOWER(TRIM(ta.name));

-- Update estimated_team_size from idea_components->estimatedTeamSize
UPDATE ideas
SET estimated_team_size = (idea_components->>'estimatedTeamSize')::INTEGER
WHERE estimated_team_size IS NULL
  AND idea_components IS NOT NULL
  AND idea_components->>'estimatedTeamSize' IS NOT NULL
  AND idea_components->>'estimatedTeamSize' ~ '^\d+$';

-- ============================================
-- Remove redundant evaluation_questions column
-- ============================================
-- This column duplicates data from evaluation_details
ALTER TABLE ideas DROP COLUMN IF EXISTS evaluation_questions;

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE monetization_models IS 'Lookup table for monetization model options - sourced from master config';
COMMENT ON TABLE target_audiences IS 'Lookup table for target audience options - sourced from master config';
COMMENT ON COLUMN ideas.monetization_model_id IS 'FK to monetization_models lookup - enables efficient filtering';
COMMENT ON COLUMN ideas.target_audience_id IS 'FK to target_audiences lookup - enables efficient filtering';
COMMENT ON COLUMN ideas.estimated_team_size IS 'Promoted from JSONB for filtering - minimum team size to build';