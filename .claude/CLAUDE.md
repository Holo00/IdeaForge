# IdeaForge

AI-powered business idea generation platform. Backend (Express/PostgreSQL) on port 5000, Frontend (Next.js 16) on port 6001.

---

## Execution Protocol

### 1. Assess Complexity First

| Complexity | Criteria | Action |
|------------|----------|--------|
| **Trivial** | Single file, <10 lines, obvious fix | Just do it |
| **Simple** | 1-2 files, clear path | Brief plan, execute |
| **Medium** | 3-5 files, some decisions | TodoWrite, step-by-step |
| **Complex** | 6+ files, architectural | TodoWrite + consider delegation |

### 2. Research Before Coding

Before ANY implementation:
1. Check existing patterns in codebase (grep for similar code)
2. Read relevant files completely
3. Verify assumptions against actual code

### 3. Execute Incrementally

```
For each task:
  1. Mark in_progress (only ONE at a time)
  2. Complete fully
  3. Mark completed IMMEDIATELY
  4. Move to next
```

**Never**: Batch complete multiple tasks, skip TodoWrite for medium+ tasks, code without reading existing patterns.

---

## Documentation Triggers

| Event | Update |
|-------|--------|
| New API endpoint | `.claude/docs/architecture.md` (routes section) |
| Database change | `.claude/docs/architecture.md` + new migration |
| Breaking change | `.claude/docs/recent-changes.md` with migration steps |
| New pattern discovered | `.claude/learnings.md` |
| Bug from wrong assumption | `.claude/learnings.md` |
| Refactor | `.claude/docs/architecture.md` if structure changed |
| New feature | `.claude/docs/recent-changes.md` + `.claude/docs/architecture.md` |
| Update feature | `.claude/docs/recent-changes.md` if behavior changed |

---

## Sub-Agent Delegation

### When to Delegate

- **architect** (opus): System design, major refactoring, new subsystems
- **debugger** (sonnet): Complex bugs, tracing issues across files
- **reviewer** (sonnet): Code review before major merges
- **doc-writer** (haiku): Documentation generation, README updates

### Delegation Criteria

Delegate when:
- Task requires deep exploration of 10+ files
- Multiple architectural options need evaluation
- Bug spans multiple services/layers
- Documentation needs comprehensive update

Don't delegate:
- Simple CRUD operations
- Single-file fixes
- Clear-path implementations

---

## Self-Improvement

### Add to `learnings.md` when:
- Corrected by user
- Discovered project-specific behavior
- Found documentation vs reality mismatch
- Made assumption that was wrong

### Format:
```markdown
- [YYYY-MM-DD] **Category**: Description
```

---

## Quick Commands

| Command | Use For |
|---------|---------|
| `/add-endpoint` | New API route |
| `/add-component` | New React component |
| `/new-feature` | Full-stack feature |
| `/update-feature` | Modify existing feature |
| `/refactor` | Code restructuring |
| `/debug` | Bug investigation |
| `/scan-structure` | Sync architecture docs |
| `/session-end` | End of session cleanup |

---

## Reference Documentation

### Architecture & Technical
- `@docs/architecture.md` - Project structure, database schema, key files
- `@docs/tech-context.md` - Tech stack, AI integration, config system
- `@docs/conventions.md` - Code standards, API format, error handling

### Process
- `@docs/workflow.md` - SOLID principles, git workflow, planning
- `@docs/recent-changes.md` - Changelog, breaking changes

### Implementation Patterns
- `@skills/api-endpoint.md` - Routes → Controller → Service → Repository
- `@skills/database-changes.md` - Migration system, gotchas
- `@skills/idea-generation.md` - Full generation flow
- `@skills/frontend-patterns.md` - React/Next.js patterns, dark mode

### Agents
- `@agents/architect.md` - System design (opus)
- `@agents/debugger.md` - Bug investigation (sonnet)
- `@agents/reviewer.md` - Code review (sonnet)
- `@agents/doc-writer.md` - Documentation (haiku)

---

## Critical Reminders

1. **Ports**: Backend 5000, Frontend 6001 (not 3000/3001)
2. **BullMQ**: Installed but NOT implemented - generation is manual only
3. **Config**: Hybrid system - DB metadata + filesystem YAML in `backend/configs/`
4. **Framework not Template**: Use `framework` property, `template` is deprecated
5. **Scores**: 0-100 scale (not 0-80)

---

## Workflow Validation

### Pre-Implementation Checklist
Before writing code, verify:
- [ ] Read the target file(s) completely
- [ ] Checked for similar patterns in codebase
- [ ] TodoWrite used (if 3+ steps)
- [ ] Only ONE todo marked `in_progress`

### Post-Implementation Checklist
After completing task:
- [ ] Changes are minimal (no unrelated modifications)
- [ ] Follows existing patterns (validated against skills/)
- [ ] Documentation updated (per triggers table)
- [ ] Todo marked `completed` immediately

### Quality Gates by Task Type

**API Endpoint**:
- [ ] Zod validation present
- [ ] Returns `ApiResponse<T>`
- [ ] Errors use `next(error)`
- [ ] Controller is thin

**React Component**:
- [ ] `'use client'` if stateful
- [ ] Props interface defined
- [ ] Dark mode classes included
- [ ] PascalCase filename

**Database Change**:
- [ ] Migration is idempotent (IF NOT EXISTS)
- [ ] Types updated in `types/index.ts`
- [ ] Repository mapper updated

**Bug Fix**:
- [ ] Root cause identified (not just symptom)
- [ ] Fix is targeted (minimal changes)
- [ ] Added to `learnings.md` if gotcha

### Red Flags (Stop and Reassess)
- Editing file without reading it first
- Multiple todos `in_progress` simultaneously
- No TodoWrite for 5+ file changes
- Assuming port/config without checking
- Adding features not requested

---

## Session Start Checklist

- [ ] Read `learnings.md` for recent discoveries
- [ ] Check `recent-changes.md` for context
- [ ] Verify ports/services if running locally

---

## User Guide

See `@docs/prompting-guide.md` for:
- How to prompt for different use cases
- Expected Claude behavior per task type
- Anti-patterns to avoid
- Session workflow tips