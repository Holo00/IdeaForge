# IdeaForge

AI-powered software business idea generation and evaluation platform.

## Overview

IdeaForge generates, evaluates, and tracks software business ideas using AI (Claude or Gemini). It features multi-criteria weighted scoring, semantic duplicate detection, configurable generation frameworks, and a full-featured Next.js frontend.

### Key Features

- **AI-Powered Generation**: Generate ideas using Claude or Gemini with configurable frameworks (Pain Point, Market Gap, Unbundling, etc.)
- **Smart Evaluation**: Dynamic criteria scoring with configurable weights (0-100 scale)
- **Duplicate Detection**: Semantic similarity using OpenAI embeddings (pgvector)
- **Real-Time Logging**: SSE-powered live generation progress display
- **Configuration Profiles**: Multiple config profiles with YAML-based settings
- **Dark Mode**: Full dark mode support across all pages
- **Evolution Tracking**: Complete audit trail of idea changes

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Node.js + Express 5 + TypeScript |
| **Database** | PostgreSQL + pgvector |
| **Frontend** | Next.js 16 (App Router) + React 19 + Tailwind CSS |
| **AI** | Claude API, Gemini API, OpenAI (embeddings) |

## Project Structure

```
IdeaForge/
├── .claude/                      # Claude Code configuration
│   ├── CLAUDE.md                 # Execution protocol
│   ├── docs/                     # Architecture, conventions, workflow
│   ├── agents/                   # Custom agents (architect, debugger, reviewer)
│   ├── skills/                   # Implementation patterns
│   └── commands/                 # Slash commands
├── backend/
│   ├── configs/                  # Profile-specific YAML configurations
│   │   ├── config/               # Default profile
│   │   └── {profile}/            # Custom profiles
│   ├── db/migrations/            # SQL migrations (001-009)
│   ├── scripts/                  # Utility scripts
│   └── src/
│       ├── api/                  # Controllers, routes, middleware
│       ├── services/             # Business logic
│       ├── repositories/         # Database access
│       └── lib/                  # AI provider, DB, errors, logger
├── frontend/
│   ├── app/
│   │   ├── page.tsx              # Dashboard
│   │   ├── ideas/page.tsx        # Ideas browser
│   │   ├── ideas/[id]/page.tsx   # Idea detail
│   │   └── config/page.tsx       # Configuration management
│   └── components/               # React components
├── docs/                         # API, database, setup guides
└── _archive/                     # Archived planning docs
```

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ with pgvector extension
- API keys for Claude/Gemini (generation) and OpenAI (embeddings)

### Installation

1. **Clone and install**:
```bash
cd IdeaForge
npm install
cd frontend && npm install && cd ..
```

2. **Set up database**:
```bash
# Create PostgreSQL database
createdb project_idea_finder

# Enable pgvector extension
psql -d project_idea_finder -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Copy environment template
cp .env.example .env
# Edit .env with your DATABASE_URL
```

3. **Run migrations**:
```bash
cd backend
npm run db:migrate
```

4. **Start servers**:
```bash
# Terminal 1 - Backend (port 5000)
cd backend && npm run dev

# Terminal 2 - Frontend (port 6001)
cd frontend && npm run dev
```

5. **Open the app**:
- Frontend: [http://localhost:6001](http://localhost:6001)
- Backend API: [http://localhost:5000](http://localhost:5000)

## Application Pages

### Dashboard (`/`)
- Generation controls with profile selector
- Real-time generation logs (SSE)
- Recent ideas list
- Quick stats

### Ideas Browser (`/ideas`)
- Browse all generated ideas
- Filter by status, domain, score
- Sort by date, score, name
- Search functionality

### Idea Detail (`/ideas/:id`)
- Full idea content with evaluation
- Concrete example section
- Score breakdown by criteria
- Action plan and quick notes
- Edit history

### Configuration (`/config`)
- **Profile Management**: Create, switch, delete configuration profiles
- **Frameworks Editor**: Configure generation frameworks (Pain Point, Market Gap, etc.)
- **Criteria Editor**: Customize evaluation criteria and weights
- **Domains Browser**: Manage business domains and subdomains
- **Prompt Editor**: Edit the AI generation prompt template
- **Settings**: Temperature, max tokens, API key selection
- **API Keys**: Manage Claude/Gemini/OpenAI API keys

## API Endpoints

### Ideas
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ideas` | List ideas (with filters) |
| GET | `/api/ideas/:id` | Get idea details |
| PUT | `/api/ideas/:id` | Update idea |
| DELETE | `/api/ideas/:id` | Delete idea |
| GET | `/api/ideas/:id/history` | Get idea change history |

### Generation
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/generation/generate` | Generate new idea |
| GET | `/api/generation/status/:sessionId` | Get generation status |

### Configuration
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/config/profiles` | List profiles |
| POST | `/api/config/profiles` | Create profile |
| POST | `/api/config/profiles/:id/activate` | Switch active profile |
| GET | `/api/config/frameworks` | Get frameworks |
| PUT | `/api/config/frameworks` | Update frameworks |
| GET | `/api/config/criteria` | Get criteria |
| PUT | `/api/config/criteria` | Update criteria |
| GET | `/api/config/api-keys` | List API keys |
| POST | `/api/config/api-keys` | Add API key |

### Logs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/logs/stream/:sessionId` | SSE log stream |
| GET | `/api/logs/:sessionId` | Get session logs |

See [docs/API.md](./docs/API.md) for complete documentation.

## Configuration System

### Profile Structure
Each profile has YAML files in `backend/configs/{profile}/`:

| File | Purpose |
|------|---------|
| `idea-prompts.yaml` | Generation frameworks |
| `evaluation-criteria.yaml` | Scoring criteria with weights |
| `business-domains.yaml` | Domain taxonomy |
| `generation-settings.yaml` | AI settings (temperature, tokens, API key) |

### Switching Profiles
1. Go to Configuration page
2. Use profile dropdown to select
3. Or create new profile (copies from default)

## Idea Evaluation

Ideas are scored dynamically based on configured criteria. Default criteria:

| Criterion | Description |
|-----------|-------------|
| Problem Severity | How painful is the problem? |
| Market Size | Total addressable market |
| Competition | Competitive landscape |
| Monetization Clarity | Clear path to revenue |
| Technical Feasibility | Can it be built? |
| Personal Interest | Motivation factor |
| Unfair Advantage | Defensibility |
| Time to Market | Speed to launch |

**Score Range**: 0-100 (weighted sum of criteria scores)

## Development

### Scripts

```bash
# Backend
cd backend
npm run dev          # Start with hot reload (port 5000)
npm run build        # Build TypeScript
npm run db:migrate   # Run migrations

# Frontend
cd frontend
npm run dev          # Start Next.js (port 6001)
npm run build        # Production build
```

### Development Guide

See [.claude/CLAUDE.md](./.claude/CLAUDE.md) for:
- Execution protocol and workflow
- Documentation triggers
- Quality gates by task type

### Key Principles

1. **Routes → Controller → Service → Repository** pattern
2. **Zod validation** for all inputs
3. **ApiResponse<T>** wrapper for all responses
4. **Dark mode classes** on all components
5. **TodoWrite** for multi-step tasks

## Documentation

| Document | Description |
|----------|-------------|
| [.claude/CLAUDE.md](./.claude/CLAUDE.md) | Development workflow |
| [.claude/docs/architecture.md](./.claude/docs/architecture.md) | Project structure |
| [.claude/docs/prompting-guide.md](./.claude/docs/prompting-guide.md) | How to prompt Claude |
| [docs/API.md](./docs/API.md) | API documentation |
| [docs/DATABASE.md](./docs/DATABASE.md) | Database schema |

## License

ISC