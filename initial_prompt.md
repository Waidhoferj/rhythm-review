Let's build an app called Rhythm Review. The intention of the app is to help dancers practice different dance moves.

Features:

- Keep track of all of your dance moves
- Assemble your dance moves sequentially into patterns
- Create Practice sets of patterns and dance moves that represents different concepts to practice
- Tag your patterns and moves to organize them
- Start a practice session with a practice set. The practice session generates random permutations of patterns and moves to practice.
- Swipe left or right durng a practice session to catalog if you successfully executed the move. The next move will come up after.
- Review practice logs with statistics such as date, duration, practice set, best executed moves, worst executed moves. Leave personal notes and suggestions.

There are several concepts that define the app experience. The atomic unit is a dance move. A dance move has a name, an optional description, and certain number of `counts` that it takes to execute. Dance moves can be put together to form Patterns. Patterns are a series of dance moves executed in a certain order. They have a name, an optional description, and a sequence of moves. Both patterns and dance moves can be combined into a Practice Set, which has a name, tags, description, list of moves and patterns, and icon.

The app starts with a login screen (already implemented). When the user is logged in, they will be brought to the Dance Library. The dance library is a searchable list screen of all of your moves and patterns. Practice Sets, patterns, and moves should be in their own sections. You can press a plus button at the top of the screen to add a move or pattern. This will present a popup that will allow you to click either "move", "pattern", or practice set. Clicking move will bring you to the New dance move screen where you can enter in the appropriate information and add it to your library. Clicking pattern will bring you to a screen where you can add moves from your library to the new pattern, rearrange them, and provide metadata information about the pattern. Clicking practice set will bring you to a screen where you can add patterns and dance moves to your practice set. On the Dance Library screen, clicking any move or pattern will bring up its information in a Move / Pattern screen respectively. There will be an edit button at the top of each screen that allows you to edit the contents of the move / pattern via the creation screens.

When you click on a practice set, it will open a practice set viewing screen. This screen will show the contents of the practice set and have a "Practice" button. Clicking this will open the Practice view and start a practice session.

The practice session records the following statistics and writes them to a practice log when the session is ended: Session duration, practice set it was based on, series of moves executed, whether each move was executed successfully or not. The practice view is a simple screen that shows the move, name on a card that covers the screen. A stop button is present in the lower left corner of the screen. The user can swipe the dance card off of the screen to present the next move to practice. Swiping left indicates that the move/pattern was not executed successfully, swiping right indicates that the dancer performed the move/pattern effectively. These records should be stored and associated with both the practice session and the move/pattern via foreign keys in the database. The next move will be suggested by the model based on the SM-2 Spaced Repetition learning algorithm. When the user presses the stop button, they will be presented with a congratulatory screen and the statistics of their practice session. There will also be a training logs screen that can be accessed on the user's profile page.

The profile page shows overall statistics for the user as well as a training log of all sessions. It will also have an option to log out.
