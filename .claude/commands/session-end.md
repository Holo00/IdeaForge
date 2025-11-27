# End Session

Cleanup and documentation tasks before ending a development session.

## Arguments
- **$ARGUMENTS**: Brief summary of what was worked on (e.g., "added user preferences feature")

## Workflow

### 1. Review Changes Made

List the changes made during this session:
- New files created
- Files modified
- Database migrations added
- Configuration changes

### 2. Update Recent Changes

Edit `.claude/docs/recent-changes.md` to add an entry:

```markdown
## [YYYY-MM-DD] - [Session Summary]

### Added
- [New features, files, endpoints]

### Changed
- [Modifications to existing functionality]

### Fixed
- [Bug fixes]

### Removed
- [Deleted files or features]

### Migration Required
- [ ] [Steps if any migrations needed]
```

### 3. Update Architecture (If Structure Changed)

If new folders, services, or significant files were added:
- Edit `.claude/docs/architecture.md`
- Update the folder tree
- Add new files to key files section

### 4. Check for Learnings

Review the session for gotchas or non-obvious things discovered:
- Unexpected behavior
- Workarounds needed
- Configuration quirks
- Integration issues

If any found, add to `.claude/learnings.md`:

```markdown
## [Category]: [Title]

**Problem**: [What happened]
**Cause**: [Why]
**Solution**: [How to handle]
```

### 5. Verify Documentation Accuracy

Quick check that docs match reality:
- API endpoints documented?
- Database schema current?
- Any TODO comments left in code?

### 6. Session Summary

Provide a summary:

```markdown
## Session Summary: $ARGUMENTS

### Completed
- [x] [Task 1]
- [x] [Task 2]

### Documentation Updated
- [x] recent-changes.md
- [ ] architecture.md (if applicable)
- [ ] learnings.md (if applicable)

### Pending/Next Steps
- [ ] [Any unfinished work]
- [ ] [Suggested follow-up tasks]

### Notes
[Any important context for the next session]
```

## Session: $ARGUMENTS

Now perform the end-of-session cleanup for this work.