# TalentFlow Implementation Guide

## 🎯 Project Overview

TalentFlow is a modern, local-first HR hiring platform built with React, TypeScript, and cutting-edge frontend architecture patterns. The application demonstrates advanced concepts like optimistic updates, virtualized rendering, and simulated network conditions.

## ✅ Implemented Features

### Core Architecture

#### 1. Local-First Data Layer
- ✅ **IndexedDB with Dexie.js** - Browser database as single source of truth
- ✅ **Automatic seeding** - 25 jobs, 1000 candidates, 3 assessments on first load
- ✅ **Persistence** - All data survives browser refresh
- ✅ **Schema versioning** - Structured database with relationships

#### 2. API Simulation Layer
- ✅ **MSW (Mock Service Worker)** - Realistic API simulation
- ✅ **Artificial latency** - 200-1200ms delays on all requests
- ✅ **Error simulation** - 7.5% failure rate on write operations
- ✅ **Write-through to IndexedDB** - All mutations update local database

#### 3. State Management
- ✅ **TanStack Query** - Server state with caching and optimistic updates
- ✅ **Zustand** - Client/UI state (modals, filters)
- ✅ **Optimistic updates** - Immediate UI feedback with rollback on error

#### 4. Design System
- ✅ **Professional theme** - Deep indigo primary, purple accents
- ✅ **Semantic tokens** - All colors defined in design system
- ✅ **Status-based colors** - Dedicated colors for each candidate stage
- ✅ **Dark mode support** - Full theme implementation
- ✅ **Custom scrollbars** - Polished UI details
- ✅ **Transitions & animations** - Smooth, performant interactions

### Feature Implementation

#### Dashboard (✅ Complete)
- Real-time statistics from IndexedDB
- Quick action shortcuts
- Recent activity feed
- Responsive grid layout

#### Jobs Management (✅ Core Complete)
- ✅ List view with server-like pagination
- ✅ Filter by status (active/archived)
- ✅ Client-side search by title and tags
- ✅ Archive/restore with optimistic updates
- ✅ Error handling with user-friendly toasts
- ⏳ Create/Edit modal (planned)
- ⏳ Drag-and-drop reordering (planned)
- ⏳ Deep linking to /jobs/:jobId (planned)

#### Candidates Management (✅ Core Complete)
- ✅ **Virtualized list** - Handles 1000+ candidates smoothly
- ✅ Client-side search by name/email
- ✅ Filter by stage with tabs
- ✅ Individual candidate detail pages
- ✅ Timeline of status changes
- ✅ Stage progression with optimistic updates
- ✅ Avatar display with fallbacks
- ⏳ Kanban board view (planned)
- ⏳ Notes with @mentions (planned)
- ⏳ Drag-and-drop between stages (planned)

#### Assessments (✅ Core Complete)
- ✅ List by job with section/question counts
- ✅ Display existing assessments from seed data
- ⏳ Assessment builder UI (planned)
- ⏳ Live preview pane (planned)
- ⏳ Question type support (planned)
- ⏳ Conditional logic (planned)
- ⏳ Validation rules (planned)

## 🏗️ Architecture Patterns

### Optimistic Updates Pattern
```typescript
const mutation = useMutation({
  mutationFn: async (data) => api.update(data),
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['resource'] });
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(['resource']);
    
    // Optimistically update cache
    queryClient.setQueryData(['resource'], newData);
    
    return { previous };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(['resource'], context?.previous);
    toast({ title: 'Error', description: 'Operation failed' });
  },
  onSuccess: () => {
    // Invalidate and refetch
    queryClient.invalidateQueries({ queryKey: ['resource'] });
  },
});
```

### Virtualized Rendering
```typescript
const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 80,
  overscan: 10, // Render extra items for smooth scrolling
});
```

### MSW Handler Pattern
```typescript
http.patch('/api/resource/:id', async ({ params, request }) => {
  await simulateLatency(); // 200-1200ms
  
  if (shouldSimulateError()) { // 7.5% chance
    return HttpResponse.json(
      { error: 'Operation failed' },
      { status: 500 }
    );
  }
  
  // Update IndexedDB
  const data = await request.json();
  await db.resource.update(params.id, data);
  
  return HttpResponse.json({ data });
});
```

## 📂 Project Structure

```
src/
├── components/
│   ├── layout/          # MainLayout with navigation
│   └── ui/              # shadcn components
├── features/            # (planned) Feature-based modules
├── lib/
│   ├── api.ts          # API client functions
│   ├── db.ts           # Dexie database setup
│   ├── seed-data.ts    # Seed data generation
│   └── utils.ts        # Utility functions
├── mocks/
│   ├── handlers.ts     # MSW request handlers
│   └── browser.ts      # MSW worker setup
├── pages/              # Route pages
│   ├── Index.tsx       # Dashboard
│   ├── JobsPage.tsx    # Jobs list
│   ├── CandidatesPage.tsx
│   ├── CandidateDetailPage.tsx
│   ├── AssessmentsPage.tsx
│   └── NotFound.tsx
├── stores/
│   └── uiStore.ts      # Zustand UI state
├── types/
│   └── index.ts        # TypeScript definitions
├── App.tsx             # App setup with providers
├── main.tsx            # Entry point with MSW init
└── index.css           # Design system tokens
```

## 🚀 Getting Started

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

The app will:
1. Start MSW worker for API simulation
2. Initialize IndexedDB database
3. Seed with 1000+ records if empty
4. Start on http://localhost:8080

### First Run Experience
On first load, you'll see:
- Console: "🌱 Seeding database..."
- Data generation takes ~2-3 seconds
- Automatic redirect to dashboard
- All features immediately available

## 🔧 Technology Stack

### Core
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server

### Data & State
- **Dexie.js** - IndexedDB wrapper
- **TanStack Query** - Server state management
- **Zustand** - Client state management
- **MSW** - API mocking

### UI & Styling
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - Component library
- **Radix UI** - Headless components
- **Lucide React** - Icon library

### Performance
- **@tanstack/react-virtual** - Virtualized lists
- **@dnd-kit** - Drag and drop (installed)

### Utilities
- **date-fns** - Date formatting
- **@faker-js/faker** - Seed data generation
- **zod** - Schema validation

## 📊 Data Model

### Jobs
- Unique slugs for URL-friendly identifiers
- Status: active | archived
- Ordered list for custom sorting
- Tags for categorization

### Candidates
- Linked to jobs via jobId
- Stage progression tracking
- Timeline of all status changes
- Avatar URLs with fallbacks

### Assessments
- Job-specific questionnaires
- Multiple sections per assessment
- Various question types
- Validation rules and conditional logic

### Timeline Events
- Audit trail for all candidate changes
- Stage transitions with from/to
- Notes and mentions
- System-generated events

## 🎨 Design Decisions

### Why Local-First?
- **Zero backend complexity** - No server setup required
- **Instant performance** - No network roundtrips for reads
- **Offline-first** - Works without internet
- **Privacy** - Data never leaves the browser
- **Cost** - Zero infrastructure costs

### Why Optimistic Updates?
- **Perceived performance** - UI feels instant
- **Better UX** - No loading spinners on every action
- **Resilience** - Graceful error handling with rollback
- **Professional feel** - Matches production-grade apps

### Why Virtualization?
- **Performance** - Renders 1000+ items smoothly
- **Memory efficiency** - Only renders visible items
- **Scalability** - Handles arbitrarily large lists
- **User experience** - No lag or jank

## 🐛 Known Limitations

1. **Browser storage limits** - IndexedDB quota varies by browser
2. **No cross-device sync** - Data is local to browser
3. **No collaborative editing** - Single-user experience
4. **Mock API limitations** - Not a real backend

## 🔮 Next Steps

### High Priority
1. ✅ Job creation modal with validation
2. ✅ Drag-and-drop job reordering
3. ✅ Candidate Kanban board
4. ✅ Assessment builder interface
5. ✅ Notes with @mentions

### Medium Priority
6. Deep linking support
7. Export/import functionality
8. Advanced filtering
9. Bulk operations
10. Keyboard shortcuts

### Nice to Have
11. Analytics dashboard
12. Email templates
13. Interview scheduling
14. Document attachments
15. Custom fields

## 📝 Development Notes

### Adding New Features
1. Define types in `src/types/index.ts`
2. Add database table to `src/lib/db.ts`
3. Create MSW handlers in `src/mocks/handlers.ts`
4. Build UI components
5. Integrate with TanStack Query
6. Add optimistic updates
7. Test error scenarios

### Testing Optimistic Updates
1. Open Network tab in DevTools
2. Throttle to "Slow 3G"
3. Perform actions (archive job, move candidate)
4. Observe immediate UI updates
5. Watch network requests complete
6. Test error handling by triggering 7.5% errors

### Debugging
- Check console for IndexedDB operations
- Use React Query DevTools (can be added)
- Monitor MSW requests in Network tab
- Inspect Dexie database in Application tab

## 🎓 Learning Resources

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Dexie.js Guide](https://dexie.org/docs/Tutorial/React)
- [MSW Documentation](https://mswjs.io/docs/)
- [Zustand Guide](https://docs.pmnd.rs/zustand/getting-started/introduction)

## 📄 License

This is a technical demonstration project. All code is provided as-is for educational purposes.
