# Setup Guide

Complete guide to setting up the Project Idea Finder locally.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **PostgreSQL** 14.x or higher ([Download](https://www.postgresql.org/download/))
- **Git** (for version control)
- A code editor (VS Code recommended)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd project-idea-finder
npm install
```

This installs:
- **Production**: express, pg, zod, cors, dotenv, js-yaml, @anthropic-ai/sdk, bullmq, ioredis
- **Development**: typescript, ts-node, nodemon, eslint, prettier, @types/*

### 2. Set Up PostgreSQL

#### Option A: Local PostgreSQL

**Windows**:
1. Download PostgreSQL installer from postgresql.org
2. Run installer, set password for `postgres` user
3. Open pgAdmin or use command line:
```bash
psql -U postgres
CREATE DATABASE project_idea_finder;
\q
```

**Mac** (using Homebrew):
```bash
brew install postgresql@14
brew services start postgresql@14
createdb project_idea_finder
```

**Linux** (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo -u postgres createdb project_idea_finder
```

#### Option B: Cloud PostgreSQL

Use a managed service:
- **Supabase** (free tier): [supabase.com](https://supabase.com)
- **Railway** (free tier): [railway.app](https://railway.app)
- **Neon** (free tier): [neon.tech](https://neon.tech)

Get your connection string and use it in the next step.

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```bash
# Server
PORT=3000
NODE_ENV=development

# Database - Update with your credentials
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/project_idea_finder

# Redis (optional for now - Phase 2)
REDIS_HOST=localhost
REDIS_PORT=6379

# Anthropic API (optional for now - Phase 2)
ANTHROPIC_API_KEY=

# Idea Generation
IDEA_GENERATION_INTERVAL_MINUTES=10
```

**Important**: Replace `YOUR_PASSWORD` with your actual PostgreSQL password.

### 4. Run Database Migrations

This creates all tables, indexes, and triggers:

```bash
npm run db:migrate
```

You should see:
```
Starting database migrations...
Running migration: 001_initial_schema.sql
✓ Completed: 001_initial_schema.sql
All migrations completed successfully!
```

### 5. Seed Database with Example Data

This loads:
- Configuration from `research-system/config/` (500+ domains, criteria, templates)
- 5 example ideas from `research-system/ideas/`

```bash
npm run db:seed
```

You should see:
```
Starting database seeding...

1. Seeding configuration data...
  ✓ Loaded business_domains
  ✓ Loaded problem_types
  ✓ Loaded solution_types
  ✓ Loaded monetization_models
  ✓ Loaded target_audiences
  ✓ Loaded technologies
  ✓ Loaded market_sizes
  ✓ Loaded evaluation_criteria
  ✓ Loaded competitive_advantages
  ✓ Loaded idea_prompts

2. Seeding example ideas...
  ✓ Loaded AI-Powered Email Assistant for Freelancers
  ✓ Loaded Lightweight ATS for Freelance Recruiters
  ✓ Loaded Gamified Corporate Skills Training Platform
  ✓ Loaded AI-Powered Therapy Session Notes & Documentation
  ✓ Loaded QR Code Ordering & Payment for Small Restaurants (US Market)

✓ Database seeding completed successfully!
```

### 6. Start Development Server

```bash
npm run dev
```

Server starts on [http://localhost:3000](http://localhost:3000)

You should see:
```
Database connection successful
Server running on port 3000
Environment: development
```

### 7. Verify Installation

Open a new terminal and test the API:

**Health check**:
```bash
curl http://localhost:3000/health
```
Response: `{"status":"ok","timestamp":"2025-01-21T10:00:00.000Z"}`

**Get all ideas**:
```bash
curl http://localhost:3000/api/ideas
```

**Get high-scoring ideas**:
```bash
curl "http://localhost:3000/api/ideas?minScore=60&sortBy=score&sortOrder=desc"
```

You should see JSON responses with idea data.

## Troubleshooting

### Database Connection Failed

**Error**: `Failed to start server: Error: connect ECONNREFUSED`

**Solutions**:
1. Verify PostgreSQL is running:
   - Windows: Check Services for "PostgreSQL"
   - Mac: `brew services list`
   - Linux: `sudo systemctl status postgresql`

2. Check DATABASE_URL in `.env`:
   - Correct format: `postgresql://user:password@host:port/database`
   - Test connection: `psql $DATABASE_URL`

3. Verify database exists:
   ```bash
   psql -U postgres -l
   ```
   Should list `project_idea_finder`

### Migration Failed

**Error**: `Migration failed: relation "ideas" already exists`

**Solution**: Drop and recreate database:
```bash
psql -U postgres
DROP DATABASE project_idea_finder;
CREATE DATABASE project_idea_finder;
\q
npm run db:migrate
```

### Seed Script Failed

**Error**: `IDEAS-INDEX.yaml not found`

**Solution**: Ensure you're in the project root directory:
```bash
pwd  # Should show: .../ProjectIdeaFinder
ls research-system/ideas/  # Should show IDEAS-INDEX.yaml
```

### TypeScript Errors

**Error**: `Cannot find module 'express'` or similar

**Solution**: Rebuild node_modules:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3000`

**Solution**: Change port in `.env`:
```bash
PORT=3001
```

Or kill process on port 3000:
- Windows: `netstat -ano | findstr :3000` then `taskkill /PID <PID> /F`
- Mac/Linux: `lsof -ti:3000 | xargs kill`

## Development Workflow

### Making Code Changes

1. Code is in `backend/src/`
2. Server auto-reloads with nodemon
3. Check logs in terminal for errors

### Database Changes

1. Create new migration in `backend/db/migrations/`
2. Name it: `002_description.sql`
3. Run: `npm run db:migrate`

### Adding New Endpoints

1. Create controller in `backend/src/api/controllers/`
2. Create route in `backend/src/api/routes/`
3. Add route to `backend/src/index.ts`
4. Update `docs/API.md`

### Updating Documentation

When you make changes:
- Update [API.md](./API.md) for API changes
- Update [DATABASE.md](./DATABASE.md) for schema changes
- Add entry to [RECENT_CHANGES.md](./RECENT_CHANGES.md)

## Testing the API

### Using curl

```bash
# Get all ideas
curl http://localhost:3000/api/ideas

# Filter by status
curl "http://localhost:3000/api/ideas?status=draft"

# Get single idea (replace UUID)
curl http://localhost:3000/api/ideas/550e8400-e29b-41d4-a716-446655440000

# Update idea
curl -X PUT http://localhost:3000/api/ideas/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{"status": "validation"}'
```

### Using Postman or Insomnia

1. Import collection from [docs/API.md](./API.md)
2. Set base URL: `http://localhost:3000/api`
3. Test all endpoints

### Using Browser

Visit in browser:
- Health: http://localhost:3000/health
- Ideas: http://localhost:3000/api/ideas
- Filtered: http://localhost:3000/api/ideas?status=draft&minScore=60

## Next Steps

You're all set! Here's what to do next:

1. **Explore the API**: Read [docs/API.md](./API.md) for all endpoints
2. **Understand the Database**: Read [docs/DATABASE.md](./DATABASE.md) for schema
3. **Review Research System**: Check `research-system/` for domain knowledge
4. **Read Development Guide**: See [.claude/claude.md](../.claude/claude.md) for standards

### Phase 2: Add Idea Generation

Next phase adds:
- Claude API integration
- BullMQ job queue
- Auto-generation every 10 minutes

See [docs/RECENT_CHANGES.md](./RECENT_CHANGES.md) for roadmap.

## Getting Help

- **API Questions**: See [docs/API.md](./API.md)
- **Database Questions**: See [docs/DATABASE.md](./DATABASE.md)
- **Development Questions**: See [.claude/claude.md](../.claude/claude.md)
- **Setup Issues**: Check this guide's Troubleshooting section

## Quick Reference

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Run production build

# Database
npm run db:migrate   # Run migrations
npm run db:seed      # Seed with example data

# Reset Database (careful!)
psql -U postgres -c "DROP DATABASE project_idea_finder;"
psql -U postgres -c "CREATE DATABASE project_idea_finder;"
npm run db:migrate
npm run db:seed
```
