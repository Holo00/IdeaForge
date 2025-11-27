# Debug Issue

Systematic debugging workflow for investigating issues.

## Arguments
- **$ARGUMENTS**: Description of the issue (e.g., "generation fails with 'missing criteria' error")

## Workflow

### 1. Check Known Issues

First, check if this is a known issue:
- Read `.claude/learnings.md` if it exists
- Search `.claude/docs/recent-changes.md` for related changes

### 2. Gather Information

Collect details about the issue:
- Exact error message
- When it occurs (startup, API call, user action)
- Is it reproducible?
- Recent changes that might be related

### 3. Identify Code Path

Determine which code path is involved:

**API Errors** → Check:
```
backend/src/api/routes/*.ts
backend/src/api/controllers/*.ts
backend/src/services/*.ts
backend/src/repositories/*.ts
```

**Generation Errors** → Check:
```
backend/src/services/ideaGenerationService.ts
backend/src/services/promptBuilder.ts
backend/src/lib/aiProvider.ts
```

**Frontend Errors** → Check:
```
frontend/app/**/page.tsx
frontend/components/*.tsx
frontend/lib/api.ts
```

**Database Errors** → Check:
```
backend/src/lib/db.ts
backend/db/migrations/*.sql
```

### 4. Investigate

Use the debugger agent approach:

1. **Grep** for error messages or related code
2. **Read** files in the code path
3. **Trace** the execution flow
4. **Check** configuration and database state

### 5. Document Findings

Report findings in this format:

```markdown
## Investigation: [Issue]

### Symptoms
- [What was reported]

### Root Cause
[What's actually wrong]

### Evidence
- File: `path/to/file.ts:123`
- [Relevant code or logs]

### Fix
[What needs to change]
```

### 6. Update Learnings

If this reveals a non-obvious gotcha, add it to `.claude/learnings.md`:

```markdown
## [Category]: [Brief Title]

**Problem**: [What went wrong]
**Cause**: [Why it happened]
**Solution**: [How to fix/avoid]
**Files**: [Relevant files]
```

## Issue: $ARGUMENTS

Now investigate this issue following the workflow above.