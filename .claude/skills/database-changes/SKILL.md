---
name: database-changes
description: Make database schema changes in IdeaForge. Triggers: create migration, add table/column, modify column type, add index, use JSONB, use pgvector. File-based migrations with raw SQL, no ORM.
---

# Database Migrations

Location: `backend/db/migrations/`

## Create Migration

1. Create `NNN_description.sql` (next sequential number)
2. Write idempotent SQL
3. Run `npm run db:migrate`

## Patterns

```sql
-- New table
CREATE TABLE IF NOT EXISTS user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  theme VARCHAR(50) DEFAULT 'light',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add column
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS new_field TEXT;

-- JSONB column
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS quick_notes JSONB;

-- Index
CREATE INDEX IF NOT EXISTS idx_ideas_domain ON ideas(domain);

-- pgvector
CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS embedding vector(1536);
```

## After Migration

1. Update `backend/src/types/index.ts` - add interface properties
2. Update `backend/src/repositories/*Repository.ts` - update mapFromDb

## Gotchas

- **Always IF NOT EXISTS** - idempotent migrations
- **No rollback** - fix failures manually
- **Check state first** - `\d tablename` in psql
- **JSONB for flexible data** - evolving structures