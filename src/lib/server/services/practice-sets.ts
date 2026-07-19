import { db } from '../db';
import { practiceSets, practiceSetItems, moves, patterns, patternMoves } from '../db/schema';
import { eq, and, or, ilike, arrayContains } from 'drizzle-orm';
import type { PracticeSet, PracticeSetItem, DanceMove, Pattern, PatternMove } from '$lib/types';

export interface CreatePracticeSetData {
	name: string;
	description?: string;
	icon?: string;
	tags?: string[];
	items: Array<{ itemType: 'move' | 'pattern'; itemId: number }>;
}

export interface UpdatePracticeSetData {
	name?: string;
	description?: string;
	icon?: string;
	tags?: string[];
	items?: Array<{ itemType: 'move' | 'pattern'; itemId: number }>;
}

async function fetchItemDetails(
	itemType: 'move' | 'pattern',
	itemId: number,
	userId: string
): Promise<DanceMove | Pattern | null> {
	if (itemType === 'move') {
		const [move] = await db
			.select()
			.from(moves)
			.where(and(eq(moves.id, itemId), eq(moves.userId, userId)));
		return move ? (move as DanceMove) : null;
	} else {
		const [pattern] = await db
			.select()
			.from(patterns)
			.where(and(eq(patterns.id, itemId), eq(patterns.userId, userId)));
		if (!pattern) return null;

		// Fetch pattern moves - ensure moves also belong to the user
		const patternMovesData = await db
			.select({
				id: patternMoves.id,
				patternId: patternMoves.patternId,
				moveId: patternMoves.moveId,
				sequenceOrder: patternMoves.sequenceOrder,
				move: moves
			})
			.from(patternMoves)
			.innerJoin(moves, and(eq(patternMoves.moveId, moves.id), eq(moves.userId, userId)))
			.where(eq(patternMoves.patternId, itemId))
			.orderBy(patternMoves.sequenceOrder);

		return {
			...pattern,
			moves: patternMovesData as PatternMove[]
		} as Pattern;
	}
}

export async function createPracticeSet(
	userId: string,
	data: CreatePracticeSetData
): Promise<PracticeSet> {
	// Validate that all items belong to the user
	if (data.items && data.items.length > 0) {
		// Separate moves and patterns for batch validation
		const moveIds = data.items
			.filter((item) => item.itemType === 'move')
			.map((item) => item.itemId);
		const patternIds = data.items
			.filter((item) => item.itemType === 'pattern')
			.map((item) => item.itemId);

		// Batch validate moves
		if (moveIds.length > 0) {
			const userMoves = await db
				.select({ id: moves.id })
				.from(moves)
				.where(and(eq(moves.userId, userId), or(...moveIds.map((id) => eq(moves.id, id)))));

			const foundMoveIds = new Set(userMoves.map((move) => move.id));
			const missingMoves = moveIds.filter((id) => !foundMoveIds.has(id));

			if (missingMoves.length > 0) {
				throw new Error(`Moves not found or unauthorized: ${missingMoves.join(', ')}`);
			}
		}

		// Batch validate patterns
		if (patternIds.length > 0) {
			const userPatterns = await db
				.select({ id: patterns.id })
				.from(patterns)
				.where(
					and(eq(patterns.userId, userId), or(...patternIds.map((id) => eq(patterns.id, id))))
				);

			const foundPatternIds = new Set(userPatterns.map((pattern) => pattern.id));
			const missingPatterns = patternIds.filter((id) => !foundPatternIds.has(id));

			if (missingPatterns.length > 0) {
				throw new Error(`Patterns not found or unauthorized: ${missingPatterns.join(', ')}`);
			}
		}
	}

	// Create the practice set
	const [practiceSet] = await db
		.insert(practiceSets)
		.values({
			userId,
			name: data.name,
			description: data.description,
			icon: data.icon,
			tags: data.tags || []
		})
		.returning();

	// Create practice set items
	if (data.items && data.items.length > 0) {
		await db.insert(practiceSetItems).values(
			data.items.map((item) => ({
				practiceSetId: practiceSet.id,
				itemType: item.itemType,
				itemId: item.itemId
			}))
		);
	}

	// Fetch and return the complete practice set
	return getPracticeSet(practiceSet.id, userId) as Promise<PracticeSet>;
}

export async function getPracticeSet(id: number, userId: string): Promise<PracticeSet | null> {
	const [practiceSet] = await db.select().from(practiceSets).where(eq(practiceSets.id, id));

	if (!practiceSet || practiceSet.userId !== userId) {
		return null;
	}

	// Fetch practice set items
	const items = await db
		.select()
		.from(practiceSetItems)
		.where(eq(practiceSetItems.practiceSetId, id));

	// Fetch details for each item
	const itemsWithDetails = await Promise.all(
		items.map(async (item) => {
			const itemDetails = await fetchItemDetails(
				item.itemType as 'move' | 'pattern',
				item.itemId,
				userId
			);
			return {
				...item,
				item: itemDetails
			} as PracticeSetItem;
		})
	);

	return {
		...practiceSet,
		items: itemsWithDetails
	} as PracticeSet;
}

export async function getPracticeSetsByUser(userId: string): Promise<PracticeSet[]> {
	const userPracticeSets = await db
		.select()
		.from(practiceSets)
		.where(eq(practiceSets.userId, userId));

	if (userPracticeSets.length === 0) {
		return [];
	}

	// Fetch all practice set items in one query
	const practiceSetIds = userPracticeSets.map((ps) => ps.id);
	const allItems = await db
		.select()
		.from(practiceSetItems)
		.where(or(...practiceSetIds.map((id) => eq(practiceSetItems.practiceSetId, id))));

	// Group items by practice set ID
	const itemsByPracticeSet = new Map<number, typeof allItems>();
	for (const item of allItems) {
		if (!itemsByPracticeSet.has(item.practiceSetId)) {
			itemsByPracticeSet.set(item.practiceSetId, []);
		}
		itemsByPracticeSet.get(item.practiceSetId)!.push(item);
	}

	// Fetch all moves and patterns in batch
	const moveIds = allItems.filter((item) => item.itemType === 'move').map((item) => item.itemId);
	const patternIds = allItems
		.filter((item) => item.itemType === 'pattern')
		.map((item) => item.itemId);

	const [allMoves, allPatterns] = await Promise.all([
		moveIds.length > 0
			? db
					.select()
					.from(moves)
					.where(and(eq(moves.userId, userId), or(...moveIds.map((id) => eq(moves.id, id)))))
			: Promise.resolve([]),
		patternIds.length > 0
			? db
					.select()
					.from(patterns)
					.where(
						and(eq(patterns.userId, userId), or(...patternIds.map((id) => eq(patterns.id, id))))
					)
			: Promise.resolve([])
	]);

	// Fetch pattern moves for all patterns in batch
	const allPatternMoves =
		patternIds.length > 0
			? await db
					.select({
						id: patternMoves.id,
						patternId: patternMoves.patternId,
						moveId: patternMoves.moveId,
						sequenceOrder: patternMoves.sequenceOrder,
						move: moves
					})
					.from(patternMoves)
					.innerJoin(moves, and(eq(patternMoves.moveId, moves.id), eq(moves.userId, userId)))
					.where(or(...patternIds.map((id) => eq(patternMoves.patternId, id))))
					.orderBy(patternMoves.sequenceOrder)
			: [];

	// Create lookup maps
	const movesMap = new Map(allMoves.map((move) => [move.id, move as DanceMove]));
	const patternsMap = new Map(allPatterns.map((pattern) => [pattern.id, pattern]));

	// Group pattern moves by pattern ID
	const patternMovesMap = new Map<number, typeof allPatternMoves>();
	for (const pm of allPatternMoves) {
		if (!patternMovesMap.has(pm.patternId)) {
			patternMovesMap.set(pm.patternId, []);
		}
		patternMovesMap.get(pm.patternId)!.push(pm);
	}

	// Build complete patterns
	const completePatterns = new Map<number, Pattern>();
	for (const [patternId, pattern] of patternsMap) {
		completePatterns.set(patternId, {
			...pattern,
			moves: (patternMovesMap.get(patternId) || []) as PatternMove[]
		} as Pattern);
	}

	// Assemble the final result
	return userPracticeSets.map((practiceSet) => {
		const items = itemsByPracticeSet.get(practiceSet.id) || [];
		const itemsWithDetails = items.map((item) => {
			let itemDetails: DanceMove | Pattern | null = null;

			if (item.itemType === 'move') {
				itemDetails = movesMap.get(item.itemId) || null;
			} else {
				itemDetails = completePatterns.get(item.itemId) || null;
			}

			return {
				...item,
				item: itemDetails
			} as PracticeSetItem;
		});

		return {
			...practiceSet,
			items: itemsWithDetails
		} as PracticeSet;
	});
}

export async function updatePracticeSet(
	id: number,
	userId: string,
	data: UpdatePracticeSetData
): Promise<PracticeSet | null> {
	// Check authorization
	const [existingPracticeSet] = await db
		.select()
		.from(practiceSets)
		.where(and(eq(practiceSets.id, id), eq(practiceSets.userId, userId)));

	if (!existingPracticeSet) {
		return null;
	}

	// Update practice set metadata
	const updateData: {
		name?: string;
		description?: string;
		icon?: string;
		tags?: string[];
		updatedAt: Date;
	} = {
		updatedAt: new Date()
	};
	if (data.name !== undefined) updateData.name = data.name;
	if (data.description !== undefined) updateData.description = data.description;
	if (data.icon !== undefined) updateData.icon = data.icon;
	if (data.tags !== undefined) updateData.tags = data.tags;

	await db.update(practiceSets).set(updateData).where(eq(practiceSets.id, id));

	// Update items if provided
	if (data.items !== undefined) {
		// Validate that all items belong to the user
		if (data.items.length > 0) {
			// Separate moves and patterns for batch validation
			const moveIds = data.items
				.filter((item) => item.itemType === 'move')
				.map((item) => item.itemId);
			const patternIds = data.items
				.filter((item) => item.itemType === 'pattern')
				.map((item) => item.itemId);

			// Batch validate moves
			if (moveIds.length > 0) {
				const userMoves = await db
					.select({ id: moves.id })
					.from(moves)
					.where(and(eq(moves.userId, userId), or(...moveIds.map((id) => eq(moves.id, id)))));

				const foundMoveIds = new Set(userMoves.map((move) => move.id));
				const missingMoves = moveIds.filter((id) => !foundMoveIds.has(id));

				if (missingMoves.length > 0) {
					throw new Error(`Moves not found or unauthorized: ${missingMoves.join(', ')}`);
				}
			}

			// Batch validate patterns
			if (patternIds.length > 0) {
				const userPatterns = await db
					.select({ id: patterns.id })
					.from(patterns)
					.where(
						and(eq(patterns.userId, userId), or(...patternIds.map((id) => eq(patterns.id, id))))
					);

				const foundPatternIds = new Set(userPatterns.map((pattern) => pattern.id));
				const missingPatterns = patternIds.filter((id) => !foundPatternIds.has(id));

				if (missingPatterns.length > 0) {
					throw new Error(`Patterns not found or unauthorized: ${missingPatterns.join(', ')}`);
				}
			}
		}

		// Delete existing items
		await db.delete(practiceSetItems).where(eq(practiceSetItems.practiceSetId, id));

		// Insert new items
		if (data.items.length > 0) {
			await db.insert(practiceSetItems).values(
				data.items.map((item) => ({
					practiceSetId: id,
					itemType: item.itemType,
					itemId: item.itemId
				}))
			);
		}
	}

	// Fetch and return the updated practice set
	return getPracticeSet(id, userId);
}

export async function deletePracticeSet(id: number, userId: string): Promise<boolean> {
	const result = await db
		.delete(practiceSets)
		.where(and(eq(practiceSets.id, id), eq(practiceSets.userId, userId)))
		.returning();

	return result.length > 0;
}

export async function searchPracticeSets(
	userId: string,
	query?: string,
	tags?: string[]
): Promise<PracticeSet[]> {
	let searchQuery = db
		.select()
		.from(practiceSets)
		.where(eq(practiceSets.userId, userId))
		.$dynamic();

	// Add text search if query provided
	if (query) {
		searchQuery = searchQuery.where(
			or(ilike(practiceSets.name, `%${query}%`), ilike(practiceSets.description, `%${query}%`))
		);
	}

	// Add tag filtering if tags provided
	if (tags && tags.length > 0) {
		for (const tag of tags) {
			searchQuery = searchQuery.where(arrayContains(practiceSets.tags, [tag]));
		}
	}

	const searchResults = await searchQuery;

	if (searchResults.length === 0) {
		return [];
	}

	// Fetch all practice set items in one query
	const practiceSetIds = searchResults.map((ps) => ps.id);
	const allItems = await db
		.select()
		.from(practiceSetItems)
		.where(or(...practiceSetIds.map((id) => eq(practiceSetItems.practiceSetId, id))));

	// Group items by practice set ID
	const itemsByPracticeSet = new Map<number, typeof allItems>();
	for (const item of allItems) {
		if (!itemsByPracticeSet.has(item.practiceSetId)) {
			itemsByPracticeSet.set(item.practiceSetId, []);
		}
		itemsByPracticeSet.get(item.practiceSetId)!.push(item);
	}

	// Fetch all moves and patterns in batch
	const moveIds = allItems.filter((item) => item.itemType === 'move').map((item) => item.itemId);
	const patternIds = allItems
		.filter((item) => item.itemType === 'pattern')
		.map((item) => item.itemId);

	const [allMoves, allPatterns] = await Promise.all([
		moveIds.length > 0
			? db
					.select()
					.from(moves)
					.where(and(eq(moves.userId, userId), or(...moveIds.map((id) => eq(moves.id, id)))))
			: Promise.resolve([]),
		patternIds.length > 0
			? db
					.select()
					.from(patterns)
					.where(
						and(eq(patterns.userId, userId), or(...patternIds.map((id) => eq(patterns.id, id))))
					)
			: Promise.resolve([])
	]);

	// Fetch pattern moves for all patterns in batch
	const allPatternMoves =
		patternIds.length > 0
			? await db
					.select({
						id: patternMoves.id,
						patternId: patternMoves.patternId,
						moveId: patternMoves.moveId,
						sequenceOrder: patternMoves.sequenceOrder,
						move: moves
					})
					.from(patternMoves)
					.innerJoin(moves, and(eq(patternMoves.moveId, moves.id), eq(moves.userId, userId)))
					.where(or(...patternIds.map((id) => eq(patternMoves.patternId, id))))
					.orderBy(patternMoves.sequenceOrder)
			: [];

	// Create lookup maps
	const movesMap = new Map(allMoves.map((move) => [move.id, move as DanceMove]));
	const patternsMap = new Map(allPatterns.map((pattern) => [pattern.id, pattern]));

	// Group pattern moves by pattern ID
	const patternMovesMap = new Map<number, typeof allPatternMoves>();
	for (const pm of allPatternMoves) {
		if (!patternMovesMap.has(pm.patternId)) {
			patternMovesMap.set(pm.patternId, []);
		}
		patternMovesMap.get(pm.patternId)!.push(pm);
	}

	// Build complete patterns
	const completePatterns = new Map<number, Pattern>();
	for (const [patternId, pattern] of patternsMap) {
		completePatterns.set(patternId, {
			...pattern,
			moves: (patternMovesMap.get(patternId) || []) as PatternMove[]
		} as Pattern);
	}

	// Assemble the final result
	return searchResults.map((practiceSet) => {
		const items = itemsByPracticeSet.get(practiceSet.id) || [];
		const itemsWithDetails = items.map((item) => {
			let itemDetails: DanceMove | Pattern | null = null;

			if (item.itemType === 'move') {
				itemDetails = movesMap.get(item.itemId) || null;
			} else {
				itemDetails = completePatterns.get(item.itemId) || null;
			}

			return {
				...item,
				item: itemDetails
			} as PracticeSetItem;
		});

		return {
			...practiceSet,
			items: itemsWithDetails
		} as PracticeSet;
	});
}
