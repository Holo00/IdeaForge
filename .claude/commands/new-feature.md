# New Feature

Plan and implement a complete new feature (backend + frontend + database).

## Arguments
- **$ARGUMENTS**: Feature description (e.g., "user authentication with login/logout")

## Workflow

### 1. Design Phase

Use TodoWrite to plan the full feature:

```
Tasks:
1. Define feature scope and requirements
2. Design database schema (if needed)
3. Design API endpoints
4. Design frontend components
5. Create migration (if needed)
6. Implement backend (routes, controllers, services)
7. Implement frontend (pages, components)
8. Test the feature
9. Update documentation
```

### 2. Check Architecture

Read first:
- `.claude/docs/architecture.md` - Understand current structure
- `.claude/docs/conventions.md` - Follow patterns
- `.claude/docs/tech-context.md` - Technical constraints

### 3. Database Changes (If Needed)

If feature needs new tables/columns:
1. Create migration: `backend/db/migrations/NNN_description.sql`
2. Run: `npm run db:migrate`
3. Update types: `backend/src/types/index.ts`

Reference: `.claude/skills/database-changes/SKILL.md`

### 4. Backend Implementation

Create in order:
1. **Types** - `backend/src/types/index.ts`
2. **Repository** - `backend/src/repositories/{feature}Repository.ts`
3. **Service** - `backend/src/services/{feature}Service.ts`
4. **Controller** - `backend/src/api/controllers/{feature}Controller.ts`
5. **Routes** - `backend/src/api/routes/{feature}.ts`
6. **Register** - Add to `backend/src/index.ts`

Reference: `.claude/skills/api-endpoint/SKILL.md`

### 5. Frontend Implementation

Create in order:
1. **Types** - `frontend/types/index.ts`
2. **API calls** - Add to `frontend/lib/api.ts`
3. **Components** - `frontend/components/{Feature}/*.tsx`
4. **Page** - `frontend/app/{feature}/page.tsx`

### 6. Update Documentation

After implementation:
- `.claude/docs/architecture.md` - New files/structure
- `.claude/docs/recent-changes.md` - Feature entry
- `docs/API.md` - New endpoints
- `docs/DATABASE.md` - Schema changes

## Feature: $ARGUMENTS

Now plan and implement this feature following the workflow above.