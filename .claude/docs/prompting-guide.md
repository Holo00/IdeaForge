# User Prompting Guide

How to prompt Claude Code effectively for different use cases in this project.

---

## Quick Reference

| Use Case | Prompt Pattern | Expected Behavior |
|----------|---------------|-------------------|
| Bug fix | "Fix [symptom] in [location]" | Debug → Fix → Verify |
| New endpoint | "/add-endpoint [description]" | Pattern lookup → Implement → Doc |
| New component | "/add-component [description]" | Pattern lookup → Implement → Doc |
| Full feature | "/new-feature [description]" | Plan → Backend → Frontend → Doc |
| Modify feature | "/update-feature [description]" | Research → Plan → Implement → Doc |
| Refactor | "/refactor [what to refactor]" | Analyze → Plan → Execute → Verify |
| Investigate | "How does [X] work?" | Explore → Explain |
| Architecture | "Design [system/feature]" | Delegate to architect agent |

---

## Detailed Use Cases

### 1. Bug Fixes

**Good prompts:**
```
Fix the 500 error when generating ideas with no API key configured

The ideas list doesn't show dark mode properly - text is unreadable

Generation logs are not appearing in real-time on the dashboard
```

**What happens:**
1. Claude reads relevant code
2. Identifies the issue
3. Implements fix
4. If behavioral change → updates `recent-changes.md`
5. If discovered gotcha → updates `learnings.md`

**Validation signals:**
- [ ] Claude read the file before editing
- [ ] Fix is minimal (no unrelated changes)
- [ ] Error case is handled

---

### 2. New API Endpoint

**Good prompts:**
```
/add-endpoint GET /api/stats to return total ideas count by status

/add-endpoint POST /api/ideas/:id/duplicate to clone an existing idea

Add an endpoint to export ideas as markdown
```

**What happens:**
1. Claude reads `@skills/api-endpoint.md`
2. Checks existing patterns in `routes/ideas.ts`
3. Creates TodoWrite plan
4. Implements: Route → Controller → Service → Repository (if needed)
5. Registers route in `index.ts`
6. Updates `docs/architecture.md`

**Validation signals:**
- [ ] Uses Zod for validation
- [ ] Returns `ApiResponse<T>` format
- [ ] Errors passed to `next()`
- [ ] Controller is thin (logic in service)

---

### 3. New React Component

**Good prompts:**
```
/add-component IdeaCard to display idea summary with score badge

/add-component FilterPanel for the ideas browse page

Create a reusable Modal component for confirmations
```

**What happens:**
1. Claude reads `@skills/frontend-patterns.md`
2. Checks similar components in `frontend/components/`
3. Creates component with proper patterns
4. Includes dark mode classes
5. Updates `docs/architecture.md` if significant

**Validation signals:**
- [ ] Has `'use client'` directive
- [ ] Props interface defined
- [ ] Dark mode classes included
- [ ] Follows naming convention (PascalCase.tsx)

---

### 4. Full-Stack Feature

**Good prompts:**
```
/new-feature Add ability to favorite ideas and filter by favorites

/new-feature Implement idea tagging system with autocomplete

Add a feature to compare two ideas side by side
```

**What happens:**
1. Claude creates comprehensive TodoWrite plan
2. If complex, may delegate to `architect` agent
3. Implements in order:
   - Database migration (if needed)
   - Backend types
   - Service/Repository
   - API endpoints
   - Frontend types
   - API client
   - UI components
4. Updates `docs/architecture.md` and `docs/recent-changes.md`

**Validation signals:**
- [ ] TodoWrite used with 5+ tasks
- [ ] Implementation order is correct (backend first)
- [ ] All layers touched consistently
- [ ] Documentation updated

---

### 5. Update Existing Feature

**Good prompts:**
```
/update-feature Add sorting options to the ideas list (by date, score, name)

/update-feature Make generation support batch mode (multiple ideas at once)

Improve the profile selector to show last used date
```

**What happens:**
1. Claude researches current implementation
2. Identifies all affected files
3. Creates TodoWrite plan
4. Implements changes maintaining backward compatibility
5. Updates `docs/recent-changes.md`

**Validation signals:**
- [ ] Existing functionality not broken
- [ ] Changes are additive where possible
- [ ] Breaking changes documented

---

### 6. Refactoring

**Good prompts:**
```
/refactor Split the ideas page into smaller components

/refactor Extract duplicate validation logic into a shared utility

/refactor Move generation logging to a separate service
```

**What happens:**
1. Claude analyzes current structure
2. Creates extraction/reorganization plan
3. Moves code without changing behavior
4. Updates all imports
5. Removes dead code
6. Updates `docs/architecture.md`

**Validation signals:**
- [ ] No behavioral changes
- [ ] All imports updated
- [ ] No dead code left
- [ ] Tests still pass (if applicable)

---

### 7. Investigation/Research

**Good prompts:**
```
How does the idea generation flow work?

What happens when a duplicate idea is detected?

Explain the configuration profile system

Where are API keys stored and how are they selected?
```

**What happens:**
1. Claude explores relevant code
2. Traces the flow
3. Provides explanation with file references
4. Does NOT make changes unless asked

**Validation signals:**
- [ ] Response includes file paths with line numbers
- [ ] Flow is traced end-to-end
- [ ] No code changes made

---

### 8. Architecture/Design

**Good prompts:**
```
Design a system for scheduled idea generation using the job queue

Plan the architecture for idea sharing/collaboration

How should we structure a plugin system for custom evaluators?
```

**What happens:**
1. May delegate to `architect` agent (opus model)
2. Explores existing patterns
3. Proposes design options
4. Awaits approval before implementing

**Validation signals:**
- [ ] Multiple options presented
- [ ] Trade-offs explained
- [ ] Fits existing patterns
- [ ] No implementation without approval

---

## Anti-Patterns (What NOT to Do)

### Vague Prompts
```
❌ "Fix the bug"
❌ "Make it better"
❌ "Add some features"
```
**Problem**: No context for Claude to work with.

### Compound Prompts Without Structure
```
❌ "Add a new endpoint, also fix the dark mode issue, and refactor the config page"
```
**Better**: Use separate prompts or explicitly ask for a plan first.

### Assuming Knowledge
```
❌ "Use the same pattern as last time"
❌ "Fix it like you did for the other component"
```
**Problem**: Claude doesn't have session memory. Be explicit.

### Skipping the Command
```
❌ "I want a new endpoint for stats"
✅ "/add-endpoint GET /api/stats for idea statistics"
```
**Why**: Commands trigger structured workflows with proper patterns.

---

## Prompt Modifiers

Add these to any prompt for specific behavior:

| Modifier | Effect |
|----------|--------|
| "...and explain your reasoning" | More verbose explanation |
| "...minimal changes only" | Prevents over-engineering |
| "...check for similar patterns first" | Forces pattern research |
| "...plan first, don't implement yet" | Gets approval before coding |
| "...update docs when done" | Ensures documentation |

---

## Session Workflow

### Starting a Session
```
Start by reading learnings.md and recent-changes.md for context
```

### During Development
```
[Use specific commands for tasks]

After each major change:
- Verify it works
- Ask Claude to update docs if needed
```

### Ending a Session
```
/session-end
```
This triggers:
- Summary of changes
- Documentation updates
- Learnings capture

---

## Troubleshooting

### Claude Didn't Follow Patterns
**Prompt**: "That doesn't match our patterns. Check @skills/api-endpoint.md and redo it."

### Claude Made Unrelated Changes
**Prompt**: "Revert the changes to [file]. Only modify what's needed for [task]."

### Claude Assumed Wrong Port/Config
**Prompt**: "Check learnings.md - the backend port is 5000, not [wrong port]."

### Need More Exploration
**Prompt**: "Before implementing, explore how [X] currently works and show me the flow."

### Want Agent Delegation
**Prompt**: "Use the architect agent to design this" or "Have the debugger investigate this."