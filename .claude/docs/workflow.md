# Development Workflow

## Research First

**CRITICAL**: Before starting any task, research best practices for that specific technology or pattern.

### Process

1. Identify the specific technology/framework you're working with
2. Search for current best practices and common patterns
3. Check official documentation for recommended approaches
4. Consider industry standards and conventions
5. Only then proceed with implementation

### Examples

| Task | Research First |
|------|----------------|
| Adding dark mode to Next.js | Research next-themes best practices |
| Database migration | Research migration patterns for raw SQL |
| New API endpoint | Review REST conventions, existing patterns in codebase |
| Adding a new service | Check existing services for patterns |

---

## TodoWrite Usage

### When to Use

Use TodoWrite for any **non-trivial task** (3+ steps or complex implementation):

- Building new features (multiple files/components)
- Database migrations or schema changes
- Refactoring multiple files
- Implementing complex business logic
- API endpoint creation with multiple steps

### When NOT to Use

- Single-file changes (simple bug fixes)
- Adding a single log statement
- Updating documentation only
- Trivial configuration changes

### Example

**User**: "Add ability to filter ideas by domain and score"

**Process**:
```
1. TodoWrite with tasks:
   - Add filter query parameters to GET /api/ideas endpoint
   - Update database query to support domain/score filtering
   - Add filter UI components to frontend
   - Test filtering with various combinations

2. Execute tasks incrementally, marking each complete
```

---

## Incremental Execution

**Execute one task at a time, mark it complete, then move to next.**

### Bad Patterns

- Complete 3 tasks, then mark all complete at once
- Start multiple tasks in parallel without finishing any
- Forget to update todo status

### Good Pattern

```
1. Mark task as in_progress
2. Complete the task fully
3. Mark as completed
4. Move to next task
```

### Task States

| State | Meaning |
|-------|---------|
| `pending` | Not started |
| `in_progress` | Currently working (only ONE at a time) |
| `completed` | Done |

---

## Plan First, Then Execute

**Never start coding without a plan for non-trivial tasks.**

### Process

1. **Read** relevant files to understand current implementation
2. **Create** todo list with TodoWrite tool
3. **Execute** tasks incrementally
4. **Mark** each task complete immediately after finishing
5. **Update** documentation if needed

---

## SOLID Principles (Pragmatic Approach)

Apply SOLID when it adds value, not complexity. Don't over-engineer.

### Single Responsibility Principle

Each module/function does ONE thing.

```typescript
// Good - separate concerns
class IdeaService {
  async generateIdea(framework: string): Promise<Idea> { }
}
class IdeaRepository {
  async save(idea: Idea): Promise<void> { }
}

// Bad - mixing concerns
class IdeaManager {
  async generateAndSaveIdea() {
    // generation logic AND database logic mixed
  }
}
```

### Open/Closed Principle

Use configuration-driven behavior, not hardcoded logic.

```typescript
// Good - extensible via config
interface GenerationFramework {
  name: string;
  template: string;
  generate(config: Config): Promise<Idea>;
}

// Bad - hardcoded
function generateIdea(type: 'painpoint' | 'unbundling') {
  if (type === 'painpoint') { }
  else if (type === 'unbundling') { }
}
```

### Liskov Substitution Principle

Subtypes should be substitutable for base types. Don't break contracts in derived classes.

### Interface Segregation Principle

Keep interfaces small and focused. Don't force clients to depend on unused methods.

### Dependency Inversion Principle

Depend on abstractions, use dependency injection.

```typescript
// Good - injectable dependency
class IdeaController {
  constructor(private ideaService: IIdeaService) { }
}

// Bad - tight coupling
class IdeaController {
  private ideaService = new IdeaService();
}
```

### Key Point

**Don't over-engineer.** If you're building a simple CRUD endpoint, don't create 5 layers of abstraction.

---

## Documentation Updates

**Auto-update documentation as you build.**

### When to Update

| Change | Update |
|--------|--------|
| New API endpoints | `docs/API.md` |
| Database schema changes | `docs/DATABASE.md` |
| New configuration options | `docs/CONFIGURATION.md` |
| Breaking changes | `docs/RECENT_CHANGES.md` |

### RECENT_CHANGES.md Format

```markdown
## [YYYY-MM-DD] - Feature/Fix Name

### Changed
- What changed and why

### Migration Required
- [ ] Step 1
- [ ] Step 2
```

---

## Git Workflow

### Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Features | `feature/<name>` | `feature/idea-filtering` |
| Bug fixes | `fix/<name>` | `fix/scoring-calculation` |
| Refactoring | `refactor/<name>` | `refactor/config-service` |

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch (if used)
- Feature/fix branches created from `main` or `develop`

---

## Common Pitfalls to Avoid

| Pitfall | Instead |
|---------|---------|
| Over-engineering | Build only what's needed now |
| Hardcoding config | Make it configurable via YAML/DB |
| Skipping concrete examples | Every idea needs currentState/yourSolution/keyImprovement |
| Not tracking todos | Use TodoWrite for multi-step tasks |
| Batch completing tasks | Mark each complete immediately |
| Forgetting documentation | Update docs as you build |
| Starting without reading code | Always read existing implementation first |