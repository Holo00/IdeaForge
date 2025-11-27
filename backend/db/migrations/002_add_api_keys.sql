-- Migration: Add API Keys table
-- Description: Store multiple API keys and providers in database

CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  provider VARCHAR(50) NOT NULL, -- 'claude', 'openai', 'gemini'
  api_key TEXT NOT NULL,
  model VARCHAR(100),
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on active keys
CREATE INDEX idx_api_keys_active ON api_keys(is_active);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE
ON api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
