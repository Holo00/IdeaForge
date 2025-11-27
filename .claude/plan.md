# IdeaForge Complete Redesign Plan

## Overview

Transform IdeaForge from a light/dark toggle design to a **single dark theme** with **data-dense, modern analytics dashboard** aesthetics. Hybrid navigation (minimal top bar + collapsible sidebar).

## Design Philosophy

**Style**: Modern Analytics Dashboard (Linear, Stripe Dashboard-inspired)
- Clean but compact
- Data tables with subtle hierarchy
- Metric cards with clear visual weight
- Professional, data-driven appearance

**Key Principles**:
1. **Data density**: More information visible without scrolling
2. **Visual hierarchy**: Clear distinction between primary/secondary/tertiary content
3. **Consistent spacing**: Tight but breathable (8px base unit for density)
4. **Single theme**: Dark mode only - no theme toggle needed

---

## Design System

### Colors (From Brand Guidelines)

```
Backgrounds:
- Base:     #0f1419 (rgb 15, 20, 25)
- Surface:  #1c2128 (rgb 28, 33, 40)
- Elevated: #262c36 (rgb 38, 44, 54)
- Hover:    #2d333b

Primary (Mint):
- Default:  #34D399
- Dark:     #10B981
- Light:    #6EE7B7

Accent (Coral - text highlights only):
- Default:  #FF6B6B

Text:
- Primary:   #f0f6fc
- Secondary: #8b949e
- Muted:     #6e7681

Semantic:
- Success: #34D399
- Warning: #FBBF24
- Error:   #EF4444
- Info:    #67E8F9
```

### Typography

```
Font Stack: System fonts (already in brand guidelines)
- -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto

Sizes (compact for data density):
- Page title: 24px (1.5rem) - reduced from 2.5rem
- Section heading: 16px (1rem) semi-bold
- Body: 14px (0.875rem)
- Small/Labels: 12px (0.75rem)
- Micro (badges): 11px (0.6875rem)

Weights:
- Bold: 700
- Semi-bold: 600
- Medium: 500
- Regular: 400
```

### Spacing (8px base for density)

```
xs: 4px   - Tight inline spacing
sm: 8px   - Between related items
md: 12px  - Default component padding
lg: 16px  - Section gaps
xl: 24px  - Major section dividers
```

### Border Radius

```
sm: 4px  - Buttons, badges, inputs
md: 6px  - Cards, panels
lg: 8px  - Modal, major containers
```

---

## Component Library Changes

### 1. New Layout Shell Component

Create `frontend/components/layout/AppShell.tsx`:
- Collapsible sidebar (240px expanded, 56px collapsed)
- Minimal top bar (48px height)
- Main content area fills remaining space
- Sidebar state persisted to localStorage

### 2. Sidebar Component

Create `frontend/components/layout/Sidebar.tsx`:
- Logo at top
- Navigation items with icons
- Collapse toggle at bottom
- Active state indicator (mint left border)
- Hover states

### 3. Top Bar Component

Create `frontend/components/layout/TopBar.tsx`:
- Breadcrumb (optional)
- User info + logout
- No theme toggle (single theme)

### 4. Updated Common Components

**Card** - More compact:
```tsx
className="bg-[#1c2128] rounded-md p-3 border border-[#2d333b]"
```

**Button - Primary**:
```tsx
className="px-3 py-1.5 text-sm bg-gradient-to-r from-emerald-400 to-emerald-500 text-[#0f1419] font-medium rounded hover:from-emerald-300 hover:to-emerald-400"
```

**Button - Secondary**:
```tsx
className="px-3 py-1.5 text-sm border border-[#3d444d] text-[#f0f6fc] rounded hover:bg-[#262c36]"
```

**Input**:
```tsx
className="w-full px-3 py-1.5 text-sm bg-[#0f1419] border border-[#3d444d] rounded text-[#f0f6fc] placeholder-[#6e7681] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
```

**Table** (data-dense):
```tsx
// Table header
className="px-3 py-2 text-xs font-medium text-[#8b949e] uppercase tracking-wider bg-[#161b22]"

// Table row
className="px-3 py-2 text-sm text-[#f0f6fc] border-b border-[#21262d]"
```

**Badge/Pill**:
```tsx
className="px-2 py-0.5 text-xs font-medium rounded-full"
// Score colors based on value
```

---

## Page-by-Page Changes

### 1. Root Layout (`app/layout.tsx`)

- Remove `darkMode: 'class'` from Tailwind config (single theme)
- Wrap children in new AppShell component
- Set base background to `#0f1419`
- Remove Navigation component from layout (moved to sidebar)

### 2. Landing Page (`app/page.tsx`)

- Keep minimal for non-authenticated users
- Dark background consistent with app
- Remove light mode classes

### 3. Dashboard Page (`app/dashboard/page.tsx`)

Current: Full-width with top padding, stats at bottom
New:
- Remove page-level header (sidebar handles nav)
- Generation controls + logs in compact side-by-side layout
- Stats row moved to top as compact metric cards
- Status indicator integrated into generation panel

### 4. Ideas List Page (`app/ideas/page.tsx`)

Current: Table with moderate density
New:
- Compact table rows (py-2 instead of py-4)
- Inline filters bar (not collapsible panel)
- Score badges more prominent
- Pagination simplified

### 5. Idea Detail Page (`app/ideas/[id]/page.tsx`)

Current: Large cards with lots of padding
New:
- Tighter spacing throughout
- Collapsible sections for dense info
- Score radar/bar chart more compact
- Two-column layout for quick scan

### 6. Config Page (`app/config/page.tsx`)

Current: Has own sidebar navigation
New:
- Use main app sidebar for primary nav
- Section tabs become horizontal tabs within page
- Compact form elements

### 7. Settings Page (`app/settings/page.tsx`)

Current: Similar to config with sidebar
New:
- Same treatment as config page
- Compact form layouts

---

## Files to Modify/Create

### Create New (7 files)

1. `frontend/components/layout/AppShell.tsx` - Main layout wrapper
2. `frontend/components/layout/Sidebar.tsx` - Collapsible sidebar
3. `frontend/components/layout/TopBar.tsx` - Minimal top bar
4. `frontend/components/ui/Card.tsx` - Compact card component
5. `frontend/components/ui/Button.tsx` - Button variants
6. `frontend/components/ui/Badge.tsx` - Score/status badges
7. `frontend/components/ui/Table.tsx` - Data-dense table

### Modify Existing (15+ files)

1. `frontend/tailwind.config.js` - Remove darkMode, extend colors
2. `frontend/app/globals.css` - Add base styles, CSS variables
3. `frontend/app/layout.tsx` - Integrate AppShell
4. `frontend/app/page.tsx` - Update to dark-only theme
5. `frontend/app/dashboard/page.tsx` - Compact layout
6. `frontend/app/ideas/page.tsx` - Dense table
7. `frontend/app/ideas/[id]/page.tsx` - Compact sections
8. `frontend/app/config/page.tsx` - Remove internal sidebar
9. `frontend/app/settings/page.tsx` - Remove internal sidebar
10. `frontend/app/admin/login/page.tsx` - Dark theme
11. `frontend/components/Navigation.tsx` - Remove (replaced by Sidebar)
12. `frontend/components/LogsViewer.tsx` - Compact styling
13. `frontend/components/GenerationControls.tsx` - Compact form
14. `frontend/components/ideas/AdvancedFilters.tsx` - Inline/compact
15. All config editor components - Compact forms

### Delete (2 files)

1. `frontend/components/ThemeProvider.tsx` - No longer needed
2. Theme-related code in Navigation.tsx

---

## Implementation Order

### Phase 1: Foundation (Required First)
1. Update `tailwind.config.js` with color palette
2. Update `globals.css` with base dark styles
3. Create `AppShell.tsx`, `Sidebar.tsx`, `TopBar.tsx`
4. Update `layout.tsx` to use new shell
5. Remove ThemeProvider and theme toggle

### Phase 2: UI Components
6. Create compact `Card.tsx`, `Button.tsx`, `Badge.tsx`, `Table.tsx`
7. Update `LogsViewer.tsx` and `GenerationControls.tsx`

### Phase 3: Pages
8. Update Dashboard page
9. Update Ideas list page
10. Update Idea detail page
11. Update Config page
12. Update Settings page
13. Update Landing page
14. Update Admin login page

### Phase 4: Polish
15. Update all config editor components
16. Update AdvancedFilters
17. Final spacing/typography pass
18. Remove unused dark: classes throughout

---

## Tailwind Config Changes

```js
// tailwind.config.js
module.exports = {
  content: [...],
  // Remove darkMode - single theme
  theme: {
    extend: {
      colors: {
        // Brand colors
        base: '#0f1419',
        surface: '#1c2128',
        elevated: '#262c36',
        hover: '#2d333b',
        border: '#3d444d',

        // Primary (mint)
        mint: {
          DEFAULT: '#34D399',
          dark: '#10B981',
          light: '#6EE7B7',
        },

        // Accent (coral)
        coral: '#FF6B6B',

        // Text
        'text-primary': '#f0f6fc',
        'text-secondary': '#8b949e',
        'text-muted': '#6e7681',
      },
      spacing: {
        // Compact spacing
        '18': '4.5rem', // 72px for sidebar collapsed
        '60': '15rem',  // 240px for sidebar expanded
      },
      fontSize: {
        'micro': '0.6875rem', // 11px
      }
    },
  },
  plugins: [],
}
```

---

## CSS Variables (globals.css)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* Backgrounds */
  --color-base: #0f1419;
  --color-surface: #1c2128;
  --color-elevated: #262c36;
  --color-hover: #2d333b;
  --color-border: #3d444d;

  /* Primary */
  --color-mint: #34D399;
  --color-mint-dark: #10B981;

  /* Text */
  --color-text-primary: #f0f6fc;
  --color-text-secondary: #8b949e;
  --color-text-muted: #6e7681;
}

body {
  background-color: var(--color-base);
  color: var(--color-text-primary);
}
```

---

## Questions Resolved

- **Keep Tailwind?** Yes - it's well-suited for rapid utility-based styling
- **Single theme?** Yes - dark only, removes complexity
- **Navigation?** Hybrid - minimal top bar + collapsible sidebar
- **Density?** Moderate - readable at a glance, balanced spacing
- **Pages?** Keep existing structure, update visual presentation only

---

## Estimated Scope

- **New files**: 7
- **Modified files**: ~20
- **Deleted files**: 2
- **Total component updates**: ~25

This is a significant change touching most of the frontend. Implementation should be done methodically, phase by phase, testing as we go.