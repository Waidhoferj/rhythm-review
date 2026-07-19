import { requireAuth } from '$lib/server/auth';
import { getPracticeSet, deletePracticeSet } from '$lib/server/services/practice-sets';
import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async (event) => {
	const user = await requireAuth(event);
	const practiceSetId = parseInt(event.params.id, 10);

	if (isNaN(practiceSetId)) {
		throw error(404, 'Practice set not found');
	}

	const practiceSet = await getPracticeSet(practiceSetId, user.id);

	if (!practiceSet) {
		throw error(404, 'Practice set not found');
	}

	return {
		practiceSet
	};
};

export const actions: Actions = {
	delete: async (event) => {
		const user = await requireAuth(event);
		const practiceSetId = parseInt(event.params.id, 10);

		if (isNaN(practiceSetId)) {
			return fail(400, { error: 'Invalid practice set ID' });
		}

		try {
			const success = await deletePracticeSet(practiceSetId, user.id);

			if (!success) {
				return fail(404, { error: 'Practice set not found or already deleted' });
			}
		} catch (error) {
			console.error('Error deleting practice set:', error);
			return fail(500, { error: 'Failed to delete practice set. Please try again.' });
		}

		throw redirect(303, '/library');
	}
};
