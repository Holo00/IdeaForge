# Scan Project Structure

Scan the codebase and update architecture documentation.

## Arguments
- **$ARGUMENTS**: Optional focus area (e.g., "backend only", "frontend components", or leave empty for full scan)

## Workflow

### 1. Scan Current Structure

Scan the following directories:

**Backend**:
```bash
find backend/src -type f -name "*.ts" | head -50
```

**Frontend**:
```bash
find frontend/app -type f -name "*.tsx"
find frontend/components -type f -name "*.tsx"
```

**Database**:
```bash
ls backend/db/migrations/
```

**Config**:
```bash
ls backend/configs/*/
```

### 2. Read Current Documentation

Read `.claude/docs/architecture.md` to compare against current state.

### 3. Identify Changes

Compare and note:
- New files/folders not in docs
- Removed files/folders still in docs
- Changed file purposes
- New database tables (check latest migrations)

### 4. Update Architecture

Edit `.claude/docs/architecture.md` with:
- Updated folder tree
- New files with descriptions
- Removed obsolete entries
- Updated database schema section if needed

### 5. Report Changes

Summarize what was found and updated:

```markdown
## Structure Scan Results

### Added to Documentation
- `path/to/new/file.ts` - [description]

### Removed from Documentation
- `path/to/old/file.ts` - no longer exists

### Updated
- `path/to/changed.ts` - [what changed]

### No Changes
- [areas that matched documentation]
```

## Focus Area: $ARGUMENTS

Proceed with the scan, focusing on the specified area (or full scan if not specified).