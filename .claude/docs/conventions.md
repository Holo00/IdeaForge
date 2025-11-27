# Coding Conventions

## TypeScript Standards

### Compiler Settings

Both backend and frontend use **strict mode**:

```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true
}
```

| Setting | Backend | Frontend |
|---------|---------|----------|
| Target | ES2022 | ES2020 |
| Module | CommonJS | ESNext |
| Strict | Yes | Yes |

### Type Definitions

- All types defined in `backend/src/types/index.ts` and `frontend/types/index.ts`
- Use interfaces for object shapes, types for unions/aliases
- JSONB fields typed with specific interfaces, not `any` (except `Config.data`)

```typescript
// Good - specific interface
export interface IdeaScores {
  [key: string]: number;
}

// Acceptable for truly dynamic JSONB
data: any; // JSONB - flexible structure
```

---

## API Response Format

All API responses use a standardized envelope:

```typescript
// Success response
{
  success: true,
  data: { ... }
}

// Error response
{
  success: false,
  error: {
    message: "User-friendly message",
    code: "ERROR_CODE",
    details?: { ... }
  }
}
```

### Type Definition

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

interface ApiError {
  message: string;
  code: string;
  details?: any;
}
```

### Usage in Controllers

```typescript
// Always wrap response in ApiResponse
const response: ApiResponse<typeof result> = {
  success: true,
  data: result,
};
res.json(response);
```

---

## Validation Pattern

Use **Zod** for request validation in controllers:

```typescript
import { z } from 'zod';

// Define schema at top of file
const UpdateIdeaSchema = z.object({
  name: z.string().min(1).max(500).optional(),
  status: z.enum(['draft', 'validation', 'research', 'build', 'archived']).optional(),
  scores: z.object({
    problemSeverity: z.number().min(1).max(10).optional(),
    // ...
  }).optional(),
});

// Use in handler
const updates = UpdateIdeaSchema.parse(req.body);
```

### Query Parameter Coercion

For query params that come as strings:

```typescript
const GetIdeasQuerySchema = z.object({
  minScore: z.coerce.number().min(0).max(100).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});
```

### Zod Errors

Handled automatically by global error handler - returns 400 with `VALIDATION_ERROR` code.

---

## Error Handling

### Custom Error Classes

Located in `backend/src/lib/errors.ts`:

| Class | Status Code | Error Code | Use Case |
|-------|-------------|------------|----------|
| `AppError` | Custom | Custom | Base class |
| `ValidationError` | 400 | `VALIDATION_ERROR` | Invalid input |
| `NotFoundError` | 404 | `NOT_FOUND` | Resource doesn't exist |
| `ConflictError` | 409 | `CONFLICT` | Duplicate, state conflict |
| `ExternalServiceError` | 502 | `EXTERNAL_SERVICE_ERROR` | AI API failures |

### Usage

```typescript
import { ValidationError, NotFoundError } from '../../lib/errors';

// In service/controller
if (!idea) {
  throw new NotFoundError('Idea', id);
}

if (invalidInput) {
  throw new ValidationError('Name is required', { field: 'name' });
}
```

### Global Error Handler

Located in `backend/src/api/middleware/errorHandler.ts`:

- Catches all errors
- Returns standardized `ApiResponse` format
- Handles `AppError` subclasses with appropriate status codes
- Handles Zod errors as 400 validation errors
- Returns 500 for unknown errors (hides internal details)

```typescript
// Errors pass through via next()
try {
  // ... handler logic
} catch (error) {
  next(error);  // Let global handler format response
}
```

---

## File Naming Conventions

### Backend

| Type | Convention | Example |
|------|------------|---------|
| Routes | `camelCase.ts` | `config.ts`, `ideas.ts` |
| Controllers | `camelCaseController.ts` | `ideasController.ts` |
| Services | `camelCaseService.ts` | `ideaService.ts` |
| Repositories | `camelCaseRepository.ts` | `ideaRepository.ts` |
| Middleware | `camelCase.ts` | `errorHandler.ts` |
| Types | `index.ts` (single file) | `types/index.ts` |

### Frontend

| Type | Convention | Example |
|------|------------|---------|
| Pages | `page.tsx` (Next.js App Router) | `app/ideas/page.tsx` |
| Components | `PascalCase.tsx` | `GenerationControls.tsx` |
| Contexts | `PascalCaseContext.tsx` | `ConfigProfileContext.tsx` |
| Hooks | `useCamelCase.ts` | (none currently) |

### Database

| Type | Convention | Example |
|------|------------|---------|
| Tables | `snake_case` | `idea_history`, `api_keys` |
| Columns | `snake_case` | `created_at`, `folder_name` |
| Migrations | `NNN_description.sql` | `001_initial_schema.sql` |

---

## Code Organization

### Controllers (Thin)

Controllers only:
- Parse/validate request
- Call service method
- Format response

```typescript
// Good - thin controller
async getIdea(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const idea = await this.ideaService.getIdea(id);

    if (!idea) {
      throw new NotFoundError('Idea', id);
    }

    res.json({ success: true, data: idea });
  } catch (error) {
    next(error);
  }
}
```

### Services (Business Logic)

Services contain:
- Business rules
- Data transformation
- Orchestration of multiple operations

```typescript
// Good - logic in service
async updateIdea(id: string, request: UpdateIdeaRequest): Promise<Idea> {
  const existing = await this.ideaRepository.findById(id);
  if (!existing) {
    throw new ValidationError('Idea not found');
  }

  // Business logic: recalculate score if scores changed
  if (request.scores !== undefined) {
    updates.score = await this.calculateTotalScore(updates.scores);
  }

  // Track history
  await this.ideaRepository.addHistory(id, 'updated', ...);

  return this.ideaRepository.update(id, updates);
}
```

### Repositories (Data Access)

Repositories only:
- SQL queries
- Database-to-model mapping

```typescript
// Good - just data access
async findById(id: string): Promise<Idea | null> {
  const result = await queryOne<any>(
    'SELECT * FROM ideas WHERE id = $1',
    [id]
  );
  return result ? this.mapFromDb(result) : null;
}
```

---

## Discrepancies Found

### Documentation vs Reality

| Item | Old claude.md Said | Actual Code |
|------|-------------------|-------------|
| BullMQ | "Runs every 10 minutes" | No active BullMQ - generation is manual via API |
| `jobs/` folder | Listed in structure | Does not exist |
| Score range | "0-80 scale" | Actually 0-100 scale |
| Criteria count | "8 criteria" | Dynamic - loaded from config |

### Deprecated Code Still Present

The following deprecated items exist in code but should not be used:

- `template` property → Use `framework` instead
- `getRandomTemplate()` → Use `getRandomFramework()`
- `getTemplate()` → Use `getFramework()`
- Routes `/api/config/templates` → Use `/api/config/frameworks`