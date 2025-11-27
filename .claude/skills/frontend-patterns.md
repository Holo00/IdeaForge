# Skill: Frontend Patterns

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript (strict)
- Tailwind CSS
- next-themes (dark mode)

## File Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Dashboard (/)
│   ├── config/
│   │   └── page.tsx       # Configuration (/config)
│   └── ideas/
│       ├── page.tsx       # Ideas list (/ideas)
│       └── [id]/
│           └── page.tsx   # Idea detail (/ideas/:id)
├── components/
│   ├── config/            # Config-specific components
│   ├── Navigation.tsx     # Shared navigation
│   └── *.tsx              # Shared components
├── contexts/
│   └── ConfigProfileContext.tsx
├── lib/
│   └── api.ts             # Backend API client
└── types/
    └── index.ts           # TypeScript types
```

## Component Patterns

### Basic Component

```tsx
'use client';

interface MyComponentProps {
  title: string;
  onClick?: () => void;
}

export default function MyComponent({ title, onClick }: MyComponentProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        {title}
      </h2>
      {onClick && (
        <button
          onClick={onClick}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Click me
        </button>
      )}
    </div>
  );
}
```

### Component with State and API

```tsx
'use client';

import { useState, useEffect } from 'react';

interface DataItem {
  id: string;
  name: string;
}

export default function DataList() {
  const [items, setItems] = useState<DataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5555/api/items');
      const data = await response.json();

      if (data.success) {
        setItems(data.data);
      } else {
        setError(data.error.message);
      }
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

## Dark Mode

### Required Classes

Always pair light and dark classes:

```tsx
// Backgrounds
className="bg-white dark:bg-gray-800"
className="bg-gray-50 dark:bg-gray-700"
className="bg-gray-100 dark:bg-gray-900"

// Text
className="text-gray-900 dark:text-gray-100"
className="text-gray-600 dark:text-gray-300"
className="text-gray-500 dark:text-gray-400"

// Borders
className="border-gray-200 dark:border-gray-700"

// Hover
className="hover:bg-gray-50 dark:hover:bg-gray-700"
```

### Theme Provider

Dark mode is managed by `next-themes` in `components/Providers.tsx`:

```tsx
import { ThemeProvider } from 'next-themes';

export function Providers({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system">
      {children}
    </ThemeProvider>
  );
}
```

## API Calls

### Using the API Client

```typescript
// frontend/lib/api.ts
const API_BASE = 'http://localhost:5555/api';

export async function fetchIdeas(params?: { status?: string }) {
  const query = new URLSearchParams(params as any).toString();
  const response = await fetch(`${API_BASE}/ideas?${query}`);
  return response.json();
}

export async function generateIdea(options?: { framework?: string }) {
  const response = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });
  return response.json();
}
```

### Response Handling

Always handle the `ApiResponse` format:

```tsx
const response = await fetchIdeas();

if (response.success) {
  setItems(response.data.ideas);
} else {
  setError(response.error.message);
}
```

## State Management

### Local State
Use `useState` for component-specific state.

### Context
Use React Context for shared state:

```tsx
// contexts/MyContext.tsx
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface MyContextType {
  value: string;
  setValue: (v: string) => void;
}

const MyContext = createContext<MyContextType | null>(null);

export function MyProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState('');
  return (
    <MyContext.Provider value={{ value, setValue }}>
      {children}
    </MyContext.Provider>
  );
}

export function useMyContext() {
  const context = useContext(MyContext);
  if (!context) throw new Error('useMyContext must be used within MyProvider');
  return context;
}
```

## SSE (Server-Sent Events)

Used for real-time generation logs:

```tsx
useEffect(() => {
  const eventSource = new EventSource(
    `http://localhost:5555/api/logs/stream/${sessionId}`
  );

  eventSource.onmessage = (event) => {
    const log = JSON.parse(event.data);
    setLogs(prev => [...prev, log]);
  };

  eventSource.onerror = () => {
    eventSource.close();
  };

  return () => eventSource.close();
}, [sessionId]);
```

## Common Tailwind Patterns

### Card
```tsx
<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
```

### Button Primary
```tsx
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
```

### Button Secondary
```tsx
<button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
```

### Input
```tsx
<input className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
```

### Badge
```tsx
<span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
```