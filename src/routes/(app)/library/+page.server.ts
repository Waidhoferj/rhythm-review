import { requireAuth } from '$lib/server/auth';
import { getMovesByUser, searchMoves } from '$lib/server/services/moves';
import { getPatternsByUser, searchPatterns } from '$lib/server/services/patterns';
import { getPracticeSetsByUser, searchPracticeSets } from '$lib/server/services/practice-sets';
import type { PageServerLoad } from './$types';

/**
 * Load function for the Dance Library page
 * Fetches all moves, patterns, and practice sets for the authenticated user
 * Supports search via query parameter
 */
export const load: PageServerLoad = async (event) => {
    // Require authentication
    const user = await requireAuth(event);

    // Get search query from URL parameters
    const searchQuery = event.url.searchParams.get('q');

    // Fetch data based on whether there's a search query
    let moves, patterns, practiceSets;

    if (searchQuery) {
        // Search across all entities
        [moves, patterns, practiceSets] = await Promise.all([
            searchMoves(user.id, searchQuery),
            searchPatterns(user.id, searchQuery),
            searchPracticeSets(user.id, searchQuery)
        ]);
    } else {
        // Fetch all entities
        [moves, patterns, practiceSets] = await Promise.all([
            getMovesByUser(user.id),
            getPatternsByUser(user.id),
            getPracticeSetsByUser(user.id)
        ]);
    }

    return {
        moves,
        patterns,
        practiceSets,
        searchQuery: searchQuery || ''
    };
};
