import { requireAuth } from '$lib/server/auth';
import { getPracticeSet, updatePracticeSet } from '$lib/server/services/practice-sets';
import { getMovesByUser } from '$lib/server/services/moves';
import { getPatternsByUser } from '$lib/server/services/patterns';
import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async (event) => {
    const user = await requireAuth(event);
    const practiceSetId = parseInt(event.params.id, 10);

    if (isNaN(practiceSetId)) {
        throw error(404, 'Practice set not found');
    }

    const [practiceSet, moves, patterns] = await Promise.all([
        getPracticeSet(practiceSetId, user.id),
        getMovesByUser(user.id),
        getPatternsByUser(user.id)
    ]);

    if (!practiceSet) {
        throw error(404, 'Practice set not found');
    }

    return {
        practiceSet,
        moves,
        patterns
    };
};

export const actions: Actions = {
    default: async (event) => {
        const user = await requireAuth(event);
        const practiceSetId = parseInt(event.params.id, 10);

        if (isNaN(practiceSetId)) {
            return fail(400, { error: 'Invalid practice set ID' });
        }

        const formData = await event.request.formData();

        const name = formData.get('name')?.toString().trim();
        const description = formData.get('description')?.toString().trim();
        const icon = formData.get('icon')?.toString().trim();
        const tagsStr = formData.get('tags')?.toString();
        const itemsStr = formData.get('items')?.toString();

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

        let tags: string[] = [];
        if (tagsStr) {
            try {
                tags = JSON.parse(tagsStr);
                if (!Array.isArray(tags) || tags.some((tag) => typeof tag !== 'string')) {
                    errors.tags = 'Invalid tags format';
                }
            } catch {
                errors.tags = 'Invalid tags format';
            }
        }

        let items: Array<{ itemType: 'move' | 'pattern'; itemId: number }> = [];
        if (itemsStr) {
            try {
                items = JSON.parse(itemsStr);
                if (
                    !Array.isArray(items) ||
                    items.some(
                        (item) =>
                            !item.itemType ||
                            !item.itemId ||
                            (item.itemType !== 'move' && item.itemType !== 'pattern') ||
                            typeof item.itemId !== 'number'
                    )
                ) {
                    errors.items = 'Invalid items selection';
                }
            } catch {
                errors.items = 'Invalid items selection';
            }
        }

        if (items.length === 0) {
            errors.items = 'Please select at least one move or pattern';
        }

        if (Object.keys(errors).length > 0) {
            return fail(400, { errors });
        }

        try {
            const updated = await updatePracticeSet(practiceSetId, user.id, {
                name: name!,
                description: description || undefined,
                icon: icon || undefined,
                tags,
                items
            });

            if (!updated) {
                return fail(404, { error: 'Practice set not found' });
            }
        } catch (error) {
            console.error('Error updating practice set:', error);
            return fail(500, { error: 'Failed to update practice set. Please try again.' });
        }

        throw redirect(303, `/practice-sets/${practiceSetId}`);
    }
};
