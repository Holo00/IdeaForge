# Recent Changes

## [2025-11-26] - Advanced Filtering System

### Added
- **Extended API Filtering** (`backend/src/repositories/ideaRepository.ts`)
  - `subdomain` - Filter by subdomain (exact match)
  - `search` - Full-text search on name and quick_summary (ILIKE)
  - `framework` - Filter by generation framework
  - `monetization` - Filter by idea_components monetization (ILIKE)
  - `targetAudience` - Filter by idea_components targetAudience (ILIKE)
  - `technology` - Filter by idea_components technology (ILIKE)
  - `maxTeamSize` - Filter by estimated team size
  - `minCriteriaScores` - Filter by minimum scores for individual evaluation criteria

- **New API Endpoints** (`backend/src/api/routes/config.ts`)
  - `GET /api/config/monetization-models` - Get monetization model options
  - `GET /api/config/target-audiences` - Get target audience options

- **Team Size in AI Generation** (`backend/src/services/promptBuilder.ts`)
  - Added `estimatedTeamSize` (integer 1-10) to ideaComponents output
  - Added `estimatedTeamSizeReasoning` for explanation

- **Database Migration** (`backend/db/migrations/010_add_filter_indexes.sql`)
  - GIN indexes for idea_components and scores JSONB
  - B-tree indexes for specific JSONB paths (monetization, targetAudience, etc.)
  - Index for generation_framework and subdomain columns
  - Trigram indexes for full-text search (requires pg_trgm extension)

- **AdvancedFilters Component** (`frontend/components/ideas/AdvancedFilters.tsx`)
  - Search bar for name/summary
  - Domain/Subdomain dropdowns (cascading)
  - Framework, Monetization, Target Audience dropdowns
  - Max Team Size selector
  - Min Score slider
  - Individual criteria score sliders (collapsible)
  - Reset and Apply buttons

### Changed
- Ideas page now uses AdvancedFilters component
- Frontend API client supports all new filter parameters
- Filter logic uses AND for combining multiple filters

### Migration Required
- [ ] Run migration: `npm run db:migrate`
- [ ] Enable pg_trgm extension for trigram search: `CREATE EXTENSION IF NOT EXISTS pg_trgm;`

---

## [2025-11-26] - Configuration Profile Cloning

### Added
- **Clone Profile Endpoint** (`POST /api/config/profiles/:id/clone`)
  - Copies all YAML config files from source profile to new folder
  - Creates new database entry with "Cloned from {source}" description
  - Validates folder_name format (alphanumeric, dashes, underscores only)
- **Clone Button in ProfileSelector** (`frontend/components/config/ProfileSelector.tsx`)
  - Purple "Clone" button between "New Config" and "Delete"
  - Clone dialog pre-fills with "{name} (Copy)" and "{folder_name}-copy"
  - Auto-selects cloned profile after creation
- **Frontend API Method** (`frontend/lib/api.ts`)
  - `api.cloneConfigProfile(id, { name, folder_name })`

### Changed
- Ideas API routes now have granular auth:
  - Public: `GET /api/ideas`, `GET /api/ideas/:id`, `GET /api/ideas/:id/history`
  - Protected: `PUT /api/ideas/:id`, `DELETE /api/ideas/:id`

### Fixed
- **Login Redirect Race Condition**: Dashboard would flash then redirect back to login
  - Cause: Login page was setting localStorage directly without updating AuthContext
  - Fix: Use `useAuth().login()` to update React state immediately

---

## [2025-11-26] - Admin Authentication System

### Added
- **Backend Auth Routes** (`backend/src/api/routes/auth.ts`)
  - `POST /api/auth/login` - Admin login with JWT token
  - `POST /api/auth/logout` - Logout endpoint
  - `GET /api/auth/check` - Verify authentication status
  - `requireAuth` middleware for protecting routes
  - `requireAdmin` middleware (for future role expansion)
- **Frontend Auth Context** (`frontend/contexts/AuthContext.tsx`)
  - Authentication state management
  - Route protection for `/dashboard`, `/config`, `/ideas`
  - Auto-redirect to login when unauthenticated
- **New Pages**
  - `/admin/login` - Admin login page
  - `/` - Public landing page (placeholder)
  - `/dashboard` - Dashboard moved from root

### Changed
- Dashboard moved from `/` to `/dashboard`
- All API routes now require authentication (except `/api/auth/*`)
- Navigation shows/hides links based on auth state
- API client includes auth token in all requests
- Logo links to `/dashboard` when authenticated, `/` when not

### Environment Variables
```env
JWT_SECRET=your-secret-key-change-in-production
ADMIN_PASSWORD=your-admin-password
```

### Default Credentials (Development)
- Username: `admin`
- Password: `admin123` (change via `ADMIN_PASSWORD` env var)

### Migration Notes
- No database changes required
- Add `JWT_SECRET` and `ADMIN_PASSWORD` to `.env` file
- Install new dependency: `npm install jsonwebtoken @types/jsonwebtoken`

---

## [2025-11-26] - Claude Config Restructure & Cleanup

### Added
- `.claude/docs/architecture.md` - Project structure and database schema reference
- `.claude/docs/conventions.md` - Coding standards and patterns
- `.claude/docs/workflow.md` - Development process and methodology
- `.claude/docs/tech-context.md` - Technical stack and integrations
- `.claude/docs/recent-changes.md` - This changelog
- `backend/scripts/mark-migration-done.ts` - Improved migration utility with CLI args

### Changed
- Restructured `.claude/` folder with docs/, agents/, skills/, commands/ subfolders
- Moved `mark-migration-done.ts` from `db/` to `scripts/` folder

### Removed
- `backend/src/lib/claude.ts` - Unused, replaced by `aiProvider.ts`
- `backend/add-opus-model.ts` - One-time script no longer needed
- `backend/db/mark-migration-done.ts` - Moved to scripts folder
- Root-level obsolete docs: `criteria-analysis.md`, `domain-expansion-prompt.md`, `GENERATION_PROCESS.md`, `PHASE2_SUMMARY.md`, `PHASE3_SUMMARY.md`

### Archived
- `research-system/` folder moved to `_archive/research-system/`

---

## [2025-11-22] - Configuration Profile Management System

### Added
- Full CRUD system for managing multiple configuration profiles
- Database table `configuration_profiles` with fields: id, name, folder_name, description, is_active
- Backend API endpoints:
  - `GET /api/config/profiles` - List all profiles
  - `GET /api/config/profiles/active` - Get active profile
  - `POST /api/config/profiles` - Create new profile (copies from default)
  - `POST /api/config/profiles/:id/activate` - Switch active profile
  - `DELETE /api/config/profiles/:id` - Delete profile (protects active)
- Frontend `ProfileSelector.tsx` component with dropdown and create dialog
- Profile selector in `GenerationControls.tsx` for dashboard switching

### Changed
- Configuration files now stored in `backend/configs/{folder_name}/` directories
- Each profile has 5 YAML files: frameworks, criteria, domains, prompt, settings
- Only one profile can be active at a time (enforced by database)
- Active profile determines settings used for idea generation

---

## [2025-11-22] - Component Refactoring

### Changed
- Config page refactored from 2,148 lines to 529 lines (75% reduction)
- Split into 8 separate components:
  - `ProfileSelector.tsx` (203 lines)
  - `FrameworksEditor.tsx` (241 lines)
  - `CriteriaEditor.tsx` (260 lines)
  - `DomainsEditor.tsx` (276 lines)
  - `PromptEditor.tsx` (200 lines)
  - `SettingsEditor.tsx` (184 lines)
  - `ApiKeysEditor.tsx` (275 lines)
  - `HowItWorksSection.tsx` (232 lines)

---

## [2025-11-22] - Dark Mode Implementation

### Added
- Complete dark mode support across all pages using Tailwind CSS
- `ThemeProvider.tsx` component using next-themes

### Changed
- All pages updated with dark mode classes:
  - Configuration page (`app/config/page.tsx`)
  - Dashboard page (`app/page.tsx`)
  - Ideas browse page (`app/ideas/page.tsx`)
  - All components: GenerationControls, RecentIdeas, LogsViewer

### Dark Mode Color Scheme
```
Backgrounds:      bg-white        → dark:bg-gray-800
Secondary:        bg-gray-50      → dark:bg-gray-700
Text primary:     text-gray-900   → dark:text-gray-100
Text secondary:   text-gray-600   → dark:text-gray-300
Borders:          border-gray-200 → dark:border-gray-700
Hover:            hover:bg-gray-50 → dark:hover:bg-gray-700
```

---

## [2025-11-22] - Dashboard Layout Changes

### Changed
- Reordered components: LogsViewer now appears above RecentIdeas
- Added configuration profile selector to GenerationControls
- Updated Quick Stats section with dark mode

### Current Layout
```
Dashboard
├── Left Column: GenerationControls
│   ├── Status indicator
│   ├── Configuration profile selector
│   ├── Automatic generation toggle
│   ├── Queue statistics
│   └── Manual generation button
└── Right Column:
    ├── LogsViewer
    └── RecentIdeas
```

---

# Template for Future Entries

```markdown
## [YYYY-MM-DD] - Feature/Change Name

### Added
- New feature or file added

### Changed
- Modifications to existing functionality

### Fixed
- Bug fixes

### Removed
- Deleted files or features

### Migration Required
- [ ] Step 1: Run migration
- [ ] Step 2: Update config
```