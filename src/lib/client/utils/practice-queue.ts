import type { DanceMove, Pattern, PracticeQueueItem, PracticeSetItem } from '$lib/types';

/**
 * Initialize the practice queue from practice set items.
 * Each item starts with 0 successes and 0 failures.
 */
export function initializeQueue(items: PracticeSetItem[]): PracticeQueueItem[] {
	return items
		.filter((item) => item.item != null)
		.map((item) => ({
			itemType: item.itemType,
			itemId: item.itemId,
			item: item.item,
			successes: 0,
			failures: 0
		}));
}

/**
 * Select the next item using weighted random sampling.
 *
 * Weighting: items with more failures relative to attempts are more likely to be selected.
 * The weight formula is: 1 + (failures / attempts) — so items that have never been
 * attempted have weight 1, and items with 100% failure rate have weight 2.
 *
 * The previously shown item is excluded to avoid immediate repeats.
 */
export function selectNextItem(
	queue: PracticeQueueItem[],
	previousItemId?: number
): PracticeQueueItem | null {
	if (queue.length === 0) return null;
	if (queue.length === 1) return queue[0];

	// Exclude the previously shown item to avoid immediate repeats
	const candidates =
		previousItemId != null ? queue.filter((item) => item.itemId !== previousItemId) : queue;

	// If filtering removed all items (shouldn't happen with length > 1), fall back
	if (candidates.length === 0) return queue[0];

	// Calculate weights
	const weights = candidates.map((item) => {
		const attempts = item.successes + item.failures;
		if (attempts === 0) return 1;
		return 1 + item.failures / attempts;
	});

	// Weighted random selection
	const totalWeight = weights.reduce((sum, w) => sum + w, 0);
	let random = Math.random() * totalWeight;

	for (let i = 0; i < candidates.length; i++) {
		random -= weights[i];
		if (random <= 0) {
			return candidates[i];
		}
	}

	// Fallback (shouldn't reach here due to floating point)
	return candidates[candidates.length - 1];
}

/**
 * Record a success for an item in the queue.
 * Returns a new queue with the updated item.
 */
export function recordSuccess(
	queue: PracticeQueueItem[],
	itemId: number
): PracticeQueueItem[] {
	return queue.map((item) =>
		item.itemId === itemId ? { ...item, successes: item.successes + 1 } : item
	);
}

/**
 * Record a failure for an item in the queue.
 * Returns a new queue with the updated item.
 */
export function recordFailure(
	queue: PracticeQueueItem[],
	itemId: number
): PracticeQueueItem[] {
	return queue.map((item) =>
		item.itemId === itemId ? { ...item, failures: item.failures + 1 } : item
	);
}

/**
 * Get the display name for a practice queue item.
 */
export function getItemName(item: DanceMove | Pattern): string {
	return item.name;
}

/**
 * Check if an item is a DanceMove (has 'counts' property).
 */
export function isMove(item: DanceMove | Pattern): item is DanceMove {
	return 'counts' in item;
}

/**
 * Check if an item is a Pattern (has 'moves' property).
 */
export function isPattern(item: DanceMove | Pattern): item is Pattern {
	return 'moves' in item;
}
