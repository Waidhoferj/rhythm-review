import { describe, it, expect } from 'vitest';
import {
	initializeQueue,
	selectNextItem,
	recordSuccess,
	recordFailure,
	isMove,
	isPattern
} from './practice-queue';
import type { PracticeSetItem, DanceMove, Pattern } from '$lib/types';

const mockMove: DanceMove = {
	id: 1,
	userId: 'user1',
	name: 'Box Step',
	description: 'Basic box step',
	counts: 8,
	createdAt: new Date(),
	updatedAt: new Date()
};

const mockMove2: DanceMove = {
	id: 2,
	userId: 'user1',
	name: 'Cross Body Lead',
	counts: 8,
	createdAt: new Date(),
	updatedAt: new Date()
};

const mockPattern: Pattern = {
	id: 3,
	userId: 'user1',
	name: 'Basic Combo',
	moves: [],
	createdAt: new Date(),
	updatedAt: new Date()
};

const mockItems: PracticeSetItem[] = [
	{ id: 1, practiceSetId: 1, itemType: 'move', itemId: 1, item: mockMove },
	{ id: 2, practiceSetId: 1, itemType: 'move', itemId: 2, item: mockMove2 },
	{ id: 3, practiceSetId: 1, itemType: 'pattern', itemId: 3, item: mockPattern }
];

describe('initializeQueue', () => {
	it('creates queue items from practice set items', () => {
		const queue = initializeQueue(mockItems);

		expect(queue).toHaveLength(3);
		expect(queue[0]).toEqual({
			itemType: 'move',
			itemId: 1,
			item: mockMove,
			successes: 0,
			failures: 0
		});
	});

	it('filters out items with null item property', () => {
		const itemsWithNull: PracticeSetItem[] = [
			...mockItems,
			{ id: 4, practiceSetId: 1, itemType: 'move', itemId: 99, item: null as any }
		];
		const queue = initializeQueue(itemsWithNull);

		expect(queue).toHaveLength(3);
	});
});

describe('selectNextItem', () => {
	it('returns null for empty queue', () => {
		expect(selectNextItem([])).toBeNull();
	});

	it('returns the only item when queue has one item', () => {
		const queue = initializeQueue([mockItems[0]]);
		const selected = selectNextItem(queue);

		expect(selected).not.toBeNull();
		expect(selected!.itemId).toBe(1);
	});

	it('excludes the previous item to avoid immediate repeats', () => {
		const queue = initializeQueue([mockItems[0], mockItems[1]]);

		// Select 100 times with previousItemId = 1, should never select item 1
		for (let i = 0; i < 100; i++) {
			const selected = selectNextItem(queue, 1);
			expect(selected!.itemId).not.toBe(1);
		}
	});

	it('weights items with more failures higher', () => {
		let queue = initializeQueue(mockItems);

		// Give item 1 lots of failures
		for (let i = 0; i < 10; i++) {
			queue = recordFailure(queue, 1);
		}
		// Give item 2 lots of successes
		for (let i = 0; i < 10; i++) {
			queue = recordSuccess(queue, 2);
		}

		// Track selection frequency over many iterations
		const selections: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
		for (let i = 0; i < 1000; i++) {
			const selected = selectNextItem(queue);
			if (selected) selections[selected.itemId]++;
		}

		// Item 1 (100% failure rate) should be selected more often than item 2 (0% failure rate)
		expect(selections[1]).toBeGreaterThan(selections[2]);
	});
});

describe('recordSuccess', () => {
	it('increments success count for the specified item', () => {
		const queue = initializeQueue(mockItems);
		const updated = recordSuccess(queue, 1);

		expect(updated[0].successes).toBe(1);
		expect(updated[0].failures).toBe(0);
		expect(updated[1].successes).toBe(0);
	});
});

describe('recordFailure', () => {
	it('increments failure count for the specified item', () => {
		const queue = initializeQueue(mockItems);
		const updated = recordFailure(queue, 2);

		expect(updated[1].failures).toBe(1);
		expect(updated[1].successes).toBe(0);
		expect(updated[0].failures).toBe(0);
	});
});

describe('isMove', () => {
	it('returns true for moves', () => {
		expect(isMove(mockMove)).toBe(true);
	});

	it('returns false for patterns', () => {
		expect(isMove(mockPattern)).toBe(false);
	});
});

describe('isPattern', () => {
	it('returns true for patterns', () => {
		expect(isPattern(mockPattern)).toBe(true);
	});

	it('returns false for moves', () => {
		expect(isPattern(mockMove)).toBe(false);
	});
});
