# Phase 2 API - Idea Generation

## Generate New Idea

**POST /api/generate**

Generate a new software business idea using Claude API and research-system templates.

### Request Body (all optional):

```json
{
  "template": "Pain Point Formula",
  "domain": "Healthcare & Medical",
  "skipDuplicateCheck": false
}
```

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `template` | string | Generation template name (e.g., "Pain Point Formula", "Unbundling", "Geographic Arbitrage") | random |
| `domain` | string | Specific domain to focus on | random |
| `skipDuplicateCheck` | boolean | Skip duplicate detection | false |

### Available Templates:

From `research-system/config/idea-prompts.yaml`:
- **Pain Point Formula**: "What if [target audience] could [solution approach] to solve [problem type]?"
- **Unbundling**: Take complex platform, extract single feature, make it 10x better
- **Industry Crossover**: Apply solution from one industry to problems in another
- **New Enabler**: What's now possible with [new technology]?
- **Geographic Arbitrage**: Proven model from Country A adapted for Country B
- **B2B SaaS-ification**: Convert manual/spreadsheet process into software
- **Marketplace Model**: Connect two sides that currently struggle to find each other
- **Vertical Niche**: Take horizontal tool, specialize for specific industry
- **AI Enhancement**: Add AI to existing workflow to make it 10x faster/better

### Example Request:

```bash
curl -X POST http://localhost:5000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "template": "Pain Point Formula"
  }'
```

### Response (201 Created):

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "AI-Powered Contract Review for Small Law Firms",
    "folderName": "ai-contract-review-2025-01",
    "status": "draft",
    "score": 67,
    "domain": "Legal Services",
    "subdomain": "Contract Law",
    "problem": "Time Consuming",
    "solution": "AI/ML + Document Analysis",
    "scores": {
      "problemSeverity": 9,
      "marketSize": 8,
      "competition": 5,
      "monetization": 9,
      "technicalFeasibility": 7,
      "personalInterest": 7,
      "unfairAdvantage": 6,
      "timeToMarket": 7
    },
    "quickSummary": "AI-powered tool that reviews contracts in minutes instead of hours, flagging risks and suggesting improvements for small law firms.",
    "concreteExample": {
      "currentState": "Today, small law firms spend 2-4 hours manually reviewing each contract. Junior lawyers read every clause, check for standard issues, compare against templates, flag risky language...",
      "yourSolution": "Upload contract PDF → AI analyzes in 3-5 minutes → Generates report with: risk score, flagged clauses, suggested edits, comparison to industry standards...",
      "keyImprovement": "Review time: 3 hours → 5 minutes (36x faster). Cost: $300/review → $20/review (15x cheaper). Accuracy: same or better due to AI catching subtle patterns..."
    },
    "evaluationDetails": {
      "problemSeverity": {
        "score": 9,
        "reasoning": "Small law firms lose $50-100K/year on inefficient contract review. Partners bill $300/hour but spend time on tedious review work..."
      }
      // ... all 8 criteria
    },
    "tags": ["ai", "legal", "saas", "document-analysis"],
    "generationFramework": null,
    "createdAt": "2025-01-21T12:00:00.000Z",
    "updatedAt": "2025-01-21T12:00:00.000Z",
    "parentIdeaId": null
  }
}
```

### Error Responses:

**ANTHROPIC_API_KEY not configured** (502):
```json
{
  "success": false,
  "error": {
    "message": "Claude API: ANTHROPIC_API_KEY not configured",
    "code": "EXTERNAL_SERVICE_ERROR"
  }
}
```

**Duplicate idea exists** (409):
```json
{
  "success": false,
  "error": {
    "message": "Similar idea already exists: AI Contract Review for Law Firms",
    "code": "CONFLICT",
    "details": {
      "existingId": "existing-uuid"
    }
  }
}
```

**Claude API rate limit** (502):
```json
{
  "success": false,
  "error": {
    "message": "Claude API: Rate limit exceeded",
    "code": "EXTERNAL_SERVICE_ERROR"
  }
}
```

### Notes:

- **Requires**: `ANTHROPIC_API_KEY` in `.env` file
- **Cost**: ~$0.01-0.05 per idea (Claude API pricing)
- **Time**: 10-30 seconds per generation
- **Duplicate Detection**: Checks domain + problem + solution combination
- **Concrete Examples**: Always included (CRITICAL requirement)
- **Auto-saved**: Idea immediately saved to database with full history

---

## Auto-Generation (BullMQ)

When Redis is configured, ideas generate automatically every 10 minutes (configurable).

### Configuration:

In `.env`:
```bash
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Generation interval
IDEA_GENERATION_INTERVAL_MINUTES=10  # Default: 10 minutes
```

### How It Works:

1. **Scheduled Job**: BullMQ creates repeatable job every N minutes
2. **Worker**: Processes job by calling generation service
3. **Random Template**: Picks random template from 9 available
4. **Random Domain**: Picks random domain/subdomain from 500+ options
5. **Duplicate Check**: Skips if similar idea exists
6. **Database Log**: Records in `generation_jobs` table

### Monitoring:

Check logs:
```bash
npm run dev

# Output:
✓ Idea generation worker started
✓ Queue event listeners started
✓ Scheduled idea generation every 10 minutes
[Queue] Job 1 is waiting
[Queue] Job 1 is active
[Job 1] Processing idea generation...
[Job 1] ✓ Completed in 15234ms
[Job 1] Generated: AI-Powered X (67/80)
```

### Job Status:

Query `generation_jobs` table:
```sql
SELECT * FROM generation_jobs
ORDER BY started_at DESC
LIMIT 10;
```

Or via API (future):
```bash
GET /api/jobs?status=completed&limit=10
```

---

## Setup Instructions

### 1. Get Anthropic API Key

1. Sign up at [console.anthropic.com](https://console.anthropic.com)
2. Create API key
3. Add to `.env`:
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### 2. Install Redis (Optional - for auto-generation)

**Windows** (via Memurai):
```bash
# Download from https://www.memurai.com/
# Or use Docker:
docker run -d -p 6379:6379 redis:latest
```

**Mac**:
```bash
brew install redis
brew services start redis
```

**Linux**:
```bash
sudo apt install redis-server
sudo systemctl start redis
```

### 3. Start Server

```bash
npm run dev

# Check logs:
✓ Database connection successful
✓ Idea generation worker started  # Only if Redis is available
✓ Queue event listeners started   # Only if Redis is available
✓ Scheduled idea generation every 10 minutes  # Only if Redis is available
✓ Server running on port 5000
```

### 4. Generate Your First Idea

**Manual trigger**:
```bash
curl -X POST http://localhost:5000/api/generate \
  -H "Content-Type: application/json"
```

**Wait for auto-generation** (if Redis is running):
- First idea generates in ~10 minutes
- Check database: `SELECT * FROM ideas ORDER BY created_at DESC LIMIT 1;`
- Or via API: `curl http://localhost:5000/api/ideas?limit=1&sortBy=created`

---

## Example Generation Workflow

```bash
# 1. Generate random idea
curl -X POST http://localhost:5000/api/generate

# 2. Generate with specific template
curl -X POST http://localhost:5000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"template": "Geographic Arbitrage"}'

# 3. Generate for specific domain
curl -X POST http://localhost:5000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"domain": "Healthcare & Medical"}'

# 4. View all generated ideas
curl http://localhost:5000/api/ideas?sortBy=created&sortOrder=desc

# 5. View high-scoring ideas
curl "http://localhost:5000/api/ideas?minScore=65&sortBy=score&sortOrder=desc"
```

---

## Troubleshooting

### "ANTHROPIC_API_KEY not configured"
- Add API key to `.env` file
- Restart server: `npm run dev`

### "Rate limit exceeded"
- Wait a few seconds and try again
- Reduce generation frequency if using auto-generation
- Anthropic limits: ~50 requests/minute

### "Job queue not started"
- Redis is not running or not accessible
- Check `REDIS_HOST` and `REDIS_PORT` in `.env`
- Manual generation still works without Redis

### Generation takes too long (>60s)
- Claude API can be slow during peak times
- Typical: 10-30 seconds
- If consistently slow, check internet connection

### Duplicate ideas
- System checks domain + problem + solution
- If you want to force generation, use `skipDuplicateCheck: true`
- Consider varying templates or domains

---

## Cost Estimates

**Claude API Pricing** (as of Jan 2025):
- Input: $3 / million tokens
- Output: $15 / million tokens

**Per Idea**:
- Input: ~2,000 tokens = $0.006
- Output: ~1,500 tokens = $0.0225
- **Total: ~$0.03 per idea**

**Monthly (10-minute intervals)**:
- 144 ideas/day × 30 days = 4,320 ideas/month
- Cost: 4,320 × $0.03 = **~$130/month**

**Recommendations**:
- Start with 30-60 minute intervals for testing
- Switch to 10 minutes once you're confident
- Can pause auto-generation and use manual trigger only
