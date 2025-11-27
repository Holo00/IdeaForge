# Design UI/UX

Design or improve user interface and experience for components or pages.

## Arguments
- **$ARGUMENTS**: Description of what to design (e.g., "redesign the ideas list page" or "design a comparison modal")

## Workflow

### 1. Analyze Requirements

Before designing:
- What is the user trying to accomplish?
- What emotions should the interface evoke?
- What are the key actions and information hierarchy?

### 2. Research Context

Read first:
- `.claude/skills/brand-guidelines/SKILL.md` - **IdeaForge colors, typography, components**
- `.claude/skills/frontend-design/SKILL.md` - Design principles
- `.claude/skills/frontend-patterns/SKILL.md` - React patterns

Check existing UI:
- `frontend/components/` - Current component patterns
- `frontend/app/` - Page layouts
- `tailwind.config.js` - Theme tokens

### 3. Use IdeaForge Brand

**Always use the established brand** from `brand-guidelines/SKILL.md`:
- Primary: Mint `#34D399`
- Accent: Coral `#FF6B6B` (text only, not buttons)
- Background: Dark gradient `#0f1419` → `#1c2128`
- Buttons: Mint gradient primary, ghost white secondary

Do NOT define new colors unless extending the palette for a specific purpose.

### 5. Design Components

For each component specify:
- Purpose and user goal
- States (default, hover, active, disabled, loading, error)
- Responsive behavior (mobile/tablet/desktop)
- Dark mode variant
- Accessibility (contrast, keyboard, screen reader)

### 6. Output Format

```markdown
## UI Design: [Component/Page Name]

### Context
[What this is for, user goals]

### Aesthetic Direction
[Chosen direction and why]

### Visual Specifications
[Colors, typography, spacing]

### Component Structure
[Layout description or ASCII diagram]

### States
- Default: [description]
- Hover: [description]
- Active: [description]

### Tailwind Implementation
```tsx
className="..."
```

### Dark Mode
[Specific dark mode considerations]

### Accessibility
- [ ] Color contrast: [ratio]
- [ ] Keyboard navigation: [details]
- [ ] Screen reader: [considerations]
```

### 7. Implementation (Optional)

If asked to implement after design approval:
1. Use TodoWrite to plan component creation
2. Follow `.claude/skills/frontend-patterns/SKILL.md`
3. Create/update components with design specs
4. Test dark mode and responsive behavior

## Anti-Patterns to Avoid

- Generic font stacks (Inter, Roboto, Arial)
- Overused purple gradients on white
- Cookie-cutter card layouts
- Meaningless animations
- Inconsistent spacing
- Ignoring dark mode

## Design Task: $ARGUMENTS

Now design this following the workflow above. Present the design for approval before implementing.