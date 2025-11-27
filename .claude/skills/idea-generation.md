# Skill: Idea Generation System

## Overview

The idea generation system uses AI (Claude or Gemini) to create comprehensive business ideas with scoring, evaluation, and action plans.

## Architecture

```
GenerationController
  → IdeaGenerationService (orchestration)
    → PromptBuilder (builds AI prompt)
    → callAI() (sends to Claude/Gemini)
    → parseAIResponse() (extracts JSON)
    → EmbeddingService (duplicate detection)
    → IdeaRepository (saves to DB)
    → GenerationLogger (real-time logs)
```

## Generation Flow

### 1. Trigger Generation

```typescript
POST /api/generate
{
  "framework": "pain-point",  // optional, random if not specified
  "domain": "Healthcare",      // optional
  "skipDuplicateCheck": false, // optional
  "sessionId": "uuid"          // optional, for log tracking
}
```

### 2. Build Prompt (PromptBuilder)

The prompt is constructed from:

1. **Framework** - Selected from `idea-prompts.yaml` (Pain Point, Market Gap, etc.)
2. **Domains** - Random selection from `business-domains.yaml`
3. **Problems** - Random selection from `problem-types.yaml`
4. **Solutions** - Random selection from `solution-types.yaml`
5. **Criteria** - From `evaluation-criteria.yaml`
6. **Template** - From `generation-settings.yaml`

### 3. Call AI Provider

```typescript
const response = await callAI(prompt, {
  temperature: 1.0,      // From settings
  maxTokens: 16384,      // From settings
});
```

### 4. Parse Response

AI returns JSON with required structure:

```json
{
  "name": "Idea Name (max 60 chars)",
  "domain": "Domain → Subdomain",
  "problem": "Problem description",
  "solution": "Solution description",
  "quickSummary": "1-2 sentence elevator pitch",

  "concreteExample": {
    "currentState": "How users handle this today",
    "yourSolution": "How they'd use your product",
    "keyImprovement": "Quantifiable improvement"
  },

  "ideaComponents": {
    "monetization": "Revenue model",
    "targetAudience": "Specific user segment",
    "technology": "Tech stack needed",
    "marketSize": "Market size estimate"
  },

  "evaluation": {
    "problemSeverity": {
      "score": 8,
      "reasoning": "Why this score",
      "questions": [
        {"question": "How often?", "answer": "Specific answer"}
      ]
    },
    // ... more criteria
  },

  "quickNotes": {
    "strengths": ["..."],
    "weaknesses": ["..."],
    "keyAssumptions": ["..."],
    "nextSteps": ["..."],
    "references": ["..."]
  },

  "actionPlan": {
    "nextSteps": [...],
    "requiredResources": {...},
    "timeline": {...},
    "criticalPath": [...]
  },

  "tags": ["tag1", "tag2"]
}
```

### 5. Validation

The service validates:
- All required fields present
- All criteria have scores and questions
- Concrete example has all 3 parts
- Quick notes has all 5 sections

### 6. Duplicate Check

Two methods:
1. **Exact match** - Same domain + problem + solution
2. **Semantic** - Embedding similarity > 85%

### 7. Save to Database

Creates idea with:
- Calculated weighted score (0-100)
- Complexity scores (derived from evaluations)
- Generated folder name
- History entry for "created"
- Embedding stored for future duplicate checks

## Critical: Concrete Examples

**EVERY idea MUST have a concrete example with:**

1. **currentState** - How users handle this problem TODAY
   - Specific, detailed example
   - Real pain points

2. **yourSolution** - How they would use YOUR product
   - Step-by-step user experience
   - Clear value delivery

3. **keyImprovement** - What makes it BETTER
   - Quantifiable metrics (time saved, cost reduction)
   - Specific numbers

This is enforced in:
- `PromptBuilder` - Instructions in the prompt
- `parseAIResponse()` - Validation check
- Database schema - `concrete_example JSONB NOT NULL`

## Real-Time Logging

Generation progress is logged to `idea_generation_logs` table:

```typescript
const logger = new GenerationLogger(sessionId);

logger.info(GenerationStage.INIT, 'Starting generation', { framework });
logger.success(GenerationStage.API_CALL, 'Response received', { duration });
logger.error(GenerationStage.RESPONSE_PARSE, 'Parse failed', error);
```

Stages:
- `INIT` - Starting, checking config
- `CONFIG_LOAD` - Loading YAML configs
- `PROMPT_BUILD` - Building AI prompt
- `API_CALL` - Calling Claude/Gemini
- `RESPONSE_PARSE` - Parsing JSON response
- `DUPLICATE_CHECK` - Checking for duplicates
- `DB_SAVE` - Saving to database
- `COMPLETE` - Success
- `FAILED` - Error occurred

Frontend receives logs via SSE:
```
GET /api/logs/stream/{sessionId}
```

## Scoring System

### Individual Criteria (1-10)

Loaded dynamically from `evaluation-criteria.yaml`:
- Problem Severity
- Market Size
- Competition Level
- Monetization Clarity
- Technical Feasibility
- Personal Interest
- Unfair Advantage
- Time to Market
- Scalability Potential
- Network Effects

### Weighted Total Score (0-100)

```typescript
private async calculateWeightedScore(scores: IdeaScores): Promise<number> {
  const weights = await this.getWeightsFromConfig();

  let total = 0;
  let weightSum = 0;

  for (const [key, weight] of Object.entries(weights)) {
    if (scores[key] !== undefined) {
      total += scores[key] * weight;
      weightSum += weight * 10;
    }
  }

  return Math.round((total / weightSum) * 100);
}
```

### Complexity Scores (Derived)

- **Technical** - 11 - technicalFeasibility
- **Regulatory** - Based on timeToMarket reasoning
- **Sales** - 11 - ((marketSize + monetizationClarity) / 2)
- **Total** - Sum of above (3-30 range)

## Mutex for Concurrent Requests

Only one generation can run at a time:

```typescript
let isGenerating = false;

async generateIdea(req, res, next) {
  if (isGenerating) {
    return res.status(409).json({
      success: false,
      error: { code: 'GENERATION_IN_PROGRESS' }
    });
  }

  isGenerating = true;
  try {
    // ... generate
  } finally {
    isGenerating = false;
  }
}
```

## Key Files

| File | Purpose |
|------|---------|
| `services/ideaGenerationService.ts` | Main orchestration |
| `services/promptBuilder.ts` | Builds AI prompts |
| `services/configService.ts` | Loads YAML configs |
| `services/embeddingService.ts` | Duplicate detection |
| `lib/aiProvider.ts` | Claude/Gemini abstraction |
| `lib/logger.ts` | GenerationLogger class |
| `controllers/generationController.ts` | HTTP endpoint |