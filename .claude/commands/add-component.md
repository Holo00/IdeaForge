# Add React Component

Add a new React component following project patterns.

## Arguments
- **$ARGUMENTS**: Description of the component (e.g., "IdeaCard component to display idea summary in a card format")

## Workflow

### 1. Plan the Component

Use TodoWrite to plan:

```
Tasks:
1. Review similar existing components
2. Create component file
3. Add TypeScript types if needed
4. Import and use in parent component/page
5. Update architecture.md if significant
```

### 2. Check Brand & Patterns

**Read brand guidelines first:**
- `.claude/skills/brand-guidelines/SKILL.md` - IdeaForge colors, typography

Review existing components for patterns:

**Simple components**:
- `frontend/components/Navigation.tsx`
- `frontend/components/Toast.tsx`

**Complex components with state**:
- `frontend/components/GenerationControls.tsx`
- `frontend/components/LogsViewer.tsx`

**Config editor components** (form patterns):
- `frontend/components/config/FrameworksEditor.tsx`
- `frontend/components/config/ApiKeysEditor.tsx`

### 3. Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Component file | `PascalCase.tsx` | `IdeaCard.tsx` |
| Component folder | Group by feature | `components/config/` |
| Props interface | `{Name}Props` | `IdeaCardProps` |

### 4. Component Template

```tsx
'use client';

import { useState } from 'react';

interface MyComponentProps {
  // Props here
}

export default function MyComponent({ prop1, prop2 }: MyComponentProps) {
  // State if needed
  const [state, setState] = useState();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      {/* Always include dark mode classes */}
    </div>
  );
}
```

### 5. IdeaForge Brand Colors

Use brand colors from `@skills/brand-guidelines/SKILL.md`:
```
// Backgrounds (dark-first)
bg-[#0f1419]                 // Base
bg-[#1c2128]                 // Surface/cards
bg-[#262c36]                 // Elevated

// Primary (Mint)
text-emerald-400             // #34D399
bg-emerald-400/500           // Buttons

// Text
text-[#f0f6fc]               // Primary text
text-[#8b949e]               // Secondary text

// Accent (Coral - text only)
text-red-400                 // #FF6B6B
```

### 6. Update Documentation

If significant component (new feature, not just refactor):
- Update `.claude/docs/architecture.md` - Add to component list
- Update `.claude/docs/recent-changes.md`

## Component: $ARGUMENTS

Now implement this component following the workflow above.