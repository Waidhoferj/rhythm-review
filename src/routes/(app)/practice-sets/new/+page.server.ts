import { requireAuth } from '$lib/server/auth';
import { createPracticeSet } from '$lib/server/services/practice-sets';
import { getMovesByUser } from '$lib/server/services/moves';
import { getPatternsByUser } from '$lib/server/services/patterns';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async (event) => {
	const user = await requireAuth(event);
	const [moves, patterns] = await Promise.all([
		getMovesByUser(user.id),
		getPatternsByUser(user.id)
	]);

	return {
		moves,
		patterns
	};
};

export const actions: Actions = {
	default: async (event) => {
		const user = await requireAuth(event);
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
			await createPracticeSet(user.id, {
				name: name!,
				description: description || undefined,
				icon: icon || undefined,
				tags,
				items
			});
		} catch (error) {
			console.error('Error creating practice set:', error);
			return fail(500, { error: 'Failed to create practice set. Please try again.' });
		}

		throw redirect(303, '/library');
	}
};
