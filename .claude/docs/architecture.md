# Project Architecture

## Project Overview

Project Idea Finder is an automated software business idea generation and evaluation platform. It uses AI (Claude/Gemini) to generate business ideas based on configurable frameworks, domains, and evaluation criteria. Ideas are scored across multiple dimensions, stored in PostgreSQL, and browsable through a Next.js frontend. The system supports multiple configuration profiles, real-time generation logging via SSE, and semantic duplicate detection using vector embeddings.

---

## Folder Structure

```
ProjectIdeaFinder/
├── .claude/
│   ├── CLAUDE.md                    # Claude Code instructions
│   ├── docs/                        # Project documentation
│   ├── agents/                      # Custom agents
│   ├── skills/                      # Custom skills
│   └── commands/                    # Slash commands
├── backend/
│   ├── config/                      # Default YAML configs (legacy location)
│   ├── configs/                     # Profile-specific configurations
│   │   ├── config/                  # Default profile
│   │   │   ├── business-domains.yaml
│   │   │   ├── competitive-advantages.yaml
│   │   │   ├── evaluation-criteria.yaml
│   │   │   ├── generation-settings.yaml
│   │   │   ├── idea-prompts.yaml
│   │   │   ├── market-sizes.yaml
│   │   │   ├── monetization-models.yaml
│   │   │   ├── problem-types.yaml
│   │   │   ├── solution-types.yaml
│   │   │   ├── target-audiences.yaml
│   │   │   └── technologies.yaml
│   │   └── Prod1/                   # Custom profile example
│   ├── db/
│   │   └── migrations/              # SQL migration files (001-009)
│   ├── scripts/
│   │   └── mark-migration-done.ts   # Utility for manual migration marking
│   └── src/
│       ├── api/
│       │   ├── controllers/
│       │   │   ├── generationController.ts
│       │   │   └── ideasController.ts
│       │   ├── middleware/
│       │   │   └── errorHandler.ts
│       │   └── routes/
│       │       ├── config.ts        # Config/profile/API key management
│       │       ├── generation.ts    # Idea generation endpoints
│       │       ├── ideas.ts         # Ideas CRUD
│       │       └── logs.ts          # Generation logs & SSE streaming
│       ├── lib/
│       │   ├── aiProvider.ts        # Multi-provider AI abstraction
│       │   ├── db.ts                # PostgreSQL connection pool
│       │   ├── errors.ts            # Custom error classes
│       │   └── logger.ts            # Generation stage logging
│       ├── repositories/
│       │   └── ideaRepository.ts    # Database access layer
│       ├── services/
│       │   ├── configService.ts     # YAML config loading
│       │   ├── embeddingService.ts  # OpenAI embeddings for duplicates
│       │   ├── ideaGenerationService.ts  # Core generation orchestration
│       │   ├── ideaService.ts       # Idea CRUD operations
│       │   └── promptBuilder.ts     # AI prompt construction
│       ├── types/
│       │   └── index.ts             # TypeScript interfaces
│       └── index.ts                 # Express app entry point
├── frontend/
│   ├── app/
│   │   ├── config/
│   │   │   └── page.tsx             # Configuration management page
│   │   ├── ideas/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx         # Idea detail view
│   │   │   └── page.tsx             # Ideas browser
│   │   ├── layout.tsx               # Root layout with providers
│   │   └── page.tsx                 # Dashboard
│   ├── components/
│   │   ├── config/                  # Config editor components
│   │   │   ├── ApiKeysEditor.tsx
│   │   │   ├── CriteriaEditor.tsx
│   │   │   ├── DomainsEditor.tsx
│   │   │   ├── ExtraFiltersEditor.tsx
│   │   │   ├── FrameworksEditor.tsx
│   │   │   ├── HowItWorksSection.tsx
│   │   │   ├── ProfileSelector.tsx
│   │   │   ├── PromptEditor.tsx
│   │   │   └── SettingsEditor.tsx
│   │   ├── GenerationControls.tsx   # Start/stop generation
│   │   ├── LogsViewer.tsx           # Real-time SSE log display
│   │   ├── Navigation.tsx           # App navigation
│   │   ├── RecentIdeas.tsx          # Latest ideas list
│   │   └── ThemeProvider.tsx        # Dark mode support
│   ├── contexts/
│   │   └── ConfigProfileContext.tsx # Active profile state
│   ├── lib/
│   │   └── api.ts                   # Backend API client
│   └── types/
│       └── index.ts                 # Frontend TypeScript types
├── docs/
│   ├── API.md
│   ├── DATABASE.md
│   ├── IDEA_GENERATION_PROCESS.md
│   └── SETUP_GUIDE.md
├── _archive/
│   └── research-system/             # Pre-build planning docs (archived)
└── README.md
```

---

## Database Schema

### Core Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `ideas` | Generated business ideas | `id` (UUID), `name`, `folder_name`, `status`, `score`, `domain`, `subdomain`, `problem`, `solution`, `scores` (JSONB), `quick_summary`, `concrete_example` (JSONB), `evaluation_details` (JSONB), `idea_components` (JSONB), `evaluation_questions` (JSONB), `quick_notes` (JSONB), `complexity_scores` (JSONB), `action_plan` (JSONB), `tags[]`, `embedding` (vector), `raw_ai_response`, `ai_prompt`, `created_at`, `updated_at` |
| `idea_history` | Tracks idea changes | `id`, `idea_id` (FK), `change_type`, `description`, `before_data` (JSONB), `after_data` (JSONB), `created_at` |
| `learnings` | Insights from failed ideas | `id`, `domain`, `problem`, `solution`, `insight`, `source`, `tags[]`, `created_at` |

### Configuration Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `configuration_profiles` | Profile metadata | `id` (UUID), `name`, `folder_name` (unique), `description`, `is_active` (only one true), `created_at`, `updated_at` |
| `config` | YAML configs as JSONB | `id`, `category`, `data` (JSONB), `version`, `updated_at` |
| `api_keys` | Multi-provider API keys | `id`, `name`, `provider` (claude/gemini/openai), `api_key`, `model`, `is_active`, `created_at`, `updated_at` |
| `ai_models` | Available models per provider | `id`, `provider`, `model_id`, `display_name`, `is_available`, `is_default`, `description` |

### Generation Tracking Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `generation_jobs` | Job queue history | `id`, `template`, `status`, `idea_id` (FK), `error`, `started_at`, `completed_at` |
| `generation_status` | Current generation state | `id`, `session_id` (unique), `status`, `current_stage`, `started_at`, `updated_at`, `completed_at`, `error_message`, `idea_id` (FK) |
| `idea_generation_logs` | Detailed generation logs | `id`, `session_id`, `stage`, `level` (info/success/warning/error), `message`, `details` (JSONB), `created_at` |
| `schema_migrations` | Migration tracking | `id`, `migration_name`, `executed_at` |

---

## Key Files Reference

### Backend Entry & Routing

| File | Purpose |
|------|---------|
| `backend/src/index.ts` | Express app setup, middleware, route mounting |
| `backend/src/api/routes/auth.ts` | Authentication: login, logout, check; `requireAuth` middleware |
| `backend/src/api/routes/config.ts` | Config profiles (CRUD, clone, activate), API keys, AI models, YAML config CRUD (protected) |
| `backend/src/api/routes/generation.ts` | `/generate` endpoint, generation status (protected) |
| `backend/src/api/routes/ideas.ts` | Ideas CRUD, history (protected) |
| `backend/src/api/routes/logs.ts` | SSE streaming, session logs (protected) |

### Core Services

| File | Purpose |
|------|---------|
| `backend/src/services/ideaGenerationService.ts` | Orchestrates full generation flow: prompt building → AI call → parsing → validation → duplicate check → save |
| `backend/src/services/promptBuilder.ts` | Constructs AI prompts from templates, criteria, domains; supports refinement prompts |
| `backend/src/services/configService.ts` | Loads YAML configs from active profile folder, provides random selection helpers |
| `backend/src/services/ideaService.ts` | Idea CRUD operations, score calculation |
| `backend/src/services/embeddingService.ts` | OpenAI embeddings for semantic duplicate detection |

### Infrastructure

| File | Purpose |
|------|---------|
| `backend/src/lib/aiProvider.ts` | Multi-provider AI abstraction (Claude, Gemini); reads API key from settings |
| `backend/src/lib/db.ts` | PostgreSQL connection pool via `pg` |
| `backend/src/lib/logger.ts` | `GenerationLogger` class for stage-based logging to DB |
| `backend/src/lib/errors.ts` | Custom errors: `AppError`, `ValidationError`, `NotFoundError`, `ConflictError`, `ExternalServiceError` |
| `backend/src/repositories/ideaRepository.ts` | Direct DB queries for ideas table |

### Frontend Pages

| File | Purpose |
|------|---------|
| `frontend/app/page.tsx` | Public landing page |
| `frontend/app/admin/login/page.tsx` | Admin login page |
| `frontend/app/dashboard/page.tsx` | Dashboard: GenerationControls, LogsViewer, RecentIdeas (protected) |
| `frontend/app/ideas/page.tsx` | Ideas browser with filters and sorting (protected) |
| `frontend/app/ideas/[id]/page.tsx` | Single idea detail view (protected) |
| `frontend/app/config/page.tsx` | Full configuration management UI (protected) |

### Frontend Key Components

| File | Purpose |
|------|---------|
| `frontend/components/GenerationControls.tsx` | Start generation, show status, profile selector |
| `frontend/components/LogsViewer.tsx` | Real-time SSE log display during generation |
| `frontend/components/config/ProfileSelector.tsx` | Profile management: switch, create, clone, delete profiles |
| `frontend/components/Navigation.tsx` | Auth-aware navigation with logout |
| `frontend/contexts/AuthContext.tsx` | Authentication state and route protection |
| `frontend/lib/api.ts` | API client with auth token injection |

### Configuration Files

| File | Purpose |
|------|---------|
| `backend/configs/{profile}/idea-prompts.yaml` | Generation frameworks (Pain Point, Market Gap, etc.) |
| `backend/configs/{profile}/evaluation-criteria.yaml` | Scoring criteria with weights and questions |
| `backend/configs/{profile}/business-domains.yaml` | Domain taxonomy with subdomains |
| `backend/configs/{profile}/generation-settings.yaml` | Temperature, max tokens, prompt template, extra filters |