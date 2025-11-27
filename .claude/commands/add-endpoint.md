# Add API Endpoint

Add a new API endpoint following project patterns.

## Arguments
- **$ARGUMENTS**: Description of the endpoint (e.g., "GET /api/stats to return idea statistics")

## Workflow

### 1. Plan the Endpoint

First, use TodoWrite to plan the implementation:

```
Tasks:
1. Review existing patterns in similar routes
2. Create/update route file
3. Create/update controller
4. Create/update service (if business logic needed)
5. Create/update repository (if database access needed)
6. Register route in index.ts (if new file)
7. Update API documentation
```

### 2. Review Patterns

Read the skill guide first:
- `.claude/skills/api-endpoint/SKILL.md`

Then check existing implementations:
- `backend/src/api/routes/ideas.ts` - CRUD example
- `backend/src/api/routes/generation.ts` - Simple example
- `backend/src/api/controllers/ideasController.ts` - Validation patterns

### 3. Implement Following Pattern

**Route file** (`backend/src/api/routes/{resource}.ts`):
```typescript
import { Router } from 'express';
// Initialize dependencies
// Define routes
export default router;
```

**Controller** (`backend/src/api/controllers/{resource}Controller.ts`):
```typescript
// Zod schemas at top
// Class with methods that:
//   - Validate input
//   - Call service
//   - Return ApiResponse
//   - Pass errors to next()
```

### 4. Register Route

If new route file, add to `backend/src/index.ts`:
```typescript
import myRouter from './api/routes/my';
app.use('/api/my-resource', myRouter);
```

### 5. Update Documentation

After implementation, update:
- `docs/API.md` - Add endpoint documentation
- `.claude/docs/recent-changes.md` - Note the addition

## Endpoint: $ARGUMENTS

Now implement this endpoint following the workflow above.