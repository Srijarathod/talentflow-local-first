# TalentFlow - Local-First Hiring Platform

A modern, local-first React application for HR teams to manage jobs, candidates, and assessments with enterprise-grade UX patterns.

## 🚀 Quick Start

```bash
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to project directory
cd <FOLDER_IN>

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:8080`

## 📋 Features

### ✅ Implemented Features

#### Jobs Management
- **CRUD Operations**: Create, view, update, and archive jobs
- **Drag-and-Drop Reordering**: Organize jobs using @dnd-kit with optimistic updates
- **Tag-Based Filtering**: Filter jobs by tags with server-like pagination
- **Deep Linking**: Direct access to job details via `/jobs/:id`
- **Unique Slug Generation**: Auto-generated URL-friendly slugs from job titles

#### Candidates Management
- **Virtualized List**: Efficient rendering of 1000+ candidates using TanStack Virtual
- **Kanban Board View**: Drag-and-drop candidates between pipeline stages
- **Stage Filtering**: Server-like filtering by candidate stage
- **Candidate Profiles**: Detailed view with timeline and activity history
- **Notes with @mentions**: Add notes with team member mentions

#### Assessments
- **Assessment Builder**: Visual form builder with live preview
- **Question Types**: Single-choice, multi-choice, short-text, long-text, numeric, file-upload
- **Validation Rules**: Min/max for numeric, max length for text fields
- **Conditional Logic**: Show/hide questions based on previous answers
- **Section Management**: Organize questions into draggable sections

#### Technical Implementation
- **Local-First Architecture**: IndexedDB via Dexie.js as single source of truth
- **Optimistic Updates**: Instant UI feedback with automatic rollback on errors
- **API Simulation**: MSW with realistic latency (200-1200ms) and 7.5% error rate
- **Persistent State**: Data survives page refreshes via IndexedDB
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS

## 🏗️ Architecture

### Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **State Management**: 
  - TanStack Query (server state, mutations, optimistic updates)
  - Zustand (client/UI state)
- **Database**: Dexie.js (IndexedDB wrapper)
- **API Layer**: MSW (Mock Service Worker)
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **Drag & Drop**: @dnd-kit
- **Virtualization**: TanStack Virtual
- **Form Handling**: React Hook Form + Zod

### Data Flow

```
User Action → React Query Mutation → MSW Handler → Dexie (IndexedDB)
                     ↓ (Optimistic Update)
                UI Updates Instantly
                     ↓ (If Error)
                Automatic Rollback
```

### Key Design Decisions

#### 1. Local-First Architecture
**Why**: Eliminates network dependency, provides instant feedback, works offline
- All data stored in IndexedDB via Dexie
- MSW simulates backend API for realistic development
- On app refresh, state restored from IndexedDB

#### 2. Optimistic Updates
**Why**: Makes the app feel instantaneous despite simulated network latency
- UI updates immediately on user action
- Automatic rollback if API call fails
- Implemented for: job archiving, candidate stage changes, note additions

#### 3. Virtualization
**Why**: Maintains performance with 1000+ candidates
- Only renders visible items plus overscan buffer
- Smooth scrolling even with large datasets
- Uses TanStack Virtual for efficient DOM management

#### 4. MSW for API Simulation
**Why**: Realistic development environment without backend
- Simulates network latency (200-1200ms)
- 7.5% error rate on write operations
- Write-through to IndexedDB for persistence

## 📁 Project Structure

```
src/
├── components/
│   ├── candidates/         # Kanban board, notes section
│   ├── jobs/              # Job form dialog
│   ├── layout/            # Main layout with navigation
│   └── ui/                # shadcn/ui components
├── lib/
│   ├── api.ts            # API client functions
│   ├── db.ts             # Dexie database schema
│   ├── seed-data.ts      # Database seeding logic
│   └── utils.ts          # Utility functions
├── mocks/
│   ├── handlers.ts        # MSW request handlers
│   └── browser.ts         # MSW browser setup
├── pages/
│   ├── Index.tsx          # Dashboard
│   ├── JobsPage.tsx       # Jobs list with DnD
│   ├── JobDetailPage.tsx  # Single job view
│   ├── CandidatesPage.tsx # Candidates list/board
│   ├── CandidateDetailPage.tsx
│   ├── AssessmentsPage.tsx
│   └── AssessmentBuilderPage.tsx
├── stores/
│   └── uiStore.ts         # Zustand UI state
├── types/
│   └── index.ts           # TypeScript types
└── main.tsx               # App entry point
```

## 🎯 Key Technical Implementations

### 1. Optimistic Updates Pattern

```typescript
const archiveMutation = useMutation({
  mutationFn: async ({ id, status }) => {
    return jobsApi.update(id, { status });
  },
  onMutate: async ({ id }) => {
    // Cancel outgoing requests
    await queryClient.cancelQueries({ queryKey: ['jobs'] });
    
    // Snapshot current state
    const previousJobs = queryClient.getQueryData(['jobs', activeTab]);
    
    // Optimistically update UI
    queryClient.setQueryData(['jobs', activeTab], (old: any) => ({
      ...old,
      data: old?.data?.filter((job: Job) => job.id !== id) || [],
    }));
    
    return { previousJobs };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(['jobs', activeTab], context?.previousJobs);
  },
});
```

### 2. Drag-and-Drop with @dnd-kit

```typescript
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (over && active.id !== over.id) {
    // Optimistically reorder in UI
    const reordered = arrayMove(items, oldIndex, newIndex);
    queryClient.setQueryData(['jobs'], reordered);
    
    // Trigger backend sync
    reorderMutation.mutate({ fromOrder, toOrder });
  }
};
```

### 3. Virtualized Lists

```typescript
const virtualizer = useVirtualizer({
  count: candidates.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 80,      // Estimated item height
  overscan: 10,                 // Extra items to render
});
```

## 🗄️ Database Schema

### Tables
- **jobs**: Job postings (id, title, slug, status, tags, order, description, timestamps)
- **candidates**: Candidate profiles (id, name, email, stage, jobId, avatar, timestamps)
- **timeline**: Activity timeline (id, candidateId, type, content, fromStage, toStage, timestamp)
- **notes**: Candidate notes (id, candidateId, content, mentions, timestamp)
- **assessments**: Assessment forms (id, jobId, title, description, sections, timestamps)
- **assessmentResponses**: Submitted assessments (id, assessmentId, candidateId, answers, timestamps)

### Seed Data
- 25 jobs (mixed active/archived)
- 1,000 candidates randomly assigned to jobs/stages
- 3+ assessments with 10+ questions each

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Lint code with ESLint
```

### Adding New Features

1. **Define Types**: Add TypeScript interfaces to `src/types/index.ts`
2. **Update Schema**: Modify Dexie schema in `src/lib/db.ts`
3. **Create MSW Handlers**: Add API endpoints in `src/mocks/handlers.ts`
4. **Build UI**: Create components and pages
5. **Implement Mutations**: Use TanStack Query for data operations

## 📊 Performance Optimizations

- **Code Splitting**: React lazy loading for routes
- **Memoization**: useMemo/useCallback for expensive computations
- **Virtualization**: Only render visible items in large lists
- **Debouncing**: Search inputs debounced to reduce re-renders
- **Optimistic Updates**: Instant UI feedback without waiting for API

## 🎨 UI/UX Features

- **Responsive Design**: Works on mobile, tablet, and desktop
- **Dark Mode Support**: System preference detection
- **Loading States**: Skeleton screens and spinners
- **Error Handling**: User-friendly error messages with toast notifications
- **Accessibility**: Keyboard navigation and ARIA labels

## 🚧 Known Limitations

- File upload is simulated (no actual file storage)
- Assessment conditional logic is basic (show/hide only)
- No user authentication (single-user mode)
- Search is client-side only (could be optimized for larger datasets)

## 📝 Future Enhancements

- [ ] Advanced search with filters
- [ ] Bulk operations for candidates
- [ ] Email integration for candidate communication
- [ ] Calendar integration for interview scheduling
- [ ] Analytics dashboard with charts
- [ ] Export data to CSV/PDF
- [ ] Team collaboration features
- [ ] Real-time updates with WebSockets

## 🤝 Contributing

This is a technical assessment project. For production use:
1. Replace MSW with real backend API
2. Add authentication/authorization
3. Implement proper file storage
4. Add comprehensive testing
5. Set up CI/CD pipeline

## 📄 License

This project is for demonstration purposes.

## 🔗 Resources

- [React Documentation](https://react.dev)
- [TanStack Query](https://tanstack.com/query/latest)
- [Dexie.js](https://dexie.org)
- [shadcn/ui](https://ui.shadcn.com)
- [MSW Documentation](https://mswjs.io)
#   T a l e n t - F l o w - E n t n t  
 