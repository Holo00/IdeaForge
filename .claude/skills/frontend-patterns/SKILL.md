---
name: frontend-patterns
description: Build React components and pages in IdeaForge frontend. Triggers: new component, dark mode, API calls, React Context, SSE streams, Tailwind styling. Stack: Next.js 16 App Router, React 19, TypeScript, Tailwind, next-themes.
---

# Frontend Patterns

## Structure

```
frontend/
├── app/           # Pages (App Router)
├── components/    # React components
├── contexts/      # React Context providers
├── lib/api.ts     # Backend API client
└── types/         # TypeScript types
```

## Component Template

```tsx
'use client';

interface Props {
  title: string;
  onClick?: () => void;
}

export default function MyComponent({ title, onClick }: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h2 className="text-gray-900 dark:text-gray-100">{title}</h2>
    </div>
  );
}
```

## Brand Colors (Required)

**Read `@skills/brand-guidelines/SKILL.md` for full palette.**

IdeaForge uses dark mode as default:

```tsx
// Backgrounds
bg-[#0f1419]              // Base
bg-[#1c2128]              // Surface/cards
bg-[#262c36]              // Elevated/hover

// Primary (Mint)
text-emerald-400          // #34D399
bg-gradient-to-r from-emerald-400 to-emerald-500  // Primary button

// Text
text-[#f0f6fc]            // Primary
text-[#8b949e]            // Secondary

// Accent (Coral - text only)
text-red-400              // #FF6B6B highlights
```

## API Calls

```tsx
const response = await api.getIdeas();
if (response.success) {
  setItems(response.data.ideas);
} else {
  setError(response.error.message);
}
```

## Common Elements

```tsx
// Card
<div className="bg-[#1c2128] rounded-xl p-6 border border-gray-700/50">

// Primary Button
<button className="px-4 py-2 bg-gradient-to-r from-emerald-400 to-emerald-500 text-gray-900 font-semibold rounded-lg hover:from-emerald-300 hover:to-emerald-400 disabled:opacity-50">

// Secondary Button
<button className="px-4 py-2 border border-white/30 text-gray-100 rounded-lg hover:bg-white/5">

// Input
<input className="w-full px-3 py-2 border border-gray-700 rounded-lg bg-gray-800 text-gray-100 placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
```

## Rules

1. `'use client'` for stateful components
2. Props interface always defined
3. Dark mode classes on all elements
4. PascalCase filenames for components