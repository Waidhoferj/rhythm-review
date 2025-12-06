# Design Document: Rhythm Review

## Overview

Rhythm Review is a SvelteKit-based progressive web application that helps dancers practice and improve their skills through spaced repetition learning. The application uses a modern tech stack including SvelteKit 2, Drizzle ORM with Neon PostgreSQL, Stack Auth for authentication, TailwindCSS 4 with DaisyUI for styling, and implements the SM-2 spaced repetition algorithm for intelligent practice suggestions.

The application follows a component-based architecture with clear separation between client and server logic, utilizing SvelteKit's server-side rendering capabilities and form actions for data mutations.

## Architecture

### Technology Stack

- **Frontend Framework**: SvelteKit 2 with Svelte 5
- **Styling**: TailwindCSS 4 + DaisyUI
- **Database**: Neon PostgreSQL (serverless)
- **ORM**: Drizzle ORM
- **Authentication**: Stack Auth
- **Deployment**: Vercel
- **Testing**: Vitest with Playwright

### Application Structure

```
src/
├── lib/
│   ├── client/
│   │   ├── stack.ts (auth client)
│   │   ├── components/
│   │   │   ├── DanceLibrary/
│   │   │   ├── MoveForm/
│   │   │   ├── PatternForm/
│   │   │   ├── PracticeSetForm/
│   │   │   ├── PracticeView/
│   │   │   ├── PracticeLog/
│   │   │   └── Profile/
│   │   ├── stores/
│   │   │   └── practice-session.svelte.ts
│   │   └── utils/
│   │       └── sm2-algorithm.ts
│   ├── server/
│   │   ├── db/
│   │   │   ├── index.ts
│   │   │   └── schema.ts
│   │   ├── services/
│   │   │   ├── moves.ts
│   │   │   ├── patterns.ts
│   │   │   ├── practice-sets.ts
│   │   │   ├── practice-sessions.ts
│   │   │   └── sm2-service.ts
│   │   └── auth.ts
│   └── types/
│       └── index.ts
└── routes/
    ├── (app)/
    │   ├── library/
    │   │   └── +page.svelte
    │   ├── moves/
    │   │   ├── new/
    │   │   │   └── +page.svelte
    │   │   └── [id]/
    │   │       ├── +page.svelte
    │   │       ├── +page.server.ts
    │   │       └── edit/
    │   │           └── +page.svelte
    │   ├── patterns/
    │   │   ├── new/
    │   │   │   └── +page.svelte
    │   │   └── [id]/
    │   │       ├── +page.svelte
    │   │       ├── +page.server.ts
    │   │       └── edit/
    │   │           └── +page.svelte
    │   ├── practice-sets/
    │   │   ├── new/
    │   │   │   └── +page.svelte
    │   │   └── [id]/
    │   │       ├── +page.svelte
    │   │       ├── +page.server.ts
    │   │       └── practice/
    │   │           └── +page.svelte
    │   ├── logs/
    │   │   ├── +page.svelte
    │   │   └── [id]/
    │   │       └── +page.svelte
    │   └── profile/
    │       └── +page.svelte
    └── auth/ (existing)
```

### Route Protection

All routes under `(app)/` will be protected using a `+layout.server.ts` that checks authentication status via Stack Auth and redirects unauthenticated users to the login page.

## Components and Interfaces

### Database Schema

```typescript
// Dance Moves Table
export const moves = pgTable('moves', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  counts: integer('counts').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Patterns Table
export const patterns = pgTable('patterns', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Pattern Moves Junction Table (for ordering)
export const patternMoves = pgTable('pattern_moves', {
  id: serial('id').primaryKey(),
  patternId: integer('pattern_id').notNull().references(() => patterns.id, { onDelete: 'cascade' }),
  moveId: integer('move_id').notNull().references(() => moves.id, { onDelete: 'cascade' }),
  sequenceOrder: integer('sequence_order').notNull()
});

// Practice Sets Table
export const practiceSets = pgTable('practice_sets', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  icon: text('icon'),
  tags: text('tags').array(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Practice Set Items Junction Table
export const practiceSetItems = pgTable('practice_set_items', {
  id: serial('id').primaryKey(),
  practiceSetId: integer('practice_set_id').notNull().references(() => practiceSets.id, { onDelete: 'cascade' }),
  itemType: text('item_type').notNull(), // 'move' or 'pattern'
  itemId: integer('item_id').notNull() // references either moves.id or patterns.id
});

// Practice Sessions Table
export const practiceSessions = pgTable('practice_sessions', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  practiceSetId: integer('practice_set_id').notNull().references(() => practiceSets.id),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  duration: integer('duration'), // in seconds
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Practice Executions Table (individual move/pattern attempts)
export const practiceExecutions = pgTable('practice_executions', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').notNull().references(() => practiceSessions.id, { onDelete: 'cascade' }),
  itemType: text('item_type').notNull(), // 'move' or 'pattern'
  itemId: integer('item_id').notNull(),
  success: boolean('success').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// SM-2 Performance Tracking Table
export const sm2Performance = pgTable('sm2_performance', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  itemType: text('item_type').notNull(),
  itemId: integer('item_id').notNull(),
  easinessFactor: real('easiness_factor').notNull().default(2.5),
  repetitions: integer('repetitions').notNull().default(0),
  interval: integer('interval').notNull().default(0),
  nextReviewDate: timestamp('next_review_date').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Composite unique constraint for SM-2 tracking
export const sm2PerformanceRelations = relations(sm2Performance, ({ one }) => ({
  // Unique per user, item type, and item ID
}));
```

### TypeScript Interfaces

```typescript
// Core Types
export interface DanceMove {
  id: number;
  userId: string;
  name: string;
  description?: string;
  counts: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Pattern {
  id: number;
  userId: string;
  name: string;
  description?: string;
  moves: PatternMove[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PatternMove {
  id: number;
  patternId: number;
  moveId: number;
  sequenceOrder: number;
  move: DanceMove;
}

export interface PracticeSet {
  id: number;
  userId: string;
  name: string;
  description?: string;
  icon?: string;
  tags: string[];
  items: PracticeSetItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PracticeSetItem {
  id: number;
  practiceSetId: number;
  itemType: 'move' | 'pattern';
  itemId: number;
  item: DanceMove | Pattern;
}

export interface PracticeSession {
  id: number;
  userId: string;
  practiceSetId: number;
  practiceSet: PracticeSet;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  notes?: string;
  executions: PracticeExecution[];
  createdAt: Date;
}

export interface PracticeExecution {
  id: number;
  sessionId: number;
  itemType: 'move' | 'pattern';
  itemId: number;
  success: boolean;
  timestamp: Date;
  item: DanceMove | Pattern;
}

export interface SM2PerformanceData {
  id: number;
  userId: string;
  itemType: 'move' | 'pattern';
  itemId: number;
  easinessFactor: number;
  repetitions: number;
  interval: number;
  nextReviewDate: Date;
  updatedAt: Date;
}

// Practice Session Statistics
export interface SessionStatistics {
  duration: number;
  totalExecutions: number;
  successfulExecutions: number;
  successRate: number;
  bestMoves: Array<{ item: DanceMove | Pattern; successRate: number }>;
  worstMoves: Array<{ item: DanceMove | Pattern; successRate: number }>;
}

// Overall User Statistics
export interface UserStatistics {
  totalSessions: number;
  totalPracticeTime: number;
  overallSuccessRate: number;
  mostPracticedMoves: Array<{ item: DanceMove | Pattern; count: number }>;
  recentSessions: PracticeSession[];
}
```

### SM-2 Spaced Repetition Algorithm

The SM-2 algorithm will be implemented to intelligently suggest the next move/pattern during practice sessions based on:

1. **Easiness Factor (EF)**: Starts at 2.5, adjusted based on performance
2. **Repetitions**: Number of consecutive successful reviews
3. **Interval**: Days until next review (converted to priority score for session)
4. **Next Review Date**: When the item should be reviewed next

**Algorithm Implementation**:

```typescript
interface SM2Result {
  easinessFactor: number;
  repetitions: number;
  interval: number;
  nextReviewDate: Date;
}

function calculateSM2(
  currentData: SM2PerformanceData,
  quality: number // 0-5 scale (0 = complete failure, 5 = perfect)
): SM2Result {
  let { easinessFactor, repetitions, interval } = currentData;
  
  // Update easiness factor
  easinessFactor = Math.max(
    1.3,
    easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );
  
  // Update repetitions and interval
  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * easinessFactor);
    }
  }
  
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);
  
  return { easinessFactor, repetitions, interval, nextReviewDate };
}

// Convert swipe result to quality score
function swipeToQuality(success: boolean): number {
  return success ? 4 : 2; // Right swipe = 4, Left swipe = 2
}

// Select next item for practice
function selectNextItem(
  availableItems: Array<{ item: DanceMove | Pattern; sm2Data: SM2PerformanceData }>,
  currentTime: Date
): DanceMove | Pattern {
  // Calculate priority scores (items due for review get higher priority)
  const scoredItems = availableItems.map(({ item, sm2Data }) => {
    const daysSinceReview = Math.floor(
      (currentTime.getTime() - sm2Data.nextReviewDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const priority = daysSinceReview > 0 ? daysSinceReview * (3 - sm2Data.easinessFactor) : 0;
    return { item, priority };
  });
  
  // Sort by priority (highest first) and add randomization
  scoredItems.sort((a, b) => b.priority - a.priority);
  
  // Select from top 3 items randomly to add variety
  const topItems = scoredItems.slice(0, Math.min(3, scoredItems.length));
  const selectedIndex = Math.floor(Math.random() * topItems.length);
  
  return topItems[selectedIndex].item;
}
```

### Server Services

**moves.ts**
- `createMove(userId, data)`: Create a new dance move
- `getMove(id, userId)`: Get move by ID with auth check
- `getMovesByUser(userId)`: Get all moves for a user
- `updateMove(id, userId, data)`: Update move with auth check
- `deleteMove(id, userId)`: Delete move with auth check
- `searchMoves(userId, query)`: Search moves by name/description

**patterns.ts**
- `createPattern(userId, data)`: Create pattern with move sequence
- `getPattern(id, userId)`: Get pattern with moves
- `getPatternsByUser(userId)`: Get all patterns for user
- `updatePattern(id, userId, data)`: Update pattern and sequence
- `deletePattern(id, userId)`: Delete pattern
- `searchPatterns(userId, query)`: Search patterns

**practice-sets.ts**
- `createPracticeSet(userId, data)`: Create practice set with items
- `getPracticeSet(id, userId)`: Get practice set with all items
- `getPracticeSetsByUser(userId)`: Get all practice sets
- `updatePracticeSet(id, userId, data)`: Update practice set
- `deletePracticeSet(id, userId)`: Delete practice set
- `searchPracticeSets(userId, query)`: Search practice sets

**practice-sessions.ts**
- `startSession(userId, practiceSetId)`: Create new session
- `recordExecution(sessionId, itemType, itemId, success)`: Record move execution
- `endSession(sessionId)`: End session and calculate stats
- `getSession(id, userId)`: Get session with executions
- `getSessionsByUser(userId)`: Get all user sessions
- `updateSessionNotes(sessionId, userId, notes)`: Add notes to session
- `calculateSessionStats(sessionId)`: Calculate session statistics

**sm2-service.ts**
- `initializeSM2Data(userId, itemType, itemId)`: Create initial SM-2 record
- `getSM2Data(userId, itemType, itemId)`: Get current SM-2 data
- `updateSM2Data(userId, itemType, itemId, quality)`: Update after execution
- `getNextItem(userId, practiceSetId)`: Select next item using SM-2

### Client Components

**DanceLibrary Component**
- Search bar with real-time filtering
- Sectioned list (Practice Sets, Patterns, Moves)
- Floating action button (FAB) with creation popup
- Item cards with click handlers

**MoveForm Component**
- Form fields: name (required), description (optional), counts (required number)
- Validation and error display
- Submit handler with SvelteKit form actions

**PatternForm Component**
- Form fields: name, description
- Move selector with search/filter
- Drag-and-drop reordering of selected moves
- Visual sequence display
- Submit handler

**PracticeSetForm Component**
- Form fields: name, description, icon selector, tags input
- Multi-select for moves and patterns
- Visual display of selected items
- Submit handler

**PracticeView Component**
- Full-screen card display with move/pattern name
- Swipe gesture detection (left/right)
- Stop button (bottom left)
- Session state management using Svelte 5 runes
- Real-time SM-2 integration for next item selection

**PracticeLog Component**
- Session list with date, duration, practice set
- Detailed view with statistics
- Best/worst moves calculation
- Notes editor
- Visual charts for success rates

**Profile Component**
- User statistics dashboard
- Training log access
- Logout button

## Data Models

### Relationships

```
User (Stack Auth)
  ├── has many → Moves
  ├── has many → Patterns
  ├── has many → Practice Sets
  ├── has many → Practice Sessions
  └── has many → SM2 Performance Records

Pattern
  └── has many → Pattern Moves (ordered)
        └── references → Move

Practice Set
  └── has many → Practice Set Items
        └── references → Move OR Pattern

Practice Session
  ├── belongs to → Practice Set
  └── has many → Practice Executions
        └── references → Move OR Pattern

SM2 Performance
  └── references → Move OR Pattern (polymorphic)
```

### Data Flow

1. **Authentication**: Stack Auth manages user sessions via cookies
2. **Data Fetching**: SvelteKit load functions fetch data server-side
3. **Mutations**: Form actions handle creates/updates/deletes
4. **Practice Sessions**: Client-side state management with periodic server sync
5. **SM-2 Updates**: Server-side calculation after each execution

## Error Handling

### Client-Side Errors
- Form validation errors displayed inline
- Network errors shown via toast notifications
- Graceful degradation for offline scenarios
- Loading states for async operations

### Server-Side Errors
- Authentication errors → redirect to login
- Authorization errors → 403 page
- Not found errors → 404 page
- Database errors → logged and generic error message to user
- Validation errors → returned to form with details

### Practice Session Error Handling
- Session state persisted to localStorage as backup
- Automatic recovery on page reload
- Graceful handling of network interruptions during practice
- Ability to resume interrupted sessions

## Testing Strategy

### Unit Tests
- SM-2 algorithm calculations
- Utility functions (date formatting, statistics calculations)
- Form validation logic
- Service layer functions

### Integration Tests
- Database operations with test database
- API endpoints with authentication
- Form submissions and data persistence
- SM-2 data updates during practice sessions

### Test Data
- Seed scripts for development database
- Factory functions for test data generation
- Isolated test database for integration tests

## Performance Considerations

1. **Database Queries**
   - Use Drizzle's query builder for optimized joins
   - Index on userId for all user-scoped queries
   - Index on practiceSetId for session queries
   - Pagination for large lists

2. **Client-Side Performance**
   - Lazy load practice session history
   - Virtual scrolling for large libraries
   - Debounced search inputs
   - Optimistic UI updates

3. **Caching Strategy**
   - SvelteKit's built-in caching for static assets
   - Server-side caching of user statistics
   - Client-side caching of practice set data during sessions

## Security Considerations

1. **Authentication & Authorization**
   - All API routes check user authentication via Stack Auth
   - Row-level security via userId checks in queries
   - CSRF protection via SvelteKit's built-in mechanisms

2. **Data Validation**
   - Server-side validation for all inputs
   - SQL injection prevention via Drizzle's parameterized queries
   - XSS prevention via Svelte's automatic escaping

3. **Privacy**
   - User data isolated by userId
   - No sharing features (private by default)
   - Secure session management via httpOnly cookies

## Mobile Considerations

1. **Responsive Design**
   - Mobile-first approach with TailwindCSS
   - Touch-optimized UI elements
   - Swipe gestures for practice view

2. **Progressive Web App**
   - Service worker for offline capability
   - App manifest for install prompt
   - Local storage for session persistence

3. **Performance**
   - Minimal JavaScript bundle size
   - Lazy loading of routes
   - Optimized images and assets
