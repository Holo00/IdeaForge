# API Documentation

## Base URL

```
http://localhost:3000/api
```

## Response Format

All API responses follow this standard format:

**Success**:
```json
{
  "success": true,
  "data": { ... }
}
```

**Error**:
```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "details": { ... }
  }
}
```

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed (invalid parameters) |
| `NOT_FOUND` | 404 | Requested resource not found |
| `CONFLICT` | 409 | Resource already exists or conflicts with existing data |
| `EXTERNAL_SERVICE_ERROR` | 502 | External API (Claude, etc.) failed |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Endpoints

### Health Check

**GET /health**

Check if server is running.

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-01-20T10:00:00.000Z"
}
```

---

## Ideas

### Get All Ideas

**GET /api/ideas**

Retrieve a paginated list of ideas with optional filtering and sorting.

**Query Parameters**:

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `status` | string | Filter by status: `draft`, `validation`, `research`, `build`, `archived` | - |
| `domain` | string | Filter by domain (exact match) | - |
| `minScore` | number | Minimum score (0-80) | - |
| `maxScore` | number | Maximum score (0-80) | - |
| `tags` | string | Comma-separated tags (e.g., `ai,saas`) | - |
| `sortBy` | string | Sort by: `score`, `created`, `updated` | `created` |
| `sortOrder` | string | Sort order: `asc`, `desc` | `desc` |
| `limit` | number | Number of results (1-100) | 50 |
| `offset` | number | Pagination offset | 0 |

**Example Request**:
```
GET /api/ideas?status=draft&minScore=60&sortBy=score&sortOrder=desc&limit=10
```

**Response**:
```json
{
  "success": true,
  "data": {
    "ideas": [
      {
        "id": "uuid",
        "name": "AI-Powered Therapy Session Notes",
        "folderName": "ai-therapy-notes-2025-01",
        "status": "draft",
        "score": 61,
        "domain": "Healthcare & Medical",
        "subdomain": "Mental Health Services",
        "problem": "Time Consuming",
        "solution": "AI/ML + Voice Recognition",
        "scores": {
          "problemSeverity": 9,
          "marketSize": 8,
          "competition": 6,
          "monetization": 9,
          "technicalFeasibility": 7,
          "personalInterest": 8,
          "unfairAdvantage": 6,
          "timeToMarket": 8
        },
        "quickSummary": "AI-powered clinical documentation for therapists...",
        "concreteExample": {
          "currentState": "Today, therapists spend 15-30 minutes...",
          "yourSolution": "Therapist wears a small device...",
          "keyImprovement": "Time saved: 5-10 hours/week..."
        },
        "evaluationDetails": {
          "problemSeverity": {
            "score": 9,
            "reasoning": "Therapists spend 20-40% of their time..."
          }
          // ... all 8 criteria
        },
        "tags": ["ai", "healthcare", "mental-health", "saas"],
        "generationFramework": null,
        "createdAt": "2025-01-20T10:00:00.000Z",
        "updatedAt": "2025-01-20T10:00:00.000Z",
        "parentIdeaId": null
      }
    ],
    "total": 5
  }
}
```

---

### Get Single Idea

**GET /api/ideas/:id**

Retrieve detailed information for a single idea.

**Path Parameters**:
- `id` (UUID) - Idea ID

**Example Request**:
```
GET /api/ideas/550e8400-e29b-41d4-a716-446655440000
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "AI-Powered Therapy Session Notes",
    // ... full idea object (same structure as above)
  }
}
```

**Error Response** (404):
```json
{
  "success": false,
  "error": {
    "message": "Idea with id 550e8400-e29b-41d4-a716-446655440000 not found",
    "code": "NOT_FOUND"
  }
}
```

---

### Update Idea

**PUT /api/ideas/:id**

Update an existing idea. Only provided fields will be updated.

**Path Parameters**:
- `id` (UUID) - Idea ID

**Request Body**:
```json
{
  "name": "Updated Idea Name",
  "status": "validation",
  "scores": {
    "problemSeverity": 10,
    "marketSize": 8
  },
  "concreteExample": {
    "currentState": "Updated current state description..."
  },
  "tags": ["ai", "healthcare", "updated"]
}
```

**Fields** (all optional):

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Idea name (1-500 chars) |
| `status` | string | Status: `draft`, `validation`, `research`, `build`, `archived` |
| `scores` | object | Partial or full scores object (1-10 for each criterion) |
| `evaluationDetails` | object | Updated evaluation reasoning |
| `concreteExample` | object | Partial or full concrete example |
| `tags` | array | Replace existing tags |

**Response**:
```json
{
  "success": true,
  "data": {
    // ... updated idea object
  }
}
```

**Notes**:
- Status changes are tracked in `idea_history`
- Score changes automatically recalculate `totalScore` using weighted formula
- Partial updates merge with existing data

---

### Delete Idea

**DELETE /api/ideas/:id**

Permanently delete an idea and its history.

**Path Parameters**:
- `id` (UUID) - Idea ID

**Example Request**:
```
DELETE /api/ideas/550e8400-e29b-41d4-a716-446655440000
```

**Response**:
```json
{
  "success": true,
  "data": {
    "deleted": true
  }
}
```

**Notes**:
- This action is **irreversible**
- All related `idea_history` entries are cascade deleted
- Consider archiving (`status: "archived"`) instead of deleting

---

### Get Idea History

**GET /api/ideas/:id/history**

Retrieve the full evolution history of an idea.

**Path Parameters**:
- `id` (UUID) - Idea ID

**Example Request**:
```
GET /api/ideas/550e8400-e29b-41d4-a716-446655440000/history
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "history-uuid-1",
      "ideaId": "550e8400-e29b-41d4-a716-446655440000",
      "changeType": "status_changed",
      "description": "Status changed from draft to validation",
      "beforeData": {"status": "draft"},
      "afterData": {"status": "validation"},
      "createdAt": "2025-01-21T10:00:00.000Z"
    },
    {
      "id": "history-uuid-2",
      "ideaId": "550e8400-e29b-41d4-a716-446655440000",
      "changeType": "created",
      "description": "Idea created",
      "beforeData": null,
      "afterData": null,
      "createdAt": "2025-01-20T10:00:00.000Z"
    }
  ]
}
```

**Change Types**:
- `created` - Idea first created
- `updated` - General update
- `status_changed` - Status transition
- `refined` - AI refinement applied
- `merged` - Merged with another idea
- `archived` - Moved to archived status

---

## Score Calculation

The total score (0-80) is calculated using a **weighted formula** based on importance:

| Criterion | Weight | Max Points | Rationale |
|-----------|--------|------------|-----------|
| Problem Severity | 2x | 20 | Most important - if problem isn't painful, nothing else matters |
| Market Size | 1.5x | 15 | Bigger market = more room for error |
| Competition Level | 1x | 10 | Can compete with execution |
| Monetization Clarity | 2x | 20 | Need clear path to revenue |
| Technical Feasibility | 1x | 10 | Can build most things with modern tools |
| Personal Interest | 1x | 10 | Affects long-term motivation |
| Unfair Advantage | 2x | 20 | Defensibility determines long-term success |
| Time to Market | 1x | 10 | Speed matters but not everything |
| **Total** | | **115** → normalized to **80** | |

**Formula**:
```
Total = (
  problemSeverity * 2 +
  marketSize * 1.5 +
  competition * 1 +
  monetization * 2 +
  technicalFeasibility * 1 +
  personalInterest * 1 +
  unfairAdvantage * 2 +
  timeToMarket * 1
) / 11.5 * 10

Result is scaled to 0-80 range
```

**Interpretation**:
- **70-80** (88-100%): Excellent - high priority
- **60-69** (75-86%): Good - worth pursuing
- **50-59** (63-74%): Decent - consider validation
- **40-49** (50-62%): Weak - needs major improvements
- **0-39** (0-49%): Poor - likely not viable

---

## Rate Limiting

*(Not yet implemented - planned for Phase 2)*

Future rate limits:
- 100 requests/minute per IP
- 1000 requests/hour per IP

---

## Authentication

The API uses JWT Bearer token authentication.

### Login

**POST /api/auth/login**

Authenticate and receive a JWT token.

**Request Body**:
```json
{
  "username": "admin",
  "password": "your-password"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "admin",
      "username": "admin",
      "role": "admin"
    }
  }
}
```

### Validate Token

**GET /api/auth/validate**

Check if current token is valid. Requires `Authorization` header.

**Response**:
```json
{
  "success": true,
  "data": {
    "valid": true,
    "user": {
      "id": "admin",
      "username": "admin",
      "role": "admin"
    }
  }
}
```

### Protected Routes

Include the token in the `Authorization` header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Route Protection Summary**:
| Route | Auth Required |
|-------|---------------|
| `GET /api/ideas` | No (public) |
| `GET /api/ideas/:id` | No (public) |
| `GET /api/ideas/:id/history` | No (public) |
| `PUT /api/ideas/:id` | Yes |
| `DELETE /api/ideas/:id` | Yes |
| `POST /api/generate` | Yes |
| `/api/config/*` | Yes |
| `/api/logs/*` | Yes |

---

## Examples

### Get all high-scoring draft ideas in Healthcare

```bash
curl "http://localhost:3000/api/ideas?status=draft&domain=Healthcare%20%26%20Medical&minScore=60&sortBy=score&sortOrder=desc"
```

### Update idea status to validation

```bash
curl -X PUT http://localhost:3000/api/ideas/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "validation"
  }'
```

### Get ideas with specific tags

```bash
curl "http://localhost:3000/api/ideas?tags=ai,saas&sortBy=score&sortOrder=desc"
```

### Delete an idea

```bash
curl -X DELETE http://localhost:3000/api/ideas/550e8400-e29b-41d4-a716-446655440000
```

---

## Configuration Profiles

### Get All Profiles

**GET /api/config/profiles** (Protected)

Returns all configuration profiles.

### Get Active Profile

**GET /api/config/profiles/active** (Protected)

Returns the currently active configuration profile.

### Create Profile

**POST /api/config/profiles** (Protected)

Create a new configuration profile with empty YAML files.

**Request Body**:
```json
{
  "name": "Production",
  "folder_name": "config-prod",
  "description": "Production configuration"
}
```

### Clone Profile

**POST /api/config/profiles/:id/clone** (Protected)

Clone an existing configuration profile with all its YAML config files.

**Path Parameters**:
- `id` (UUID) - Source profile ID to clone

**Request Body**:
```json
{
  "name": "Production Copy",
  "folder_name": "config-prod-copy"
}
```

**Response**:
```json
{
  "id": "uuid",
  "name": "Production Copy",
  "folder_name": "config-prod-copy",
  "description": "Cloned from config-prod",
  "is_active": false,
  "created_at": "2025-01-26T10:00:00.000Z",
  "updated_at": "2025-01-26T10:00:00.000Z"
}
```

**Notes**:
- Cloned profiles are inactive by default
- All YAML files from source are copied to new folder
- `folder_name` must be unique and contain only letters, numbers, dashes, underscores

### Activate Profile

**POST /api/config/profiles/:id/activate** (Protected)

Set a profile as the active configuration.

### Delete Profile

**DELETE /api/config/profiles/:id** (Protected)

Delete a configuration profile. Cannot delete the active profile.

### Get Master Filter Options

**GET /api/config/filters** (Protected)

Returns ALL filter options from the master config directory (`/backend/config/`). Use this endpoint for populating filter dropdowns in the UI, as it provides consistent values across all profiles.

**Response**:
```json
{
  "domains": [
    { "name": "Healthcare & Medical", "subdomains": [...] },
    { "name": "Finance & Banking", "subdomains": [...] }
  ],
  "monetizationModels": [
    { "name": "SaaS Subscription", "description": "..." },
    { "name": "Usage-Based", "description": "..." }
  ],
  "targetAudiences": [
    { "name": "Small Business Owners", "description": "..." },
    { "name": "Enterprise", "description": "..." }
  ],
  "problemTypes": [
    { "name": "Time Consuming", "description": "..." },
    { "name": "Expensive", "description": "..." }
  ],
  "solutionTypes": [
    { "name": "Automation", "description": "..." },
    { "name": "AI/ML", "description": "..." }
  ]
}
```

**Notes**:
- Master config is the single source of truth for all possible filter values
- Profile configs can contain a subset of these values (validated on save)
- Use this endpoint for filtering UI to ensure all options are available

---

## Configuration Architecture

### Master vs Profile Configs

The config system uses two directories:

| Directory | Purpose | Example |
|-----------|---------|---------|
| `/backend/config/` | **Master** - All possible values (source of truth) | All 20+ domains |
| `/backend/configs/{profile}/` | **Profile** - Subset for generation | Just 5 enabled domains |

**How it works**:
1. When generating ideas, the active profile's config is used
2. When filtering in UI, master config provides ALL possible values
3. When saving a profile config, values are validated against master
4. Invalid values (not in master) cause a validation error

**Validated Files**:
- `business-domains.yaml`
- `monetization-models.yaml`
- `target-audiences.yaml`
- `problem-types.yaml`
- `solution-types.yaml`

---

## Future Endpoints (Planned)

### Idea Generation
- `POST /api/ideas/generate` - Manually trigger idea generation (implemented)
- `POST /api/ideas/:id/refine` - Apply AI refinement prompts

### Analytics
- `GET /api/stats/overview` - Dashboard statistics
- `GET /api/stats/generation` - Generation job analytics
- `GET /api/learnings` - Get all learnings
- `POST /api/learnings` - Add new learning

---

## Changelog

### 2025-01-21 - Initial MVP
- Basic CRUD endpoints for ideas
- Filtering, sorting, pagination
- Idea history tracking
- Weighted score calculation
