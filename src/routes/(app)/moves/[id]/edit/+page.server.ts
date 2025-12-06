import { requireAuth } from '$lib/server/auth';
import { getMove, updateMove } from '$lib/server/services/moves';
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
    default: async (event) => {
        const user = await requireAuth(event);
        const moveId = parseInt(event.params.id, 10);

        if (isNaN(moveId)) {
            return fail(400, { error: 'Invalid move ID' });
        }

        const formData = await event.request.formData();

        const name = formData.get('name')?.toString().trim();
        const description = formData.get('description')?.toString().trim();
        const countsStr = formData.get('counts')?.toString();

        // Validation
        const errors: Record<string, string> = {};

        if (!name) {
            errors.name = 'Name is required';
        } else if (name.length > 100) {
            errors.name = 'Name must be 100 characters or less';
        }

        if (description && description.length > 500) {
            errors.description = 'Description must be 500 characters or less';
        }

        if (!countsStr) {
            errors.counts = 'Counts is required';
        } else {
            const counts = parseInt(countsStr, 10);
            if (isNaN(counts) || counts < 1 || counts > 999) {
                errors.counts = 'Counts must be a number between 1 and 999';
            }
        }

        if (Object.keys(errors).length > 0) {
            return fail(400, { errors });
        }

        try {
            const updatedMove = await updateMove(moveId, user.id, {
                name: name!,
                description: description || undefined,
                counts: parseInt(countsStr!, 10)
            });

            if (!updatedMove) {
                return fail(404, { error: 'Move not found' });
            }
        } catch (error) {
            console.error('Error updating move:', error);
            return fail(500, { error: 'Failed to update move. Please try again.' });
        }

        throw redirect(303, `/moves/${moveId}`);
    }
};
