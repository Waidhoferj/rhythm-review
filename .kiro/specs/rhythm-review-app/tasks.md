# Implementation Plan

- [x] 1. Set up database schema and types
  - Create comprehensive database schema in `src/lib/server/db/schema.ts` with all tables: moves, patterns, patternMoves, practiceSets, practiceSetItems, practiceSessions, practiceExecutions, and sm2Performance
  - Define Drizzle relations between tables for proper joins
  - Create TypeScript interfaces in `src/lib/types/index.ts` for all data models
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 5.2, 6.2, 6.3_

- [x] 2. Implement server-side services for data operations
  - [x] 2.1 Create moves service (`src/lib/server/services/moves.ts`)
    - Implement CRUD operations: createMove, getMove, getMovesByUser, updateMove, deleteMove
    - Implement searchMoves function with query filtering
    - Add userId authorization checks for all operations
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [x] 2.2 Create patterns service (`src/lib/server/services/patterns.ts`)
    - Implement CRUD operations with move sequence handling
    - Implement pattern-move relationship management with ordering
    - Add search functionality for patterns
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  
  - [x] 2.3 Create practice sets service (`src/lib/server/services/practice-sets.ts`)
    - Implement CRUD operations for practice sets
    - Handle practice set items (moves and patterns) with polymorphic relationships
    - Implement tag management and filtering
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [x] 2.4 Create SM-2 algorithm utility (`src/lib/utils/sm2-algorithm.ts`)
    - Implement SM-2 calculation function with easiness factor, repetitions, and interval
    - Create swipeToQuality conversion function
    - Implement selectNextItem function with priority scoring
    - _Requirements: 5.6_
  
  - [x] 2.5 Create SM-2 service (`src/lib/server/services/sm2-service.ts`)
    - Implement initializeSM2Data for new items
    - Implement getSM2Data and updateSM2Data functions
    - Implement getNextItem function integrating SM-2 algorithm with practice set items
    - _Requirements: 5.6_
  
  - [x] 2.6 Create practice sessions service (`src/lib/server/services/practice-sessions.ts`)
    - Implement startSession, recordExecution, and endSession functions
    - Implement session statistics calculation (duration, success rate, best/worst moves)
    - Implement getSession, getSessionsByUser, and updateSessionNotes functions
    - _Requirements: 5.1, 5.2, 5.7, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4_

- [ ] 3. Set up authentication and route protection
  - Create auth utility in `src/lib/server/auth.ts` to get current user from Stack Auth
  - Create protected route layout at `src/routes/(app)/+layout.server.ts` with authentication check
  - Implement redirect to login for unauthenticated users
  - _Requirements: 9.1, 9.3, 9.4_

- [x] 4. Implement Dance Library page
  - [x] 4.1 Create library page route (`src/routes/(app)/library/+page.svelte` and `+page.server.ts`)
    - Implement server load function to fetch all moves, patterns, and practice sets
    - Create search functionality with query parameter
    - Set library as default route after login
    - _Requirements: 4.1, 4.2, 4.4_
  
  - [x] 4.2 Build DanceLibrary component
    - Create search bar with real-time filtering
    - Implement sectioned display (Practice Sets, Patterns, Moves)
    - Add floating action button with creation popup (move/pattern/practice set options)
    - Implement click handlers for navigation to detail pages
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [x] 5. Implement dance move management
  - [x] 5.1 Create new move page (`src/routes/(app)/moves/new/+page.svelte`)
    - Build form with fields: name, description, counts
    - Implement form validation
    - Create form action for move creation
    - Redirect to library on success
    - _Requirements: 1.1, 1.2_
  
  - [x] 5.2 Create move detail page (`src/routes/(app)/moves/[id]/+page.svelte` and `+page.server.ts`)
    - Implement server load function to fetch move by ID
    - Display move details (name, description, counts)
    - Add edit button linking to edit page
    - Add delete action with confirmation
    - _Requirements: 1.3_
  
  - [x] 5.3 Create move edit page (`src/routes/(app)/moves/[id]/edit/+page.svelte`)
    - Pre-populate form with existing move data
    - Implement update form action
    - Redirect to detail page on success
    - _Requirements: 1.4, 1.5_

- [ ] 6. Implement pattern management
  - [ ] 6.1 Create new pattern page (`src/routes/(app)/patterns/new/+page.svelte`)
    - Build form with name and description fields
    - Implement move selector with search/filter from user's moves
    - Add drag-and-drop functionality for move reordering
    - Display selected moves in sequence order
    - Create form action for pattern creation with move sequence
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [ ] 6.2 Create pattern detail page (`src/routes/(app)/patterns/[id]/+page.svelte` and `+page.server.ts`)
    - Implement server load function to fetch pattern with moves
    - Display pattern details and ordered move list
    - Add edit button and delete action
    - _Requirements: 2.5_
  
  - [ ] 6.3 Create pattern edit page (`src/routes/(app)/patterns/[id]/edit/+page.svelte`)
    - Pre-populate form with existing pattern data and move sequence
    - Allow modification of move sequence with drag-and-drop
    - Implement update form action
    - _Requirements: 2.6_

- [ ] 7. Implement practice set management
  - [ ] 7.1 Create new practice set page (`src/routes/(app)/practice-sets/new/+page.svelte`)
    - Build form with name, description, icon selector, and tags input
    - Implement multi-select for moves and patterns
    - Display selected items visually
    - Create form action for practice set creation
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [ ] 7.2 Create practice set detail page (`src/routes/(app)/practice-sets/[id]/+page.svelte` and `+page.server.ts`)
    - Implement server load function to fetch practice set with all items
    - Display practice set metadata (name, description, tags, icon)
    - Show list of included moves and patterns
    - Add "Practice" button linking to practice session
    - Add edit and delete functionality
    - _Requirements: 3.4, 3.5_

- [ ] 8. Implement practice session functionality
  - [ ] 8.1 Create practice session page (`src/routes/(app)/practice-sets/[id]/practice/+page.svelte`)
    - Implement session start on page load with server action
    - Create full-screen card display showing current move/pattern name
    - Add stop button in lower left corner
    - _Requirements: 5.1, 5.2, 5.3, 5.7_
  
  - [ ] 8.2 Implement swipe gesture detection
    - Add touch event listeners for swipe left/right
    - Implement swipe animation for card dismissal
    - Record execution result (success/failure) on swipe
    - Fetch and display next move after swipe
    - _Requirements: 5.4, 5.5_
  
  - [ ] 8.3 Integrate SM-2 algorithm for move selection
    - Call SM-2 service to get next item after each execution
    - Update SM-2 data based on swipe result
    - Handle initialization of SM-2 data for new items
    - _Requirements: 5.6_
  
  - [ ] 8.4 Implement session end and summary
    - Create end session action when stop button clicked
    - Calculate session statistics (duration, success rate)
    - Display congratulatory screen with statistics
    - Redirect to session log detail page
    - _Requirements: 5.7, 6.1, 6.4, 6.5_
  
  - [ ] 8.5 Add session state persistence
    - Implement localStorage backup of session state
    - Add recovery mechanism for interrupted sessions
    - Handle network errors gracefully during practice
    - _Requirements: 5.2, 6.2, 6.3_

- [ ] 9. Implement practice log viewing
  - [ ] 9.1 Create practice logs list page (`src/routes/(app)/logs/+page.svelte` and `+page.server.ts`)
    - Implement server load function to fetch all user sessions
    - Display sessions ordered by date
    - Show summary info: date, duration, practice set name
    - Add click handler to navigate to detail view
    - _Requirements: 7.1_
  
  - [ ] 9.2 Create practice log detail page (`src/routes/(app)/logs/[id]/+page.svelte` and `+page.server.ts`)
    - Implement server load function to fetch session with executions
    - Display detailed statistics: date, duration, practice set, success rate
    - Calculate and display best executed moves (highest success rate)
    - Calculate and display worst executed moves (lowest success rate)
    - Implement notes editor with save functionality
    - _Requirements: 7.2, 7.3, 7.4, 7.5_

- [ ] 10. Implement user profile and statistics
  - [ ] 10.1 Create profile page (`src/routes/(app)/profile/+page.svelte` and `+page.server.ts`)
    - Implement server load function to calculate overall user statistics
    - Display aggregate stats: total sessions, total practice time, overall success rate
    - Show most practiced moves/patterns
    - Add link to training logs page
    - Implement logout button with Stack Auth signout
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 11. Add search and filtering functionality
  - Implement search query handling in library page load function
  - Add filtering by tags for practice sets
  - Optimize database queries with proper indexing
  - _Requirements: 4.2, 3.5_

- [ ] 12. Implement responsive design and mobile optimization
  - Apply TailwindCSS mobile-first styling to all components
  - Ensure touch-optimized UI elements throughout
  - Test swipe gestures on mobile devices
  - Optimize for various screen sizes
  - _Requirements: 5.4, 5.5_

- [ ] 13. Add error handling and loading states
  - Implement form validation error display for all forms
  - Add loading spinners for async operations
  - Create error toast notification system
  - Add 404 and 403 error pages
  - Implement graceful error handling in practice sessions
  - _Requirements: All requirements (cross-cutting concern)_

- [ ] 14. Database migrations and seeding
  - Run Drizzle migrations to create all tables
  - Create seed script for development data
  - Test database operations with sample data
  - _Requirements: All requirements (infrastructure)_

- [ ]* 15. End-to-end testing
  - [ ]* 15.1 Write E2E test for complete practice flow
    - Test: create move → create pattern → create practice set → start session → swipe moves → end session → view log
    - _Requirements: 1.1, 2.1, 3.1, 5.1, 5.4, 5.5, 5.7, 7.1_
  
  - [ ]* 15.2 Write E2E test for library search and filtering
    - Test: create multiple items → search → verify filtered results
    - _Requirements: 4.2_
  
  - [ ]* 15.3 Write E2E test for edit and delete operations
    - Test: create item → edit → verify changes → delete → verify removal
    - _Requirements: 1.4, 1.5, 2.6_
