# Feature: Parallel Generation Slots [COMPLETED]

## Overview
Enable multiple concurrent idea generations on the dashboard, each with its own configuration profile and live log viewer. The number of available slots is configurable in settings.

## Implementation Status: COMPLETE

All tasks completed:
- [x] Backend: Remove global mutex and add profileId support
- [x] Backend: Update ideaGenerationService to accept profileId
- [x] Backend: Update configService to load config by profileId
- [x] Frontend: Update API client with profileId parameter
- [x] Frontend: Create GenerationSlot component
- [x] Frontend: Create GenerationSettingsEditor component
- [x] Frontend: Update Dashboard with multi-slot support
- [x] Frontend: Update Settings page with Generation tab
- [x] Update documentation

## Current State Analysis

### Current Architecture
1. **Dashboard** (`frontend/app/dashboard/page.tsx`):
   - Single `isGenerating` state
   - Single logs array
   - Single polling mechanism for one session
   - One GenerationControls + LogsViewer

2. **GenerationControls** (`frontend/components/GenerationControls.tsx`):
   - Profile selector (can select any profile)
   - Manual generate button
   - Status indicator

3. **Backend** (`backend/src/api/controllers/generationController.ts`):
   - **Global mutex** (`let isGenerating = false`) - blocks concurrent generations
   - Uses active profile from ConfigService

4. **Settings Page** (`frontend/app/settings/page.tsx`):
   - Only has API Keys and AI Models tabs
   - No generation slot configuration

## Proposed Changes

### 1. Backend Changes

#### 1.1 Remove Global Mutex (generationController.ts)
- Remove the `isGenerating` global variable
- Allow concurrent generations (different profiles can generate simultaneously)
- Each generation is tracked by its own sessionId

#### 1.2 Add Profile Override to Generation
- Modify `/generate` endpoint to accept `profileId` parameter
- Pass profileId to ConfigService to load that profile's config instead of active profile

### 2. Frontend Changes

#### 2.1 New Component: GenerationSlot.tsx
A collapsible section containing:
- Header with:
  - Expand/collapse chevron
  - Slot number/name
  - Profile selector dropdown
  - Status indicator (idle/generating)
  - Delete button (disabled if generating)
- Collapsible body with:
  - GenerationControls (without profile selector - moved to header)
  - LogsViewer for this slot's logs

#### 2.2 Update Dashboard Page
- Replace single GenerationControls + LogsViewer with dynamic list of GenerationSlots
- Each slot maintains its own:
  - `isGenerating` state
  - `logs` array
  - `sessionId`
  - Selected `profileId`
  - Polling mechanism
- Load slot count from localStorage/settings

#### 2.3 New Settings Tab: Generation Settings
Add "Generation" tab to settings page with:
- Number of generation slots (1-10 slider or input)
- Save to localStorage
- Validation: Cannot reduce below number of currently running generations

#### 2.4 Update GenerationControls
- Make profile selector optional (controlled by prop)
- Accept `profileId` prop for which profile to use
- Pass `profileId` to API call

### 3. API Changes

#### 3.1 Generate Endpoint Update
```typescript
// POST /api/generate
{
  framework?: string;
  domain?: string;
  skipDuplicateCheck?: boolean;
  sessionId?: string;
  profileId?: string;  // NEW: Override active profile
}
```

### 4. State Management

Each slot will be an independent unit:
```typescript
interface GenerationSlot {
  id: number;
  profileId: string | null;
  isGenerating: boolean;
  logs: LogEntry[];
  sessionId: string | null;
  isCollapsed: boolean;
}
```

Dashboard will manage array of slots:
```typescript
const [slots, setSlots] = useState<GenerationSlot[]>([]);
const [maxSlots, setMaxSlots] = useState(3); // from localStorage
```

### 5. localStorage Keys
- `ideaforge_max_generation_slots`: number (default: 3)
- Slot state is ephemeral (not persisted)

## Implementation Order

1. **Backend: Remove mutex and add profileId support**
   - Update generationController.ts
   - Update ideaGenerationService.ts to accept profileId
   - Update configService.ts to load specific profile

2. **Frontend: Create GenerationSlot component**
   - New collapsible component
   - Integrate GenerationControls and LogsViewer
   - Independent state management

3. **Frontend: Update Dashboard**
   - Replace single controls with slot list
   - Multi-slot state management
   - Independent polling per slot

4. **Frontend: Add Settings tab**
   - Generation settings tab
   - Slot count configuration
   - Validation logic

5. **Frontend: API client update**
   - Add profileId to generateIdea method

## Files to Modify

### Backend
- `backend/src/api/controllers/generationController.ts` - Remove mutex, add profileId
- `backend/src/services/ideaGenerationService.ts` - Accept profileId parameter
- `backend/src/services/configService.ts` - Load config by profileId

### Frontend
- `frontend/components/GenerationSlot.tsx` - NEW
- `frontend/components/GenerationControls.tsx` - Make profile selector optional
- `frontend/components/settings/GenerationSettingsEditor.tsx` - NEW
- `frontend/app/dashboard/page.tsx` - Multi-slot logic
- `frontend/app/settings/page.tsx` - Add generation tab
- `frontend/lib/api.ts` - Add profileId to generateIdea

## Edge Cases

1. **Page refresh during generation**: Slots reset, but backend generation continues. Could show orphaned sessions.
2. **Reducing slot count**: Only allow if no generations running in slots being removed.
3. **Same profile in multiple slots**: Allow - user might want parallel generations with same config.
4. **API key limits**: Not handled here - backend will fail if rate limited.

## UI/UX Considerations

1. **Collapsed by default**: New slots start collapsed to save space
2. **Visual distinction**: Each slot could have subtle color coding or numbering
3. **Clear status**: Each slot shows its own status independently
4. **Responsive**: Stack slots vertically on mobile

## Questions to Resolve

1. Should slot configurations persist across page refreshes?
   - **Decision**: No, slots are ephemeral. Only maxSlots is persisted.

2. Maximum number of slots?
   - **Decision**: Cap at 10 to prevent abuse.

3. Should we limit concurrent generations per API key?
   - **Decision**: Leave to API provider rate limits for now.