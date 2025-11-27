# Skill: Database Changes

## Migration System

This project uses a **simple file-based migration system** with raw SQL files.

- No ORM (Prisma, TypeORM, etc.)
- Migrations tracked in `schema_migrations` table
- Run once, never re-run

## Creating a Migration

### 1. Create SQL File

Location: `backend/db/migrations/NNN_description.sql`

Naming convention:
```
NNN_short_description.sql
```

Where NNN is the next sequential number (check existing files).

**Example**: `010_add_user_preferences.sql`

### 2. Write the SQL

```sql
-- Add user preferences table
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  theme VARCHAR(50) DEFAULT 'light',
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add index
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Add trigger for updated_at (reuse existing function)
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 3. Run Migration

```bash
npm run db:migrate
```

This runs `backend/db/migrate.ts` which:
1. Creates `schema_migrations` table if needed
2. Reads all `.sql` files from `migrations/` folder
3. Skips already-executed migrations (tracked by filename)
4. Runs new migrations in alphabetical order
5. Records each successful migration

## Migration Examples from This Project

### Adding a Column

From `008_add_raw_ai_response.sql`:
```sql
-- Add raw_ai_response column to store the complete AI response
ALTER TABLE ideas
  ADD COLUMN IF NOT EXISTS raw_ai_response TEXT;
```

### Changing Column Types

From `007_increase_field_lengths.sql`:
```sql
ALTER TABLE ideas
  ALTER COLUMN domain TYPE VARCHAR(500),
  ALTER COLUMN subdomain TYPE VARCHAR(500),
  ALTER COLUMN problem TYPE TEXT,
  ALTER COLUMN solution TYPE TEXT;
```

### Adding a New Table

From `002_add_api_keys.sql`:
```sql
CREATE TABLE api_keys (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  api_key TEXT NOT NULL,
  model VARCHAR(100),
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Adding JSONB Columns

From `004_enhance_idea_structure.sql`:
```sql
ALTER TABLE ideas
  ADD COLUMN IF NOT EXISTS idea_components JSONB,
  ADD COLUMN IF NOT EXISTS evaluation_questions JSONB,
  ADD COLUMN IF NOT EXISTS quick_notes JSONB;
```

## Gotchas & Best Practices

### 1. Use `IF NOT EXISTS` / `IF EXISTS`

Always use these to make migrations idempotent:
```sql
CREATE TABLE IF NOT EXISTS ...
ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...
DROP TABLE IF EXISTS ...
```

### 2. Duplicate Migration Numbers Exist

The project has duplicate numbers (e.g., two `005_` files, three `006_` files). This works because migrations are tracked by **filename**, not number. But avoid creating new duplicates.

### 3. No Rollback Support

There's no automatic rollback. If a migration fails partway through:
1. Fix the issue manually in the database
2. Either delete the migration record from `schema_migrations` to re-run
3. Or create a new migration to complete the changes

### 4. Check Current State First

Before creating a migration, check what's already there:
```sql
\d ideas  -- Describe table structure
SELECT * FROM schema_migrations;  -- See executed migrations
```

### 5. JSONB for Flexible Data

This project uses JSONB extensively for evolving data:
```sql
scores JSONB NOT NULL,
concrete_example JSONB NOT NULL,
evaluation_details JSONB NOT NULL,
```

### 6. Vector Extension for Embeddings

From `003_add_configurations_and_embeddings.sql`:
```sql
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE ideas
  ADD COLUMN IF NOT EXISTS embedding vector(1536);
```

## Manual Migration Marking

If you need to skip a migration (e.g., schema already exists):

```bash
npx ts-node backend/scripts/mark-migration-done.ts 001_initial_schema.sql

# Or mark all as done
npx ts-node backend/scripts/mark-migration-done.ts --all
```

## Adding Types After Migration

After adding/changing columns, update TypeScript types:

1. `backend/src/types/index.ts` - Add interface properties
2. `backend/src/repositories/*Repository.ts` - Update mapFromDb function