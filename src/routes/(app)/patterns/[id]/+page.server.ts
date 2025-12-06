import { requireAuth } from '$lib/server/auth';
import { getPattern, deletePattern } from '$lib/server/services/patterns';
import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async (event) => {
    const user = await requireAuth(event);
    const patternId = parseInt(event.params.id, 10);

    if (isNaN(patternId)) {
        throw error(404, 'Pattern not found');
    }

    const pattern = await getPattern(patternId, user.id);

    if (!pattern) {
        throw error(404, 'Pattern not found');
    }

    return {
        pattern
    };
};

export const actions: Actions = {
    delete: async (event) => {
        const user = await requireAuth(event);
        const patternId = parseInt(event.params.id, 10);

        if (isNaN(patternId)) {
            return fail(400, { error: 'Invalid pattern ID' });
        }

        try {
            const success = await deletePattern(patternId, user.id);

            if (!success) {
                return fail(404, { error: 'Pattern not found or already deleted' });
            }
        } catch (error) {
            console.error('Error deleting pattern:', error);
            return fail(500, { error: 'Failed to delete pattern. Please try again.' });
        }

        throw redirect(303, '/library');
    }
};
