# Update Feature

Modify or enhance an existing feature.

## Arguments
- **$ARGUMENTS**: What to update (e.g., "add sorting options to ideas list", "improve generation error handling")

## Workflow

### 1. Understand Current Implementation

Before changing anything:

1. **Identify affected files** - Find all files related to this feature
2. **Read the code** - Understand how it currently works
3. **Check dependencies** - What else uses this code?

```bash
# Find related files
grep -r "featureName" backend/src/ frontend/
```

### 2. Plan Changes

Use TodoWrite to plan:

```
Tasks:
1. Read current implementation
2. Identify all files to modify
3. Check for breaking changes
4. Implement backend changes
5. Implement frontend changes
6. Test the changes
7. Update documentation
```

### 3. Assess Impact

Before implementing, consider:

| Question | Check |
|----------|-------|
| Breaking API changes? | Will frontend break? |
| Database changes? | Need migration? |
| Type changes? | Update interfaces? |
| Other features affected? | Search for imports |

### 4. Implement Changes

**Order of changes:**
1. Database migration (if schema change)
2. Backend types
3. Backend service/repository logic
4. Backend controller (if API change)
5. Frontend types
6. Frontend API calls
7. Frontend components

### 5. Maintain Backwards Compatibility

If API changes affect frontend:
- Option A: Update frontend simultaneously
- Option B: Support old + new format temporarily
- Option C: Version the API (rarely needed)

### 6. Test the Changes

- Test the updated functionality
- Test related features that might be affected
- Check for console errors

### 7. Update Documentation

- `.claude/docs/recent-changes.md` - Document the update
- `docs/API.md` - If endpoints changed
- Code comments - If logic is non-obvious

## Update: $ARGUMENTS

Now analyze and implement this update following the workflow above.