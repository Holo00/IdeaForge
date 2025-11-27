# Database Schema Documentation

## Overview

The Project Idea Finder uses PostgreSQL with JSONB for flexible data storage. The schema is designed to support:
- Idea storage with full evaluation details
- Configuration management (domains, criteria, templates)
- Job queue tracking for automated generation
- Idea evolution history
- Learning repository from failures

## Tables

### ideas

Stores generated software business ideas with full evaluation details.

```sql
CREATE TABLE ideas (
  id UUID PRIMARY KEY,
  name VARCHAR(500) NOT NULL,
  folder_name VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  score INTEGER NOT NULL,

  -- Classification
  domain VARCHAR(255) NOT NULL,
  subdomain VARCHAR(255),
  problem VARCHAR(255) NOT NULL,
  solution VARCHAR(255) NOT NULL,

  -- Scoring breakdown (JSONB)
  scores JSONB NOT NULL,

  -- Content (JSONB for flexibility)
  quick_summary TEXT NOT NULL,
  concrete_example JSONB NOT NULL,
  evaluation_details JSONB NOT NULL,

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  generation_framework VARCHAR(100),

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Relationships
  parent_idea_id UUID REFERENCES ideas(id)
);
```

**Status Values**: `draft`, `validation`, `research`, `build`, `archived`

**Scores JSONB Structure**:
```json
{
  "problemSeverity": 8,
  "marketSize": 7,
  "competition": 6,
  "monetization": 9,
  "technicalFeasibility": 7,
  "personalInterest": 8,
  "unfairAdvantage": 6,
  "timeToMarket": 8
}
```

**Concrete Example JSONB Structure**:
```json
{
  "currentState": "How it works today...",
  "yourSolution": "How your product would work...",
  "keyImprovement": "What makes it better..."
}
```

**Evaluation Details JSONB Structure**:
```json
{
  "problemSeverity": {
    "score": 8,
    "reasoning": "Why this score..."
  },
  "marketSize": {
    "score": 7,
    "reasoning": "Market analysis..."
  }
  // ... for all 8 criteria
}
```

**Additional Columns** (added in later migrations):
```sql
-- Normalized lookup references (Migration 011)
monetization_model_id INTEGER REFERENCES monetization_models(id),
target_audience_id INTEGER REFERENCES target_audiences(id),
estimated_team_size INTEGER,

-- Other columns
idea_components JSONB,      -- Full idea components from AI
quick_notes JSONB,          -- Strengths, weaknesses, etc.
complexity_scores JSONB,    -- Technical, regulatory, sales complexity
action_plan JSONB,          -- Next steps and timeline
raw_ai_response TEXT,       -- Full AI response for debugging
ai_prompt TEXT,             -- The prompt used to generate
```

**Indexes**:
- `idx_ideas_status` - Filter by status
- `idx_ideas_domain` - Filter by domain
- `idx_ideas_score` - Sort by score
- `idx_ideas_created_at` - Sort by creation date
- `idx_ideas_tags` - GIN index for tag searches
- `idx_ideas_monetization_model` - Filter by monetization model FK
- `idx_ideas_target_audience` - Filter by target audience FK
- `idx_ideas_estimated_team_size` - Filter by team size

---

### monetization_models

Lookup table for monetization model options. Pre-populated from master YAML config.

```sql
CREATE TABLE monetization_models (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  typical_pricing VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**Example Data**:
| id | name | typical_pricing |
|----|------|-----------------|
| 1 | Monthly Subscription | $9-$99/month |
| 2 | Annual Subscription | $99-$999/year |
| 3 | Freemium | Free + $10-$50/month |
| 4 | Usage-Based Pricing | Varies by volume |
| 5 | Transaction Fee | 2-30% per transaction |

---

### target_audiences

Lookup table for target audience options. Pre-populated from master YAML config.

```sql
CREATE TABLE target_audiences (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**Example Data**:
| id | name | description |
|----|------|-------------|
| 1 | Small Businesses | Companies with 1-50 employees |
| 2 | Medium Businesses | Companies with 50-500 employees |
| 3 | Enterprise/Large Companies | Companies with 500+ employees |
| 4 | Freelancers/Solopreneurs | Individual professionals |
| 5 | Startups | Early-stage companies |

---

### config

Stores all configuration data (domains, criteria, templates) as JSONB for easy modification.

```sql
CREATE TABLE config (
  id UUID PRIMARY KEY,
  category VARCHAR(100) NOT NULL UNIQUE,
  data JSONB NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**Category Values**:
- `business_domains` - 500+ domains and subdomains
- `problem_types` - Types of problems (time-consuming, expensive, etc.)
- `solution_types` - Solution approaches (AI/ML, automation, etc.)
- `monetization_models` - Revenue models (SaaS, marketplace, etc.)
- `target_audiences` - Customer segments
- `technologies` - Tech stacks
- `market_sizes` - Market size classifications
- `evaluation_criteria` - Scoring criteria definitions
- `competitive_advantages` - Unfair advantage types
- `idea_prompts` - Generation templates and frameworks

**Example Data Structure** (business_domains):
```json
{
  "domains": [
    {
      "name": "Healthcare & Medical",
      "subdomains": [
        {
          "name": "Telemedicine",
          "description": "Remote medical consultations"
        }
      ]
    }
  ]
}
```

---

### generation_jobs

Tracks idea generation job history and status.

```sql
CREATE TABLE generation_jobs (
  id UUID PRIMARY KEY,
  template VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  idea_id UUID REFERENCES ideas(id),
  error TEXT,
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

**Status Values**: `pending`, `processing`, `completed`, `failed`

**Usage**: BullMQ jobs create entries here to track generation attempts, success/failure rates, and link to generated ideas.

**Index**: `idx_generation_jobs_status`

---

### idea_history

Tracks all changes to ideas for audit trail and evolution tracking.

```sql
CREATE TABLE idea_history (
  id UUID PRIMARY KEY,
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  change_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  before_data JSONB,
  after_data JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**Change Types**: `created`, `updated`, `status_changed`, `refined`, `merged`, `archived`

**Example Entry**:
```json
{
  "id": "uuid",
  "idea_id": "idea-uuid",
  "change_type": "status_changed",
  "description": "Status changed from draft to validation",
  "before_data": {"status": "draft"},
  "after_data": {"status": "validation"},
  "created_at": "2025-01-20T10:00:00Z"
}
```

**Index**: `idx_idea_history_idea_id`

---

### learnings

Captures insights from failed or archived ideas to improve future generation.

```sql
CREATE TABLE learnings (
  id UUID PRIMARY KEY,
  domain VARCHAR(255) NOT NULL,
  problem VARCHAR(255) NOT NULL,
  solution VARCHAR(255),
  insight TEXT NOT NULL,
  source VARCHAR(255) NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**Purpose**: When ideas are archived, capture "why it failed" or "what we learned" to avoid repeating mistakes.

**Example**:
```json
{
  "domain": "Healthcare",
  "problem": "Manual therapy notes",
  "solution": "AI note-taking",
  "insight": "HIPAA compliance too complex for MVP. Need healthcare partnerships upfront.",
  "source": "ai-therapy-notes-2025-01",
  "tags": ["hipaa", "compliance", "healthcare"]
}
```

**Indexes**:
- `idx_learnings_domain` - Find learnings by domain
- `idx_learnings_tags` - GIN index for tag searches

---

## Design Principles

### 1. JSONB for Flexibility

**Why**: Idea evaluation criteria, scoring systems, and configuration can evolve over time. JSONB allows schema changes without migrations.

**Use Cases**:
- `scores`: Add new scoring criteria without ALTER TABLE
- `evaluation_details`: Store detailed reasoning
- `config.data`: Entire YAML configs stored as JSON
- `idea_history`: Before/after snapshots of any changes

### 2. Normalized for Queryable Data

**Why**: Common queries need performance.

**Structured Columns**:
- `status`, `domain`, `score` - Frequently filtered/sorted
- `created_at`, `updated_at` - Time-based queries
- `tags[]` - Array type with GIN index for fast searches

### 3. Referential Integrity

- `ideas.parent_idea_id` - Track idea lineage (pivots, variations)
- `generation_jobs.idea_id` - Link jobs to results
- `idea_history.idea_id` - Cascade delete history when idea deleted

### 4. Auto-timestamps

- Triggers automatically update `updated_at` on ideas and config
- All tables have `created_at` for audit trails

---

## Common Queries

### Get all draft ideas, sorted by score
```sql
SELECT * FROM ideas
WHERE status = 'draft'
ORDER BY score DESC;
```

### Get ideas in a specific domain with score > 60
```sql
SELECT * FROM ideas
WHERE domain = 'Healthcare & Medical' AND score > 60
ORDER BY created_at DESC;
```

### Get ideas with specific tags
```sql
SELECT * FROM ideas
WHERE tags && ARRAY['ai', 'saas']
ORDER BY score DESC;
```

### Get idea evolution history
```sql
SELECT * FROM idea_history
WHERE idea_id = 'uuid-here'
ORDER BY created_at DESC;
```

### Get learnings from a domain
```sql
SELECT * FROM learnings
WHERE domain = 'Healthcare'
ORDER BY created_at DESC;
```

### Get generation job success rate
```sql
SELECT
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM generation_jobs
GROUP BY status;
```

---

## Migration Strategy

**Running Migrations**:
```bash
npm run db:migrate
```

**Seeding Data**:
```bash
npm run db:seed
```

**Rollback** (manual):
- Migrations are not automatically reversible
- Create new migration to undo changes
- Keep backups before major schema changes

---

## Performance Considerations

### Indexes
All frequently queried columns have indexes. GIN indexes on arrays and JSONB provide fast searches.

### Connection Pooling
Using `pg` connection pool with:
- Max 20 connections
- 30s idle timeout
- 2s connection timeout

### Query Optimization
- Use JSONB operators efficiently (`->`, `->>`, `@>`, `?`)
- Avoid `SELECT *` in production (specify columns)
- Use EXPLAIN ANALYZE for slow queries

---

## Backup & Recovery

**Recommended Schedule**:
- Full backup: Daily
- Transaction log: Continuous
- Retention: 30 days

**Backup Command**:
```bash
pg_dump -U user -d project_idea_finder > backup.sql
```

**Restore Command**:
```bash
psql -U user -d project_idea_finder < backup.sql
```
