import { requireAuth } from '$lib/server/auth';
import { createMove } from '$lib/server/services/moves';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async (event) => {
		const user = await requireAuth(event);
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
			await createMove(user.id, {
				name: name!,
				description: description || undefined,
				counts: parseInt(countsStr!, 10)
			});
		} catch (error) {
			console.error('Error creating move:', error);
			return fail(500, { error: 'Failed to create move. Please try again.' });
		}

		throw redirect(303, '/library');
	}
};
