# Skill: BullMQ Jobs

## Current Status: NOT IMPLEMENTED

**Important**: BullMQ is installed in `package.json` but is **not actively used** in this project.

The `backend/src/jobs/` folder does **not exist**.

Generation is currently **manual only** via the `/api/generate` endpoint.

## Evidence

From `backend/src/index.ts`:
```typescript
// Skip job queue initialization (Redis not running)
// Manual idea generation still works via API
console.log('⚠ Job queue disabled (Redis not running) - Manual generation available via API');
```

No imports of `bullmq` exist in the `backend/src/` directory.

## If You Need to Implement BullMQ

### Prerequisites

1. Install Redis locally or use a Redis service
2. Add Redis connection to `.env`:
   ```
   REDIS_URL=redis://localhost:6379
   ```

### Implementation Steps

#### 1. Create Jobs Directory

```bash
mkdir backend/src/jobs
```

#### 2. Create Queue Setup

`backend/src/jobs/queue.ts`:
```typescript
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export const ideaQueue = new Queue('idea-generation', { connection });
```

#### 3. Create Worker

`backend/src/jobs/ideaWorker.ts`:
```typescript
import { Worker, Job } from 'bullmq';
import { IdeaGenerationService } from '../services/ideaGenerationService';
import { IdeaRepository } from '../repositories/ideaRepository';
import { ConfigService } from '../services/configService';

const connection = new Redis(process.env.REDIS_URL);

const ideaRepository = new IdeaRepository();
const configService = new ConfigService();
const generationService = new IdeaGenerationService(ideaRepository, configService);

const worker = new Worker(
  'idea-generation',
  async (job: Job) => {
    console.log(`Processing job ${job.id}`);

    const result = await generationService.generateIdea({
      framework: job.data.framework,
      domain: job.data.domain,
    });

    return { ideaId: result.idea.id };
  },
  { connection }
);

worker.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed: ${result.ideaId}`);
});

worker.on('failed', (job, error) => {
  console.error(`Job ${job?.id} failed:`, error);
});

export default worker;
```

#### 4. Create Scheduler

`backend/src/jobs/scheduler.ts`:
```typescript
import { ideaQueue } from './queue';

// Schedule idea generation every 10 minutes
export async function startScheduler() {
  await ideaQueue.add(
    'scheduled-generation',
    { framework: 'random' },
    {
      repeat: {
        every: 10 * 60 * 1000, // 10 minutes
      },
    }
  );

  console.log('✓ Idea generation scheduled every 10 minutes');
}
```

#### 5. Initialize in index.ts

```typescript
import worker from './jobs/ideaWorker';
import { startScheduler } from './jobs/scheduler';

async function startServer() {
  // ... existing setup

  // Start job queue if Redis is available
  try {
    await startScheduler();
    console.log('✓ Job queue initialized');
  } catch (error) {
    console.log('⚠ Job queue disabled (Redis not available)');
  }

  // ... start server
}
```

## Alternative: Keep Manual Generation

The current manual approach works fine for this project:

1. User clicks "Generate" button
2. Frontend calls `POST /api/generate`
3. Backend generates idea synchronously
4. Real-time progress via SSE logs
5. Response includes generated idea

Benefits of manual approach:
- No Redis dependency
- Simpler deployment
- User controls when generation happens
- Real-time feedback built-in

## Documentation References

The old `CLAUDE.md` mentioned BullMQ with 10-minute auto-generation, but this was **never fully implemented**. The documentation was aspirational, not actual.