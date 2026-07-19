import type { PracticeQueueItem, PracticeSetItem } from '$lib/types';
import {
	initializeQueue,
	selectNextItem,
	recordSuccess,
	recordFailure
} from '$lib/client/utils/practice-queue';

/**
 * Creates a reactive practice session state using Svelte 5 runes.
 * Manages the entire practice session lifecycle on the client side.
 */
export function createPracticeSession(items: PracticeSetItem[]) {
	let queue = $state<PracticeQueueItem[]>(initializeQueue(items));
	let currentItem = $state<PracticeQueueItem | null>(null);
	let isActive = $state(true);
	let totalAttempts = $state(0);
	let totalSuccesses = $state(0);
	let totalFailures = $state(0);

	// Select the first item
	currentItem = selectNextItem(queue);

	function markSuccess() {
		if (!currentItem || !isActive) return;

		const itemId = currentItem.itemId;
		queue = recordSuccess(queue, itemId);
		totalAttempts++;
		totalSuccesses++;

		// Select next item (excluding current to avoid repeat)
		currentItem = selectNextItem(queue, itemId);
	}

	function markFailure() {
		if (!currentItem || !isActive) return;

		const itemId = currentItem.itemId;
		queue = recordFailure(queue, itemId);
		totalAttempts++;
		totalFailures++;

		// Select next item (excluding current to avoid repeat)
		currentItem = selectNextItem(queue, itemId);
	}

	function stop() {
		isActive = false;
	}

	return {
		get currentItem() {
			return currentItem;
		},
		get isActive() {
			return isActive;
		},
		get totalAttempts() {
			return totalAttempts;
		},
		get totalSuccesses() {
			return totalSuccesses;
		},
		get totalFailures() {
			return totalFailures;
		},
		get queue() {
			return queue;
		},
		get successRate() {
			if (totalAttempts === 0) return 0;
			return Math.round((totalSuccesses / totalAttempts) * 100);
		},
		markSuccess,
		markFailure,
		stop
	};
}
