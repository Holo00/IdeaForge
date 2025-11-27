# Refactor Code

Restructure code without changing functionality.

## Arguments
- **$ARGUMENTS**: What to refactor (e.g., "split config page into smaller components", "extract duplicate validation logic")

## Workflow

### 1. Understand the Goal

Refactoring should:
- Improve code organization
- Reduce duplication
- Improve readability
- NOT change external behavior

### 2. Identify Scope

Read the code to understand:
- What files are involved?
- What's the current structure?
- Why is refactoring needed?

Common refactoring triggers:
- File too long (>500 lines)
- Duplicate code in multiple places
- Mixed concerns (UI + logic + data)
- Hard to understand flow

### 3. Plan the Refactor

Use TodoWrite:

```
Tasks:
1. Read current implementation
2. Identify extraction targets
3. Create new file(s)
4. Move code to new location
5. Update imports
6. Verify functionality unchanged
7. Remove old code (if moved, not copied)
```

### 4. Common Refactoring Patterns

**Extract Component** (Frontend):
```
Before: 500-line page.tsx
After:  page.tsx (100 lines) + 4 components
```

**Extract Service** (Backend):
```
Before: Logic in controller
After:  Controller calls service
```

**Extract Utility**:
```
Before: Same helper in 3 files
After:  lib/utils.ts with shared function
```

**Split by Concern**:
```
Before: Mixed validation + business logic + DB
After:  Separate controller / service / repository
```

### 5. Refactoring Rules

1. **One change at a time** - Don't refactor + add features
2. **Keep tests passing** - Behavior shouldn't change
3. **Update imports** - Search for all usages
4. **No dead code** - Delete moved code, don't comment
5. **Consistent naming** - Follow existing conventions

### 6. Verify No Regression

After refactoring:
- Functionality works the same
- No TypeScript errors
- No console errors
- Imports resolve correctly

### 7. Update Documentation

If structure changed significantly:
- `.claude/docs/architecture.md` - Update file structure
- `.claude/docs/recent-changes.md` - Note the refactor

## Refactor: $ARGUMENTS

Now analyze and perform this refactoring following the workflow above.