# Technical Context

## Tech Stack Summary

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | - | Runtime |
| Express | 5.1.0 | Web framework |
| TypeScript | 5.9.3 | Language |
| PostgreSQL | - | Database |
| pg | 8.16.3 | PostgreSQL client |
| Zod | 4.1.12 | Schema validation |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.0.3 | React framework (App Router) |
| React | 19.2.0 | UI library |
| TypeScript | 5.9.3 | Language |
| Tailwind CSS | 3.4.18 | Styling |
| next-themes | 0.4.6 | Dark mode support |

### AI Providers

| Provider | Package | Version | Purpose |
|----------|---------|---------|---------|
| Anthropic Claude | @anthropic-ai/sdk | 0.70.1 | Idea generation |
| Google Gemini | @google/generative-ai | 0.24.1 | Idea generation (alternative) |
| OpenAI | openai | 6.9.1 | Embeddings for duplicate detection |

### Development

| Tool | Version | Purpose |
|------|---------|---------|
| nodemon | 3.1.11 | Auto-restart on changes |
| ts-node | 10.9.2 | TypeScript execution |
| ESLint | 9.39.1 | Linting |
| Prettier | 3.6.2 | Code formatting |

---

## AI Integration

### Multi-Provider Architecture

The system supports multiple AI providers through `backend/src/lib/aiProvider.ts`:

```
API Key Config (from settings.yaml or api_keys table)
       ↓
   aiProvider.ts
       ↓
   ┌───┴───┐
Claude   Gemini
```

### Provider Selection

1. System reads `api_key_id` from active profile's `settings.yaml`
2. Looks up API key in `api_keys` table
3. Routes to correct provider based on `provider` field

### Calling the AI

```typescript
import { callAI, isAIConfigured } from '../lib/aiProvider';

// Check if configured
if (!(await isAIConfigured())) {
  throw new Error('No API key configured');
}

// Call AI (auto-routes to correct provider)
const response = await callAI(prompt, {
  temperature: 1.0,
  maxTokens: 16384,
});
```

### Generation Flow

```
1. IdeaGenerationService.generateIdea()
2. PromptBuilder.buildGenerationPrompt() - builds prompt from config
3. callAI() - sends to Claude/Gemini
4. parseAIResponse() - extracts JSON from response
5. Validation - checks all criteria present
6. Duplicate check - via exact match + embeddings
7. Save to database
```

### AI Response Format

The AI returns JSON with this structure:

```json
{
  "name": "Idea Name",
  "domain": "Domain → Subdomain",
  "problem": "Problem description",
  "solution": "Solution description",
  "quickSummary": "Elevator pitch",
  "concreteExample": {
    "currentState": "...",
    "yourSolution": "...",
    "keyImprovement": "..."
  },
  "ideaComponents": { ... },
  "evaluation": {
    "problemSeverity": { "score": 8, "reasoning": "...", "questions": [...] },
    // ... more criteria
  },
  "quickNotes": { ... },
  "actionPlan": { ... },
  "tags": [...]
}
```

### Embeddings (Duplicate Detection)

Uses OpenAI's `text-embedding-3-small` model:

```typescript
// EmbeddingService generates vectors for semantic similarity
const embedding = await embeddingService.generateEmbedding({
  domain, subdomain, problem, solution, summary
});

// Stored in PostgreSQL with pgvector extension
// Similarity threshold: 0.85 (85% similar = duplicate)
```

---

## Job Queue Status

### BullMQ

**Status**: Installed but NOT actively used.

BullMQ is in `package.json` and mentioned in documentation, but there are no imports in the codebase. Generation is currently **manual only** via the `/api/generation/generate` endpoint.

The 10-minute auto-generation mentioned in docs is **not implemented**.

### Current Generation Trigger

```
Frontend: "Generate" button
    ↓
POST /api/generation/generate
    ↓
IdeaGenerationService.generateIdea()
    ↓
Real-time logs via SSE (/api/logs/stream/:sessionId)
```

---

## Configuration System

### Storage Architecture

**Hybrid approach**: Database metadata + filesystem YAML files.

```
configuration_profiles (DB table)
├── id: 1
├── name: "Default Configuration"
├── folder_name: "config"
├── is_active: true
└── created_at: ...

backend/configs/config/
├── business-domains.yaml
├── evaluation-criteria.yaml
├── generation-settings.yaml
├── idea-prompts.yaml
├── problem-types.yaml
└── solution-types.yaml
```

### Profile Switching

1. Only ONE profile can be `is_active = true`
2. Switching profiles updates `is_active` flags in DB
3. ConfigService reads from `backend/configs/{folder_name}/`

### Config Loading

```typescript
// ConfigService loads YAML from active profile
const configService = new ConfigService();
const domains = await configService.getDomains();
const criteria = await configService.getEvaluationCriteria();
const settings = await configService.getGenerationSettings();
```

### Key Config Files

| File | Purpose | Used By |
|------|---------|---------|
| `idea-prompts.yaml` | Generation frameworks (Pain Point, Market Gap, etc.) | PromptBuilder |
| `evaluation-criteria.yaml` | Scoring criteria with weights and questions | PromptBuilder, IdeaService |
| `business-domains.yaml` | Domain taxonomy with subdomains | PromptBuilder |
| `generation-settings.yaml` | Temperature, max tokens, prompt template, API key ID | IdeaGenerationService |

### Settings YAML Example

```yaml
temperature: 1.0
max_tokens: 16384
api_key_id: 1  # References api_keys.id
idea_generation_prompt: |
  You are an expert at generating business ideas...
  {framework_name}
  {domains}
  ...
extraFilters:
  - name: "B2B Focus"
    enabled: true
    promptText: "Focus on B2B solutions"
```

---

## Key Dependencies

### Backend

| Package | Purpose | Notes |
|---------|---------|-------|
| `express` | Web server | v5 (latest) |
| `pg` | PostgreSQL driver | Direct SQL queries, no ORM |
| `zod` | Request validation | Used in controllers |
| `js-yaml` | YAML config parsing | Config files |
| `@anthropic-ai/sdk` | Claude API | Primary AI provider |
| `@google/generative-ai` | Gemini API | Alternative AI provider |
| `openai` | OpenAI API | Embeddings only |
| `dotenv` | Environment variables | DB connection string |

### Frontend

| Package | Purpose | Notes |
|---------|---------|-------|
| `next` | React framework | App Router, v16 |
| `react` | UI library | v19 |
| `next-themes` | Dark mode | System preference aware |
| `tailwindcss` | CSS framework | Utility-first |

### Not Used (Despite Being Installed)

| Package | Status |
|---------|--------|
| `bullmq` | Installed, not imported |
| `redis` | Not installed (needed for BullMQ) |

---

## Database Connection

### Configuration

Connection string in `.env`:

```
DATABASE_URL=postgresql://user:pass@localhost:5432/projectideafinder
```

### Pool Setup

```typescript
// backend/src/lib/db.ts
import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
```

### Query Helpers

```typescript
// Direct queries
const result = await pool.query('SELECT * FROM ideas WHERE id = $1', [id]);

// Or use helpers
import { query, queryOne } from '../lib/db';
const ideas = await query<Idea>('SELECT * FROM ideas');
const idea = await queryOne<Idea>('SELECT * FROM ideas WHERE id = $1', [id]);
```

---

## Ports

| Service | Port | Notes |
|---------|------|-------|
| Backend (Express) | 5000 | API server |
| Frontend (Next.js) | 6001 | Web UI |
| PostgreSQL | 5432 | Database (default) |