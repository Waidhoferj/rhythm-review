import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { requireAuth } from '$lib/server/auth';
import { getPracticeSet } from '$lib/server/services/practice-sets';

export const load: PageServerLoad = async (event) => {
	const user = await requireAuth(event);
	const practiceSetId = parseInt(event.params.id, 10);

	if (isNaN(practiceSetId)) {
		throw error(400, 'Invalid practice set ID');
	}

	const practiceSet = await getPracticeSet(practiceSetId, user.id);

	if (!practiceSet) {
		throw error(404, 'Practice set not found');
	}

	if (practiceSet.items.length === 0) {
		throw error(400, 'Practice set has no items to practice');
	}

	return {
		practiceSet
	};
};
