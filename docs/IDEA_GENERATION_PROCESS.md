# Idea Generation Process - Complete Flow

**Last Updated**: January 2025
**Version**: 2.0 (with configurations, embeddings, and frameworks)

---

## Overview

This document describes the complete automated idea generation process, showing how each component interacts with the others from user click to database storage.

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│ USER INTERACTION LAYER                                           │
│  - Frontend UI (Next.js/React)                                   │
│  - User clicks "Generate Idea"                                   │
└───────────────────────────┬──────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ API LAYER                                                         │
│  - POST /api/generation/generate                                 │
│  - IdeaGenerationService.generateIdea()                          │
└───────────────────────────┬──────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ CONFIGURATION LAYER (Hybrid: DB + Files)                         │
│  - Database: configuration_profiles table                        │
│  - Filesystem: backend/configs/{folder_name}/*.yaml              │
│  - ConfigService: Loads active profile's YAML files             │
└───────────────────────────┬──────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ PROMPT CONSTRUCTION LAYER                                        │
│  - PromptBuilder.buildGenerationPrompt()                        │
│  - Random selection + template substitution                      │
└───────────────────────────┬──────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ AI EXECUTION LAYER                                               │
│  - callClaude() via active API key                              │
│  - Single prompt → Single JSON response                          │
└───────────────────────────┬──────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ SEMANTIC DUPLICATE DETECTION LAYER                               │
│  - Generate embedding of idea                                    │
│  - Vector similarity search (pgvector)                           │
│  - User confirmation if duplicate found                          │
└───────────────────────────┬──────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ PERSISTENCE LAYER                                                │
│  - Calculate weighted score from criteria                        │
│  - Insert into ideas table (with embedding)                      │
│  - Insert history record                                         │
└──────────────────────────────────────────────────────────────────┘
```

---

## Phase-by-Phase Breakdown

### **PHASE 1: Initialization** ⚙️

**Entry Point**: User clicks "Generate Idea" button in frontend

**Backend**: `POST /api/generation/generate`

**Steps**:

1.1. Create unique session ID for logging
```typescript
const sessionId = randomUUID();
const logger = new GenerationLogger(sessionId);
```

1.2. Validate active API key exists
```typescript
if (!(await isClaudeConfigured())) {
  throw Error('No active API key in database');
}
```
- Query: `SELECT api_key FROM api_keys WHERE provider='claude' AND is_active=true`
- STOP if no key found

1.3. Accept optional parameters:
```typescript
interface GenerationOptions {
  template?: string;        // Specific framework name (or random)
  domain?: string;         // Specific domain (or random)
  skipDuplicateCheck?: boolean;
}
```

---

### **PHASE 2: Configuration Loading** 📁

**Service**: `ConfigService`

**Hybrid Data Source**:
- **Database**: `configuration_profiles` table → Get active profile
- **Filesystem**: `backend/configs/{folder_name}/*.yaml` → Load YAML files

**Steps**:

2.1. Get active configuration profile
```sql
SELECT folder_name
FROM configuration_profiles
WHERE is_active = true
LIMIT 1;
```
Result: `folder_name = "default"`

2.2. Load YAML files from active configuration
```
backend/configs/default/
  ├── business-domains.yaml
  ├── problem-types.yaml
  ├── solution-types.yaml
  ├── evaluation-criteria.yaml
  ├── idea-prompts.yaml (now "generation-frameworks.yaml")
  └── generation-settings.yaml
```

2.3. Parse each YAML file into memory
```typescript
const domains = await configService.getDomains();
const problemTypes = await configService.getProblemTypes();
const solutionTypes = await configService.getSolutionTypes();
const criteria = await configService.getEvaluationCriteria();
const frameworks = await configService.getIdeaPrompts();
const settings = await configService.getGenerationSettings();
```

---

### **PHASE 3: Random Component Selection** 🎲

**Service**: `ConfigService` + `PromptBuilder`

**Randomization Logic**:

3.1. **Select Generation Framework** (formerly "template")
```yaml
# From: idea-prompts.yaml → generation_templates
frameworks = [
  { name: "Pain Point Formula", enabled: true, ... },
  { name: "Domain + Technology", enabled: true, ... },
  { name: "Geographic Arbitrage", enabled: false, ... }  # Skipped
]
```
- Filter: Only `enabled: true` frameworks
- Random selection: `frameworks[Math.floor(Math.random() * enabledFrameworks.length)]`
- Result: `selected_framework = "Pain Point Formula"`

3.2. **Select Domain + Subdomain**
```yaml
# From: business-domains.yaml
domains = [
  { name: "Healthcare", subdomains: ["Patient Management", "Telemedicine"] },
  { name: "Education", subdomains: ["Online Learning", "Tutoring"] }
]
```
- Random domain: `domains[random]` → "Healthcare"
- Random subdomain (if available): `subdomains[random]` → "Patient Management"
- Result: `domain = "Healthcare → Patient Management"`

3.3. **Select Problem Type**
```yaml
# From: problem-types.yaml
problem_types = [
  { name: "Time Consuming" },
  { name: "Error Prone" },
  { name: "Expensive" }
]
```
- Random selection → `problem = "Time Consuming"`

3.4. **Select Solution Type**
```yaml
# From: solution-types.yaml
solution_types = [
  { name: "Automation" },
  { name: "Marketplace" },
  { name: "Analytics Dashboard" }
]
```
- Random selection → `solution = "Automation"`

3.5. **Load Evaluation Criteria with Weights**
```yaml
# From: evaluation-criteria.yaml
draft_phase_criteria = [
  { name: "Problem Severity", weight: 2.0, ... },
  { name: "Market Size", weight: 1.5, ... },
  { name: "Competition Level", weight: 1.0, ... },
  { name: "Monetization Clarity", weight: 2.0, ... },
  { name: "Technical Feasibility", weight: 1.0, ... },
  { name: "Personal Interest", weight: 1.0, ... },
  { name: "Unfair Advantage", weight: 2.0, ... },
  { name: "Time to Market", weight: 1.0, ... }
]
```
- Total weight: 2.0 + 1.5 + 1.0 + 2.0 + 1.0 + 1.0 + 2.0 + 1.0 = **11.5**

---

### **PHASE 4: Prompt Construction** 📝

**Service**: `PromptBuilder.buildGenerationPrompt()`

**Steps**:

4.1. Load main prompt template
```yaml
# From: generation-settings.yaml
idea_generation_prompt: |
  You are an expert at generating software business ideas...

  **Generation Framework**: {template_name}
  {template_description}
  {template_template}
  {template_example}

  **Constraints**:
  - Domain: {domain}
  - Problem Type: {problem}
  - Solution Type: {solution}

  **Evaluation Criteria** (score 1-10 for each):
  {criteria}

  Generate a unique, viable idea. Return ONLY valid JSON with this structure:
  {
    "name": "Idea Name",
    "domain": "{domain}",
    "problem": "Specific problem description",
    "solution": "Specific solution description",
    "quickSummary": "1-2 sentence summary",
    "concreteExample": {
      "currentState": "How it works today",
      "yourSolution": "How your product works",
      "keyImprovement": "Measurable improvement"
    },
    "evaluation": {
      "problemSeverity": { "score": 8, "reasoning": "..." },
      ... (all 8 criteria)
    },
    "tags": ["tag1", "tag2"]
  }
```

4.2. Replace placeholders with selected components
```typescript
const finalPrompt = promptTemplate
  .replace(/{template_name}/g, "Pain Point Formula")
  .replace(/{template_description}/g, "Focus on customer jobs...")
  .replace(/{template_template}/g, "What if [audience] could...")
  .replace(/{template_example}/g, "What if small businesses...")
  .replace(/{domain}/g, "Healthcare → Patient Management")
  .replace(/{problem}/g, "Time Consuming")
  .replace(/{solution}/g, "Automation")
  .replace(/{criteria}/g, formatCriteria(criteria));
```

4.3. Format criteria list for prompt
```typescript
function formatCriteria(criteria) {
  return criteria.draft_phase_criteria.map(c =>
    `- ${c.name} (weight: ${c.weight}): ${c.description}`
  ).join('\n');
}
```

**Final Prompt Length**: ~2000-3000 characters

---

### **PHASE 5: AI Execution** 🤖

**Service**: `callClaude(prompt, options)`

**Steps**:

5.1. Get active API key from database
```typescript
const apiKey = await pool.query(
  "SELECT api_key FROM api_keys WHERE provider='claude' AND is_active=true"
);
```

5.2. Initialize Anthropic client
```typescript
const anthropic = new Anthropic({ apiKey: apiKey.rows[0].api_key });
```

5.3. Call Claude API with parameters
```typescript
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 4096,
  temperature: 1.0,  // High creativity
  messages: [{
    role: 'user',
    content: finalPrompt
  }]
});
```

5.4. Extract text response
```typescript
const textContent = response.content
  .filter(block => block.type === 'text')
  .map(block => block.text)
  .join('\n');
```

**Expected Response Format** (JSON):
```json
{
  "name": "AI-Powered Patient Scheduling Assistant",
  "domain": "Healthcare → Patient Management",
  "problem": "Medical practices waste 15-20 hours/week on manual appointment scheduling",
  "solution": "Automated scheduling system using AI to handle appointment requests via SMS/email",
  "quickSummary": "An AI assistant that automatically schedules patient appointments...",
  "concreteExample": {
    "currentState": "Receptionist manually calls/emails 20-30 patients per day...",
    "yourSolution": "AI assistant responds to appointment requests in <1 minute...",
    "keyImprovement": "Reduces scheduling time by 90%, saves 18 hours/week"
  },
  "evaluation": {
    "problemSeverity": {
      "score": 8,
      "reasoning": "Medical practices lose $50k+ annually on scheduling overhead"
    },
    "marketSize": {
      "score": 7,
      "reasoning": "400k+ medical practices in US alone"
    },
    ... (all 8 criteria with scores and reasoning)
  },
  "tags": ["healthcare", "automation", "B2B", "SaaS"]
}
```

---

### **PHASE 6: Response Parsing & Validation** ✅

**Service**: `IdeaGenerationService.parseClaudeResponse()`

**Steps**:

6.1. Extract JSON from response (handle markdown code blocks)
```typescript
let jsonStr = response.trim();
if (jsonStr.startsWith('```json')) {
  jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
}
const parsed = JSON.parse(jsonStr);
```

6.2. Validate required fields
```typescript
if (!parsed.name || !parsed.quickSummary || !parsed.concreteExample || !parsed.evaluation) {
  throw new ValidationError('Missing required fields');
}
```

6.3. Validate concrete example structure
```typescript
if (!parsed.concreteExample.currentState ||
    !parsed.concreteExample.yourSolution ||
    !parsed.concreteExample.keyImprovement) {
  throw new ValidationError('Concrete example missing required fields');
}
```

6.4. Extract and structure data
```typescript
return {
  name: parsed.name,
  domain: parsed.domain,
  problem: parsed.problem || 'Unknown',
  solution: parsed.solution || 'Unknown',
  quickSummary: parsed.quickSummary,
  concreteExample: parsed.concreteExample,
  evaluation: parsed.evaluation,
  tags: parsed.tags || []
};
```

---

### **PHASE 7: Semantic Duplicate Detection** 🔍

**Service**: New `EmbeddingService` + `DuplicateDetectionService`

**Steps**:

7.1. Create text representation of idea
```typescript
const ideaText = `
  Domain: ${ideaData.domain}
  Problem: ${ideaData.problem}
  Solution: ${ideaData.solution}
  Summary: ${ideaData.quickSummary}
`.trim();
```

7.2. Generate embedding using OpenAI
```typescript
const openai = new OpenAI({ apiKey: await getActiveOpenAIKey() });
const embeddingResponse = await openai.embeddings.create({
  model: "text-embedding-3-small",  // 1536 dimensions
  input: ideaText
});
const embedding = embeddingResponse.data[0].embedding;  // Array of 1536 floats
```

7.3. Search for similar ideas in database
```sql
SELECT
  id,
  name,
  domain,
  problem,
  solution,
  1 - (embedding <=> $1) as similarity_score
FROM ideas
WHERE 1 - (embedding <=> $1) > 0.85  -- 85% similarity threshold
ORDER BY similarity_score DESC
LIMIT 5;
```
- `<=>`: Cosine distance operator (pgvector)
- `1 - distance` = similarity score (0-1 range)

7.4. Handle duplicate detection result

**If NO duplicates found** (similarity < 0.85):
- Continue to Phase 8

**If duplicates found** (similarity ≥ 0.85):
```typescript
if (duplicates.length > 0 && !options.skipDuplicateCheck) {
  return {
    status: 'duplicate_detected',
    similarIdeas: duplicates.map(d => ({
      id: d.id,
      name: d.name,
      similarity: d.similarity_score,
      domain: d.domain,
      problem: d.problem
    })),
    generatedIdea: ideaData,  // Include so user can compare
    embedding: embedding      // Save for later if user proceeds
  };
}
```

**Frontend UI shows**:
```
⚠️ Similar Idea Found

"AI-Powered Patient Scheduling" (87% similar)
Domain: Healthcare → Patient Management
Problem: Medical scheduling overhead

Your new idea:
"Automated Medical Appointment System"
Domain: Healthcare → Patient Management
Problem: Medical practices waste time on scheduling

[View Existing Idea]  [Continue Anyway]  [Cancel]
```

---

### **PHASE 8: Score Calculation** 🧮

**Service**: `IdeaGenerationService.calculateWeightedScore()`

**Steps**:

8.1. Extract individual scores from evaluation
```typescript
const scores = {
  problemSeverity: evaluation.problemSeverity.score,      // 8
  marketSize: evaluation.marketSize.score,                // 7
  competition: evaluation.competition.score,              // 6
  monetization: evaluation.monetization.score,            // 7
  technicalFeasibility: evaluation.technicalFeasibility.score,  // 8
  personalInterest: evaluation.personalInterest.score,    // 6
  unfairAdvantage: evaluation.unfairAdvantage.score,      // 5
  timeToMarket: evaluation.timeToMarket.score            // 7
};
```

8.2. Get weights from configuration (evaluation-criteria.yaml)
```typescript
const weights = {
  problemSeverity: 2.0,
  marketSize: 1.5,
  competition: 1.0,
  monetization: 2.0,
  technicalFeasibility: 1.0,
  personalInterest: 1.0,
  unfairAdvantage: 2.0,
  timeToMarket: 1.0
};
```

8.3. Calculate weighted total
```typescript
let weightedSum = 0;
let maxPossible = 0;

for (const [criterion, weight] of Object.entries(weights)) {
  const score = scores[criterion];
  weightedSum += score * weight;
  maxPossible += 10 * weight;  // Max score per criterion is 10
}

// weightedSum = (8×2.0) + (7×1.5) + (6×1.0) + (7×2.0) + (8×1.0) + (6×1.0) + (5×2.0) + (7×1.0)
// weightedSum = 16 + 10.5 + 6 + 14 + 8 + 6 + 10 + 7 = 77.5

// maxPossible = (10×2.0) + (10×1.5) + (10×1.0) + (10×2.0) + (10×1.0) + (10×1.0) + (10×2.0) + (10×1.0)
// maxPossible = 20 + 15 + 10 + 20 + 10 + 10 + 20 + 10 = 115
```

8.4. Normalize to 0-80 scale
```typescript
const finalScore = Math.round((weightedSum / maxPossible) * 80);
// finalScore = (77.5 / 115) * 80 = 53.9 ≈ 54
```

**Why 0-80 scale?**
- Matches research-system convention
- Passing threshold: 42/80 (52.5%)
- Leaves room for improvement (not artificially inflated to 100)

---

### **PHASE 9: Database Persistence** 💾

**Service**: `IdeaRepository.create()`

**Steps**:

9.1. Generate metadata
```typescript
const folderName = generateFolderName("AI-Powered Patient Scheduling");
// folderName = "ai-powered-patient-scheduling-2025-01"

const generationFramework = "Pain Point Formula";  // Track which framework was used
```

9.2. Insert into ideas table
```sql
INSERT INTO ideas (
  id,
  name,
  folder_name,
  status,
  score,
  domain,
  subdomain,
  problem,
  solution,
  scores,
  quick_summary,
  concrete_example,
  evaluation_details,
  tags,
  generation_framework,
  embedding,  -- NEW: Vector embedding
  created_at,
  updated_at
) VALUES (
  uuid_generate_v4(),
  'AI-Powered Patient Scheduling Assistant',
  'ai-powered-patient-scheduling-2025-01',
  'draft',
  54,
  'Healthcare',
  'Patient Management',
  'Medical practices waste 15-20 hours/week on manual appointment scheduling',
  'Automated scheduling system using AI to handle appointment requests via SMS/email',
  '{"problemSeverity": 8, "marketSize": 7, ...}'::jsonb,
  'An AI assistant that automatically schedules patient appointments...',
  '{"currentState": "...", "yourSolution": "...", "keyImprovement": "..."}'::jsonb,
  '{"problemSeverity": {"score": 8, "reasoning": "..."}, ...}'::jsonb,
  ARRAY['healthcare', 'automation', 'B2B', 'SaaS'],
  'Pain Point Formula',
  '[0.123, -0.456, 0.789, ...]'::vector(1536),  -- Embedding array
  NOW(),
  NOW()
) RETURNING *;
```

9.3. Insert history record
```sql
INSERT INTO idea_history (
  id,
  idea_id,
  change_type,
  description,
  created_at
) VALUES (
  uuid_generate_v4(),
  '...',  -- idea.id from above
  'created',
  'Idea generated by Claude API using Pain Point Formula framework',
  NOW()
);
```

---

### **PHASE 10: Response Assembly & Return** 📦

**Service**: `IdeaGenerationService.generateIdea()` (final return)

**Steps**:

10.1. Gather all data
```typescript
return {
  idea: {
    id: '...',
    name: 'AI-Powered Patient Scheduling Assistant',
    folderName: 'ai-powered-patient-scheduling-2025-01',
    status: 'draft',
    score: 54,
    domain: 'Healthcare',
    subdomain: 'Patient Management',
    problem: '...',
    solution: '...',
    scores: { ... },
    quickSummary: '...',
    concreteExample: { ... },
    evaluationDetails: { ... },
    tags: [...],
    generationFramework: 'Pain Point Formula',
    createdAt: '2025-01-22T10:30:00Z',
    updatedAt: '2025-01-22T10:30:00Z'
  },
  logs: [
    { stage: 'INIT', message: 'Starting idea generation', ... },
    { stage: 'CONFIG_LOAD', message: 'Loading configuration', ... },
    { stage: 'PROMPT_BUILD', message: 'Building generation prompt', ... },
    { stage: 'API_CALL', message: 'Calling Claude API', duration: 3542 },
    { stage: 'RESPONSE_PARSE', message: 'Parsing Claude response', ... },
    { stage: 'DUPLICATE_CHECK', message: 'No duplicates found', ... },
    { stage: 'DB_SAVE', message: 'Idea saved to database', ... },
    { stage: 'COMPLETE', message: 'Idea generation complete', totalDuration: 5234 }
  ],
  summary: {
    totalDuration: 5234,  // milliseconds
    success: true,
    ideaId: '...',
    score: 54
  }
};
```

10.2. Frontend receives response and displays:
```
✅ Idea Generated Successfully!

AI-Powered Patient Scheduling Assistant
Score: 54/80 | Status: Draft

Domain: Healthcare → Patient Management
Tags: healthcare, automation, B2B, SaaS

[View Details]  [Generate Another]
```

---

## Component Interaction Map

```
USER ACTION
    │
    ▼
┌─────────────────────────────────────┐
│ Frontend: "Generate Idea" button    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ API: POST /api/generation/generate  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ IdeaGenerationService.generateIdea()│
│  ├── Logger.init()                  │
│  ├── isClaudeConfigured()  ───────┐ │
│  └── PromptBuilder.build()         │ │
└──────────────┬─────────────────────┘ │
               │                       │
               ▼                       │
┌─────────────────────────────────────┴──┐
│ ConfigService                          │
│  ├── getActiveProfile() [DB]           │
│  ├── getDomains()       [YAML]         │
│  ├── getProblemTypes()  [YAML]         │
│  ├── getSolutionTypes() [YAML]         │
│  ├── getCriteria()      [YAML + weights]│
│  ├── getFrameworks()    [YAML]         │
│  └── getSettings()      [YAML]         │
└──────────────┬─────────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ PromptBuilder                       │
│  ├── Select random framework        │
│  ├── Select random domain/subdomain │
│  ├── Select random problem          │
│  ├── Select random solution         │
│  ├── Format criteria list           │
│  └── Replace {placeholders}         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ callClaude()                        │
│  ├── getActiveApiKey() [DB]         │
│  ├── new Anthropic({apiKey})        │
│  └── anthropic.messages.create()    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Claude API (External)               │
│  Returns JSON response               │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ parseClaudeResponse()               │
│  ├── Extract JSON                   │
│  ├── Validate structure             │
│  └── Return parsed data             │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ EmbeddingService                    │
│  ├── Create idea text               │
│  ├── Get OpenAI API key [DB]        │
│  └── openai.embeddings.create()     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ DuplicateDetectionService           │
│  ├── Vector similarity search [DB]  │
│  ├── If found: return to user       │
│  └── If not: continue               │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ calculateWeightedScore()            │
│  ├── Get weights from criteria      │
│  ├── Calculate weighted sum         │
│  └── Normalize to 0-80 scale        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ IdeaRepository.create()             │
│  ├── Generate folder name           │
│  ├── INSERT INTO ideas [DB]         │
│  ├── Store embedding                │
│  └── INSERT INTO idea_history [DB]  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Return to Frontend                  │
│  ├── Idea object                    │
│  ├── Generation logs                │
│  └── Summary stats                  │
└─────────────────────────────────────┘
```

---

## Data Flow Example

**Input**: User clicks "Generate Idea"

**Phase 1-2**: Load Configuration
- DB Query: Get active profile → `default`
- File Read: Load `backend/configs/default/*.yaml` files

**Phase 3**: Random Selection
- Framework: "Pain Point Formula"
- Domain: "Healthcare → Patient Management"
- Problem: "Time Consuming"
- Solution: "Automation"

**Phase 4**: Prompt Construction
- Template loaded from `generation-settings.yaml`
- Placeholders replaced with selected values
- Final prompt: ~2500 characters

**Phase 5**: AI Execution
- API Key from DB: `sk-ant-...`
- Call Claude Sonnet 4.5
- Duration: ~3.5 seconds
- Response: JSON with idea data

**Phase 6**: Parse & Validate
- Extract JSON from markdown
- Validate all required fields
- Parse scores and reasoning

**Phase 7**: Duplicate Detection
- Generate embedding: 1536-dimensional vector
- Search DB: Find ideas with >85% similarity
- Result: No duplicates found

**Phase 8**: Calculate Score
- Individual scores: [8, 7, 6, 7, 8, 6, 5, 7]
- Weights: [2.0, 1.5, 1.0, 2.0, 1.0, 1.0, 2.0, 1.0]
- Weighted sum: 77.5 / 115 possible
- Final score: 54/80

**Phase 9**: Save to Database
- INSERT idea with all fields + embedding
- INSERT history record
- Duration: ~50ms

**Phase 10**: Return to Frontend
- Complete idea object
- 8 log entries
- Summary: success, 5.2s total

**Output**: Idea displayed in UI, ready for review

---

## Configuration Profile Structure

```yaml
# backend/configs/default/config.yaml
name: Default Configuration
description: Standard configuration from research-system
version: 1.0.0
```

**Related Database Record**:
```sql
SELECT * FROM configuration_profiles WHERE is_active = true;
-- Returns: { id: ..., name: "Default Configuration", folder_name: "default", is_active: true }
```

**File Structure**:
```
backend/configs/
└── default/
    ├── config.yaml               # Metadata
    ├── business-domains.yaml     # Industry domains
    ├── problem-types.yaml        # Problem categories
    ├── solution-types.yaml       # Solution approaches
    ├── evaluation-criteria.yaml  # Scoring criteria WITH WEIGHTS
    ├── idea-prompts.yaml         # Generation frameworks
    └── generation-settings.yaml  # AI prompt template + settings
```

---

## Weight Configuration

**evaluation-criteria.yaml** (excerpt):
```yaml
draft_phase_criteria:
  - name: Problem Severity
    weight: 2.0  # Higher weight = more important
    scale: 1-10
    ...

  - name: Market Size
    weight: 1.5
    ...
```

**Usage in Score Calculation**:
```typescript
// Load weights from configuration
const criteria = await configService.getEvaluationCriteria();
const weights = {};
for (const criterion of criteria.draft_phase_criteria) {
  weights[criterion.name] = criterion.weight;
}

// Calculate weighted score
const finalScore = calculateWeightedScore(scores, weights);
```

---

## Semantic Duplicate Detection Details

**Embedding Generation**:
```typescript
// Combine key fields into searchable text
const ideaText = `
  Domain: Healthcare → Patient Management
  Problem: Medical practices waste 15-20 hours/week on scheduling
  Solution: Automated AI scheduling system
  Summary: AI assistant that automatically schedules appointments...
`;

// Generate embedding
const embedding = await openai.embeddings.create({
  model: "text-embedding-3-small",
  input: ideaText
});
// Result: [0.123, -0.456, 0.789, ...] (1536 numbers)
```

**Similarity Search**:
```sql
-- Find similar ideas using cosine similarity
SELECT
  id,
  name,
  1 - (embedding <=> $1::vector) as similarity
FROM ideas
WHERE 1 - (embedding <=> $1::vector) > 0.85
ORDER BY similarity DESC
LIMIT 5;
```

**Similarity Thresholds**:
- **> 0.95**: Nearly identical (strong duplicate)
- **0.85-0.95**: Very similar (likely duplicate)
- **0.70-0.85**: Related (same domain/problem)
- **< 0.70**: Different ideas

---

## Error Handling

**Errors at Each Phase**:

| Phase | Error | Action |
|-------|-------|--------|
| 1 | No API key | Throw error → Show "Configure API key" message |
| 2 | Config files missing | Use fallback defaults or throw error |
| 3 | No enabled frameworks | Throw error → "Enable at least one framework" |
| 4 | Prompt too long | Truncate or simplify |
| 5 | API call fails | Retry once, then throw error with details |
| 6 | Invalid JSON | Log response, throw parsing error |
| 6 | Missing fields | Throw validation error with specific missing fields |
| 7 | Embedding API fails | Skip duplicate check (optional feature) |
| 8 | Calculation error | Use fallback: sum of scores without weights |
| 9 | Database error | Rollback, throw error |

---

## Performance Metrics

**Typical Generation Time**:
- Config loading: 50-100ms (cached after first call)
- Prompt building: 5-10ms
- AI API call: 2000-5000ms (95% of total time)
- Parsing: 5-10ms
- Embedding generation: 200-500ms
- Duplicate search: 10-50ms
- Database insert: 20-50ms
- **Total**: ~2.5-6 seconds

---

## Future Enhancements

1. **Multi-step Generation**: Break into multiple prompts for refinement
2. **Batch Generation**: Generate 5-10 ideas in parallel
3. **Learning from History**: Feed previous high-scoring ideas into prompt
4. **Custom Frameworks**: Allow users to create their own frameworks via UI
5. **A/B Testing**: Test different prompts and track which produce better ideas

---

**End of Process Documentation**
