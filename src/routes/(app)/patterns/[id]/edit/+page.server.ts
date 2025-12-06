import { requireAuth } from '$lib/server/auth';
import { getPattern, updatePattern } from '$lib/server/services/patterns';
import { getMovesByUser } from '$lib/server/services/moves';
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

    const moves = await getMovesByUser(user.id);

    return {
        pattern,
        moves
    };
};

export const actions: Actions = {
    default: async (event) => {
        const user = await requireAuth(event);
        const patternId = parseInt(event.params.id, 10);

        if (isNaN(patternId)) {
            return fail(400, { error: 'Invalid pattern ID' });
        }

        const formData = await event.request.formData();

        const name = formData.get('name')?.toString().trim();
        const description = formData.get('description')?.toString().trim();
        const moveIdsStr = formData.get('moveIds')?.toString();

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

        let moveIds: number[] = [];
        if (moveIdsStr) {
            try {
                moveIds = JSON.parse(moveIdsStr);
                if (!Array.isArray(moveIds) || moveIds.some((id) => typeof id !== 'number')) {
                    errors.moveIds = 'Invalid move selection';
                }
            } catch {
                errors.moveIds = 'Invalid move selection';
            }
        }

        if (moveIds.length === 0) {
            errors.moveIds = 'Please select at least one move';
        }

        if (Object.keys(errors).length > 0) {
            return fail(400, { errors });
        }

        try {
            const updatedPattern = await updatePattern(patternId, user.id, {
                name: name!,
                description: description || undefined,
                moveIds
            });

            if (!updatedPattern) {
                return fail(404, { error: 'Pattern not found' });
            }
        } catch (error) {
            console.error('Error updating pattern:', error);
            return fail(500, { error: 'Failed to update pattern. Please try again.' });
        }

        throw redirect(303, `/patterns/${patternId}`);
    }
};
