# Skill: Adding API Endpoints

## Pattern Overview

This project uses a **Routes → Controller → Service → Repository** pattern:

```
Route (routing + DI setup)
  → Controller (validation + response formatting)
    → Service (business logic)
      → Repository (database access)
```

## Step-by-Step Process

### 1. Create/Update Route File

Location: `backend/src/api/routes/{resource}.ts`

```typescript
import { Router } from 'express';
import { MyController } from '../controllers/myController';
import { MyService } from '../../services/myService';
import { MyRepository } from '../../repositories/myRepository';

const router = Router();

// Initialize dependencies (manual DI)
const myRepository = new MyRepository();
const myService = new MyService(myRepository);
const myController = new MyController(myService);

// Routes - wrap controller methods to pass req, res, next
router.get('/', (req, res, next) => myController.getAll(req, res, next));
router.get('/:id', (req, res, next) => myController.getOne(req, res, next));
router.post('/', (req, res, next) => myController.create(req, res, next));
router.put('/:id', (req, res, next) => myController.update(req, res, next));
router.delete('/:id', (req, res, next) => myController.delete(req, res, next));

export default router;
```

### 2. Create Controller

Location: `backend/src/api/controllers/{resource}Controller.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { MyService } from '../../services/myService';
import { ApiResponse } from '../../types';
import { z } from 'zod';
import { NotFoundError } from '../../lib/errors';

// Define Zod schemas at top of file
const CreateSchema = z.object({
  name: z.string().min(1).max(255),
  value: z.number().optional(),
});

const QuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
});

export class MyController {
  constructor(private myService: MyService) {}

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate query params
      const query = QuerySchema.parse(req.query);

      const result = await this.myService.getAll(query);

      // Always use ApiResponse wrapper
      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      next(error); // Let global error handler format response
    }
  }

  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const item = await this.myService.getOne(id);

      if (!item) {
        throw new NotFoundError('Item', id);
      }

      const response: ApiResponse<typeof item> = {
        success: true,
        data: item,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body
      const data = CreateSchema.parse(req.body);

      const item = await this.myService.create(data);

      const response: ApiResponse<typeof item> = {
        success: true,
        data: item,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
}
```

### 3. Register Route in index.ts

Location: `backend/src/index.ts`

```typescript
import myRouter from './api/routes/my';

// Add with other routes
app.use('/api/my-resource', myRouter);
```

## Real Example: Ideas Routes

From `backend/src/api/routes/ideas.ts`:

```typescript
import { Router } from 'express';
import { IdeasController } from '../controllers/ideasController';
import { IdeaService } from '../../services/ideaService';
import { IdeaRepository } from '../../repositories/ideaRepository';
import { ConfigService } from '../../services/configService';

const router = Router();

// Initialize dependencies
const ideaRepository = new IdeaRepository();
const configService = new ConfigService();
const ideaService = new IdeaService(ideaRepository, configService);
const ideasController = new IdeasController(ideaService);

// Routes
router.get('/', (req, res, next) => ideasController.getIdeas(req, res, next));
router.get('/:id', (req, res, next) => ideasController.getIdea(req, res, next));
router.put('/:id', (req, res, next) => ideasController.updateIdea(req, res, next));
router.delete('/:id', (req, res, next) => ideasController.deleteIdea(req, res, next));
router.get('/:id/history', (req, res, next) => ideasController.getIdeaHistory(req, res, next));

export default router;
```

## Response Format

All responses must use `ApiResponse<T>`:

```typescript
// Success
{
  success: true,
  data: { ... }
}

// Error (handled by errorHandler middleware)
{
  success: false,
  error: {
    message: "User-friendly message",
    code: "ERROR_CODE",
    details?: { ... }
  }
}
```

## Validation with Zod

- Define schemas at top of controller file
- Use `z.coerce.number()` for query params (they come as strings)
- Zod errors are automatically handled by global error handler

## Key Points

1. **Controllers are thin** - only validation and response formatting
2. **Business logic goes in services**
3. **Always wrap responses** in `ApiResponse<T>`
4. **Always pass errors to `next()`** - don't catch and format manually
5. **Use Zod for all input validation**
6. **Manual DI in route files** - no DI framework