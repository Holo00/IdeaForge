-- Migration: Create AI models table
-- Purpose: Store available AI models for each provider

CREATE TABLE IF NOT EXISTS ai_models (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(50) NOT NULL,
  model_id VARCHAR(100) NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  is_available BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, model_id)
);

-- Create index for faster lookups
CREATE INDEX idx_ai_models_provider ON ai_models(provider);
CREATE INDEX idx_ai_models_available ON ai_models(is_available);

-- Insert default models for Claude
INSERT INTO ai_models (provider, model_id, display_name, is_default, description) VALUES
('claude', 'claude-sonnet-4-5-20250929', 'Claude Sonnet 4.5', true, 'Most capable Claude model (January 2025)'),
('claude', 'claude-3-5-sonnet-20241022', 'Claude 3.5 Sonnet', false, 'Previous generation Sonnet model');

-- Insert default models for Gemini
INSERT INTO ai_models (provider, model_id, display_name, is_default, description) VALUES
('gemini', 'gemini-1.5-pro-latest', 'Gemini Pro 1.5 (Latest)', true, 'Most capable Gemini model'),
('gemini', 'gemini-1.5-flash-latest', 'Gemini Flash 1.5 (Latest)', false, 'Faster, more efficient model'),
('gemini', 'gemini-pro', 'Gemini Pro', false, 'Standard Gemini model');

-- Insert default models for OpenAI (for future use)
INSERT INTO ai_models (provider, model_id, display_name, is_default, description) VALUES
('openai', 'gpt-4-turbo-preview', 'GPT-4 Turbo', true, 'Most capable OpenAI model'),
('openai', 'gpt-4', 'GPT-4', false, 'Standard GPT-4 model'),
('openai', 'gpt-3.5-turbo', 'GPT-3.5 Turbo', false, 'Fast and efficient model');

-- Add comment
COMMENT ON TABLE ai_models IS 'Available AI models for each provider';
