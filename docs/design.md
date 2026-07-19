# Design Document: Rhythm Review

## Overview

Rhythm Review is a SvelteKit-based progressive web application that helps dancers practice and improve their skills through structured practice sessions. The application uses a modern tech stack including SvelteKit 2, Drizzle ORM with Neon PostgreSQL, Stack Auth for authentication, and TailwindCSS 4 with DaisyUI for styling.

The application follows a component-based architecture with clear separation between client and server logic, utilizing SvelteKit's server-side rendering capabilities and form actions for data mutations. Practice sessions are handled entirely on the frontend—only moves, patterns, and practice sets are persisted to the database.

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
│   │   │   └── Profile/
│   │   ├── stores/
│   │   │   └── practice-session.svelte.ts
│   │   └── utils/
│   │       └── practice-queue.ts
│   ├── server/
│   │   ├── db/
│   │   │   ├── index.ts
│   │   │   └── schema.ts
│   │   ├── services/
│   │   │   ├── moves.ts
│   │   │   ├── patterns.ts
│   │   │   └── practice-sets.ts
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
    │   └── profile/
    │       └── +page.svelte
    └── auth/ (existing)
```

### Route Protection

All routes under `(app)/` will be protected using a `+layout.server.ts` that checks authentication status via Stack Auth and redirects unauthenticated users to the login page.

## Components and Interfaces

### Database Schema

The database only persists moves, patterns, and practice sets. Practice sessions are handled entirely on the frontend and are not stored server-side.

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
	patternId: integer('pattern_id')
		.notNull()
		.references(() => patterns.id, { onDelete: 'cascade' }),
	moveId: integer('move_id')
		.notNull()
		.references(() => moves.id, { onDelete: 'cascade' }),
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
	practiceSetId: integer('practice_set_id')
		.notNull()
		.references(() => practiceSets.id, { onDelete: 'cascade' }),
	itemType: text('item_type').notNull(), // 'move' or 'pattern'
	itemId: integer('item_id').notNull() // references either moves.id or patterns.id
});
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

// Frontend-only practice session types
export interface PracticeQueueItem {
	itemType: 'move' | 'pattern';
	itemId: number;
	item: DanceMove | Pattern;
	successes: number;
	failures: number;
}
```

### Practice Queue Algorithm

Practice sessions are entirely frontend-driven. Instead of SM-2 spaced repetition, moves are selected using a **weighted random sampling** approach with a retry queue for failed items:

1. **Random Selection**: The next move/pattern is randomly sampled from the practice set items, weighted by a score derived from `failures / attempts` (items with more failures relative to successes are more likely to be selected).
2. **No Immediate Repeat**: The previously shown item is excluded from the next selection.
3. **Session Lifetime**: The session runs until the user manually ends it. No session data is persisted to the server.

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
- `getPracticeSetsByUser(userId)`: Get all practice sets for user
- `updatePracticeSet(id, userId, data)`: Update practice set
- `deletePracticeSet(id, userId)`: Delete practice set
- `searchPracticeSets(userId, query)`: Search practice sets

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

- Full-screen display with move/pattern name prominently shown
- Large thumbs up and thumbs down buttons positioned at the bottom for easy access while dancing
- Stop button (bottom left)
- Session state management using Svelte 5 runes (entirely client-side)
- Weighted random selection with retry queue for failed items

**Profile Component**

- Logout button

## Data Models

### Relationships

```
User (Stack Auth)
  ├── has many → Moves (private, per-user)
  ├── has many → Patterns (private, per-user)
  └── has many → Practice Sets (private, per-user)

Pattern
  └── has many → Pattern Moves (ordered)
        └── references → Move

Practice Set
  └── has many → Practice Set Items
        └── references → Move OR Pattern
```

### Data Flow

1. **Authentication**: Stack Auth manages user sessions via cookies
2. **Data Fetching**: SvelteKit load functions fetch data server-side
3. **Mutations**: Form actions handle creates/updates/deletes
4. **Practice Sessions**: Entirely client-side state management (no server persistence)

## Error Handling

### Client-Side Errors

- Form validation errors displayed inline
- Network errors shown via toast notifications
- Loading states for async operations

### Server-Side Errors

- Authentication errors → redirect to login
- Authorization errors → 403 page
- Not found errors → 404 page
- Database errors → logged and generic error message to user
- Validation errors → returned to form with details

## Testing Strategy

### Unit Tests

- Practice queue algorithm (weighted selection, retry queue)
- Utility functions (date formatting, etc.)
- Form validation logic
- Service layer functions

### Integration Tests

- Database operations with test database
- API endpoints with authentication
- Form submissions and data persistence

### Test Data

- Seed scripts for development database
- Factory functions for test data generation
- Isolated test database for integration tests

## Performance Considerations

1. **Database Queries**
   - Use Drizzle's query builder for optimized joins
   - Index on userId for all user-scoped queries
   - Pagination for large lists

2. **Client-Side Performance**
   - Virtual scrolling for large libraries
   - Debounced search inputs
   - Optimistic UI updates

3. **Caching Strategy**
   - SvelteKit's built-in caching for static assets
   - Client-side caching of practice set data during sessions

## Security Considerations

1. **Authentication & Authorization**
   - All API routes check user authentication via Stack Auth
   - **Row-level security via userId checks in ALL database queries**
   - **Every service function MUST include userId parameter and validate ownership**
   - **All database queries MUST filter by userId to prevent cross-user data access**
   - CSRF protection via SvelteKit's built-in mechanisms

2. **Data Validation**
   - Server-side validation for all inputs
   - SQL injection prevention via Drizzle's parameterized queries
   - XSS prevention via Svelte's automatic escaping
   - **User ownership validation on every data access operation**

3. **Privacy**
   - **User data strictly isolated by userId with no exceptions**
   - **All moves, patterns, and practice sets are private to the creating user**
   - **There are no sharing features—practice sets are scoped per user only**
   - Secure session management via httpOnly cookies
   - **URL parameter validation to prevent unauthorized access via direct links**

## Mobile Considerations

1. **Responsive Design**
   - Mobile-first approach with TailwindCSS
   - Touch-optimized UI elements with large button targets
   - Thumbs up/down buttons designed for easy access while dancing

2. **Progressive Web App**
   - Service worker for offline capability
   - App manifest for install prompt

3. **Performance**
   - Minimal JavaScript bundle size
   - Lazy loading of routes
   - Optimized images and assets
