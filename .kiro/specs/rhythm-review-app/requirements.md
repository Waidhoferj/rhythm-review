# Requirements Document

## Introduction

Rhythm Review is a dance practice application designed to help dancers systematically practice and improve their dance moves through spaced repetition learning. The system enables users to catalog individual dance moves, organize them into patterns, create practice sets, and track their progress through practice sessions with intelligent move suggestions based on performance history.

## Glossary

- **Dance Move**: The atomic unit of practice; a single dance movement with a name, optional description, and count duration
- **Pattern**: A sequential combination of dance moves with a defined order, name, and optional description
- **Practice Set**: A collection of dance moves and patterns organized for focused practice, including name, tags, description, and icon
- **Practice Session**: A timed practice activity where the user executes randomly suggested moves/patterns and records success/failure
- **Practice Log**: A historical record of a practice session including duration, moves executed, and success rates
- **SM-2 Algorithm**: Spaced Repetition learning algorithm used to intelligently suggest the next move based on past performance
- **Dance Library**: The main repository view displaying all moves, patterns, and practice sets
- **User**: An authenticated dancer using the application
- **System**: The Rhythm Review application

## Requirements

### Requirement 1: Dance Move Management

**User Story:** As a dancer, I want to create and manage individual dance moves with their details, so that I can build a comprehensive library of movements to practice.

#### Acceptance Criteria

1. WHEN the User selects "move" from the creation popup, THE System SHALL display a form to enter move name, optional description, tags, and count duration
2. WHEN the User submits a valid dance move form, THE System SHALL save the dance move to the database and add it to the Dance Library
3. WHEN the User clicks on a dance move in the Dance Library, THE System SHALL display the move details screen with name, description, and count information
4. WHEN the User clicks the edit button on a move details screen, THE System SHALL display the move editing form pre-populated with existing data
5. WHEN the User updates a dance move, THE System SHALL save the changes to the database and update the Dance Library display

### Requirement 2: Pattern Management

**User Story:** As a dancer, I want to create patterns by combining multiple dance moves in sequence, so that I can practice complex movement combinations.

#### Acceptance Criteria

1. WHEN the User selects "pattern" from the creation popup, THE System SHALL display a pattern creation screen with fields for name, optional description, tags, and move selection interface
2. WHEN the User adds moves to a pattern, THE System SHALL display the selected moves in the specified sequence order
3. WHEN the User rearranges moves within a pattern, THE System SHALL update the sequence order accordingly
4. WHEN the User submits a valid pattern form, THE System SHALL save the pattern with its move sequence to the database
5. WHEN the User clicks on a pattern in the Dance Library, THE System SHALL display the pattern details screen showing name, description, and ordered move list
6. WHEN the User clicks the edit button on a pattern details screen, THE System SHALL display the pattern editing form pre-populated with existing data

### Requirement 3: Practice Set Management

**User Story:** As a dancer, I want to create practice sets containing selected moves and patterns with organizational tags, so that I can focus my practice sessions on specific concepts.

#### Acceptance Criteria

1. WHEN the User selects "practice set" from the creation popup, THE System SHALL display a practice set creation screen with fields for name, description, tags, icon, and content selection
2. WHEN the User adds moves or patterns to a practice set, THE System SHALL include those items in the practice set configuration
3. WHEN the User submits a valid practice set form, THE System SHALL save the practice set to the database with all associated moves and patterns
4. WHEN the User clicks on a practice set in the Dance Library, THE System SHALL display the practice set viewing screen with all metadata and contents
5. WHERE the User has created tags, THE System SHALL allow filtering and organization of practice sets by those tags on the Dance Library screen

### Requirement 4: Dance Library Navigation

**User Story:** As a dancer, I want to view and search all my moves, patterns, and practice sets in one organized library, so that I can easily find and access my dance content.

#### Acceptance Criteria

1. WHEN the User navigates to the Dance Library, THE System SHALL display all moves, patterns, and practice sets organized in separate sections
2. WHEN the User enters text in the search field, THE System SHALL filter the displayed items to match the search query across names and descriptions
3. WHEN the User clicks the plus button, THE System SHALL display a popup with options for "move", "pattern", and "practice set"
4. THE System SHALL display the Dance Library as the default screen after user authentication
5. WHEN the User selects any item in the Dance Library, THE System SHALL navigate to the appropriate detail screen for that item type
6. THE System SHALL allow the user to add filter chips under the search bar such that the user can filter by tag.

### Requirement 5: Practice Session Execution

**User Story:** As a dancer, I want to start a practice session that presents moves in an intelligent order based on my past performance, so that I can efficiently improve my weakest areas.

#### Acceptance Criteria

1. WHEN the User clicks the "Practice" button on a practice set viewing screen, THE System SHALL start a practice session and display the practice view
2. WHEN a practice session starts, THE System SHALL record the session start time and associated practice set
3. WHEN the practice view displays a move or pattern, THE System SHALL show the name on a full-screen card with a stop button in the lower left corner
4. WHEN the User swipes the card left, THE System SHALL record the move as unsuccessfully executed and present the next move
5. WHEN the User swipes the card right, THE System SHALL record the move as successfully executed and present the next move
6. WHEN the System selects the next move to present, THE System SHALL apply the SM-2 spaced repetition algorithm based on the user's historical performance data
7. WHEN the User clicks the stop button, THE System SHALL end the practice session and display the session summary screen

### Requirement 6: Practice Session Recording

**User Story:** As a dancer, I want my practice sessions automatically recorded with detailed statistics, so that I can track my progress over time.

#### Acceptance Criteria

1. WHEN a practice session ends, THE System SHALL calculate the total session duration from start to stop time
2. WHEN a practice session ends, THE System SHALL save a practice log record containing session duration, practice set reference, and timestamp
3. WHEN the User swipes on a move during practice, THE System SHALL create a record associating the move execution result with both the practice session and the specific move via foreign keys
4. WHEN a practice session ends, THE System SHALL display a congratulatory screen with session statistics including duration and performance summary
5. THE System SHALL store all practice session data persistently in the database for future retrieval



### Requirement 8: User Profile and Statistics

**User Story:** As a dancer, I want to view my overall practice statistics and access my training history from my profile, so that I can monitor my long-term progress.

#### Acceptance Criteria

1. WHEN the User navigates to the profile page, THE System SHALL display overall practice statistics aggregated across all sessions
2. WHEN the User views the profile page, THE System SHALL provide access to the complete training log of all practice sessions
3. WHEN the User clicks the logout option on the profile page, THE System SHALL end the user session and return to the login screen
4. THE System SHALL calculate and display aggregate statistics including total practice time, total sessions, and overall success rates
5. THE System SHALL maintain user profile data persistently across sessions
THE System SHALL display a list of all past practice sessions ordered by date
6. WHEN the User selects a practice log entry, THE System SHALL display detailed statistics including date, duration, practice set used, best executed moves, and worst executed moves
7. WHEN the User views a practice log, THE System SHALL provide an interface to add or edit personal notes and suggestions
8. WHEN the User saves notes on a practice log, THE System SHALL persist those notes to the database associated with that session
9. THE System SHALL calculate and display best and worst executed moves based on success rate percentages from the session data

### Requirement 9: Authentication Integration

**User Story:** As a dancer, I want to securely log in to access my personal dance library and practice history, so that my data remains private and accessible only to me.

#### Acceptance Criteria

1. WHEN the User successfully authenticates via the login screen, THE System SHALL navigate to the Dance Library screen
2. THE System SHALL associate all created moves, patterns, practice sets, and practice logs with the authenticated user account
3. WHEN the User is not authenticated, THE System SHALL restrict access to all features except the login screen
4. THE System SHALL maintain user session state throughout the application navigation
5. WHEN the User logs out, THE System SHALL clear the session and return to the login screen
