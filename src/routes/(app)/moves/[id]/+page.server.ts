import { requireAuth } from '$lib/server/auth';
import { getMove, deleteMove } from '$lib/server/services/moves';
import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async (event) => {
    const user = await requireAuth(event);
    const moveId = parseInt(event.params.id, 10);

    if (isNaN(moveId)) {
        throw error(404, 'Move not found');
    }

    const move = await getMove(moveId, user.id);

    if (!move) {
        throw error(404, 'Move not found');
    }

    return {
        move
    };
};

export const actions: Actions = {
    delete: async (event) => {
        const user = await requireAuth(event);
        const moveId = parseInt(event.params.id, 10);

        if (isNaN(moveId)) {
            return fail(400, { error: 'Invalid move ID' });
        }

        try {
            const success = await deleteMove(moveId, user.id);

            if (!success) {
                return fail(404, { error: 'Move not found or already deleted' });
            }
        } catch (error) {
            console.error('Error deleting move:', error);
            return fail(500, { error: 'Failed to delete move. Please try again.' });
        }

        throw redirect(303, '/library');
    }
};
