# Recent Changes

## [2025-01-26] - Database Normalization (Lookup Tables)

### Added

**New Lookup Tables** (Migration 011):
- `monetization_models` - Lookup table for all monetization model options
- `target_audiences` - Lookup table for all target audience options
- Both tables are pre-populated from master YAML configs

**New Ideas Table Columns**:
- `monetization_model_id` - FK to monetization_models lookup (nullable for backward compatibility)
- `target_audience_id` - FK to target_audiences lookup (nullable for backward compatibility)
- `estimated_team_size` - Promoted from JSONB to integer column for efficient filtering

**Filter Improvements**:
- Monetization and target audience filters now use JOIN to lookup tables
- Includes fallback to JSONB for legacy data (backward compatible)
- Team size filter uses promoted column with JSONB fallback

### Removed

**Redundant Column**:
- `evaluation_questions` - Removed (data was duplicate of `evaluation_details`)

### Benefits

| Before | After |
|--------|-------|
| JSONB operators for filtering | Simple JOIN queries |
| No FK constraints | Referential integrity |
| Manual validation | Automatic via FK |
| Inconsistent data possible | Data integrity guaranteed |

### Migration Notes

The migration automatically:
1. Creates lookup tables with all values from master config
2. Adds nullable FK columns to ideas table
3. Populates FK columns from existing JSONB data
4. Creates indexes for efficient filtering

Run: `npm run db:migrate`

---

## [2025-01-26] - Master Config Validation System

### Added

**Master vs Profile Config Architecture**:
- Master config in `/backend/config/` - single source of truth for all possible filter values
- Profile configs in `/backend/configs/{profile}/` - subset of master values, customized per profile
- Validation on write: profile configs are validated against master before saving
- New endpoint: `GET /api/config/filters` - returns ALL filter options from master config

**ConfigService Master Methods**:
- `getMasterFilterOptions()` - get all filter options from master (for UI filtering)
- `getMasterDomains()` - all domains from master
- `getMasterMonetizationModels()` - all monetization models from master
- `getMasterTargetAudiences()` - all target audiences from master
- `getMasterProblemTypes()` - all problem types from master
- `getMasterSolutionTypes()` - all solution types from master

**Profile Validation**:
- When saving a profile config (domains, monetization, audiences, problem types, solution types), values are validated against master
- Invalid values (not in master) cause a `ValidationError` with list of invalid items
- This prevents filter drift when cloning/editing profiles

**Purpose**:
- Profiles can customize WHICH options they use for generation (subset of master)
- Filtering in UI always shows ALL options from master (consistent across profiles)
- Data integrity: ideas generated with any profile will have valid filter values

---

## [2025-01-26] - Admin Authentication & Configuration Cloning

### Added

**Authentication System**:
- JWT-based admin authentication with Bearer tokens
- Login endpoint: `POST /api/auth/login`
- Token validation endpoint: `GET /api/auth/validate`
- Protected routes require `Authorization: Bearer <token>` header
- AuthContext for frontend state management with route protection
- Admin login page at `/admin/login`

**Route Protection**:
- **Public routes**: `GET /api/ideas`, `GET /api/ideas/:id`, `GET /api/ideas/:id/history`
- **Protected routes**: All write operations (PUT, DELETE on ideas), generation, config, logs

**Configuration Profile Cloning**:
- New endpoint: `POST /api/config/profiles/:id/clone`
- Clones all YAML config files from source profile to new folder
- Clone button (purple) in Config page ProfileSelector
- Auto-selects cloned profile after creation

### Fixed

**Login Redirect Race Condition**:
- Fixed issue where dashboard would flash then redirect back to login
- Root cause: Login page was setting localStorage directly without updating AuthContext state
- Solution: Use `useAuth().login()` which updates React state immediately

---

## [2025-01-21] - Initial MVP Implementation

### Added

**Project Structure**:
- Created backend folder structure following SOLID principles
- Organized code into layers: controllers, routes, services, repositories
- Set up TypeScript with strict mode
- Configured ESLint and Prettier

**Database**:
- PostgreSQL schema with 5 core tables:
  - `ideas` - Generated ideas with full evaluation data
  - `config` - Configuration storage (JSONB)
  - `generation_jobs` - Job queue tracking
  - `idea_history` - Audit trail for idea changes
  - `learnings` - Insights from failures
- Migration system (`npm run db:migrate`)
- Seed script to load data from `research-system/` (`npm run db:seed`)
- Indexes for performance (status, domain, score, tags)
- Auto-updating timestamps via triggers

**API Endpoints**:
- `GET /api/ideas` - List ideas with filtering, sorting, pagination
- `GET /api/ideas/:id` - Get single idea
- `PUT /api/ideas/:id` - Update idea (partial updates supported)
- `DELETE /api/ideas/:id` - Delete idea
- `GET /api/ideas/:id/history` - Get idea evolution history
- `GET /health` - Health check endpoint

**Core Features**:
- Standardized API response format (success/error)
- Custom error classes with proper HTTP status codes
- Zod validation for all API inputs
- Global error handling middleware
- Weighted score calculation (0-80 scale)
- Automatic idea history tracking
- Connection pooling with graceful shutdown

**Documentation**:
- [API.md](./API.md) - Complete API documentation with examples
- [DATABASE.md](./DATABASE.md) - Database schema, design principles, queries
- [.claude/claude.md](../.claude/claude.md) - Development guide with SOLID principles, workflow standards

**Configuration**:
- `.env.example` - Environment variables template
- TypeScript strict mode enabled
- Database connection with retry logic

### Migration Required

To set up the project:

- [ ] Install PostgreSQL locally or use a cloud instance
- [ ] Create database: `CREATE DATABASE project_idea_finder;`
- [ ] Copy `.env.example` to `.env` and configure:
  ```
  DATABASE_URL=postgresql://user:password@localhost:5432/project_idea_finder
  PORT=3000
  ```
- [ ] Install dependencies: `npm install`
- [ ] Run migrations: `npm run db:migrate`
- [ ] Seed database: `npm run db:seed` (loads data from research-system/)
- [ ] Start dev server: `npm run dev`

### Technical Decisions

**Why PostgreSQL + JSONB?**
- Structured columns for queryable data (status, domain, score)
- JSONB for flexible data (scores, evaluation details, config)
- Can add new criteria without schema migrations
- Best of both worlds: relational + document store

**Why separate layers?**
- **Repository**: Database access only
- **Service**: Business logic (score calculation, validation)
- **Controller**: HTTP handling, request/response transformation
- **Middleware**: Cross-cutting concerns (errors, auth)
- Follows Single Responsibility Principle
- Easy to test each layer independently

**Why weighted scoring?**
- Not all criteria are equally important
- Problem severity 2x weight (if problem isn't painful, nothing matters)
- Monetization 2x weight (need clear path to revenue)
- Unfair advantage 2x weight (defensibility = long-term success)
- Based on research-system/tools/decision-matrix.md

### Known Limitations

1. **No idea generation yet** - Claude API integration pending (Phase 2)
2. **No authentication** - API is currently open (Phase 3)
3. **No BullMQ job queue** - Auto-generation not implemented (Phase 2)
4. **No frontend** - Backend only (Phase 3)
5. **Seed script uses simplified markdown parsing** - Works for current examples but not production-ready

### Next Steps

**Phase 2** (Idea Generation):
- [ ] Integrate Anthropic Claude API
- [ ] Implement idea generation service
- [ ] Set up BullMQ job queue
- [ ] Add Redis for queue management
- [ ] Create `POST /api/ideas/generate` endpoint
- [ ] Implement auto-generation (every 10 minutes)
- [ ] Add duplicate detection before generation
- [ ] Implement refinement prompts

**Phase 3** (Configuration & Frontend):
- [ ] Configuration API endpoints
- [ ] Configuration UI (edit domains, criteria, templates)
- [ ] React/Next.js frontend
- [ ] Browse/filter/search UI
- [ ] Idea detail view
- [ ] Learning repository UI
- [ ] Export to markdown functionality

### Breaking Changes

None - this is the initial release.

### Bug Fixes

None - this is the initial release.
