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
    itemId: number
): Promise<DanceMove | Pattern | null> {
    if (itemType === 'move') {
        const [move] = await db.select().from(moves).where(eq(moves.id, itemId));
        return move ? (move as DanceMove) : null;
    } else {
        const [pattern] = await db.select().from(patterns).where(eq(patterns.id, itemId));
        if (!pattern) return null;

        // Fetch pattern moves
        const patternMovesData = await db
            .select({
                id: patternMoves.id,
                patternId: patternMoves.patternId,
                moveId: patternMoves.moveId,
                sequenceOrder: patternMoves.sequenceOrder,
                move: moves
            })
            .from(patternMoves)
            .innerJoin(moves, eq(patternMoves.moveId, moves.id))
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
                item.itemId
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

    // Fetch items for each practice set
    const practiceSetsWithItems = await Promise.all(
        userPracticeSets.map(async (practiceSet) => {
            const items = await db
                .select()
                .from(practiceSetItems)
                .where(eq(practiceSetItems.practiceSetId, practiceSet.id));

            const itemsWithDetails = await Promise.all(
                items.map(async (item) => {
                    const itemDetails = await fetchItemDetails(
                        item.itemType as 'move' | 'pattern',
                        item.itemId
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
        })
    );

    return practiceSetsWithItems;
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
    let searchQuery = db.select().from(practiceSets).where(eq(practiceSets.userId, userId)).$dynamic();

    // Add text search if query provided
    if (query) {
        searchQuery = searchQuery.where(
            or(
                ilike(practiceSets.name, `%${query}%`),
                ilike(practiceSets.description, `%${query}%`)
            )
        );
    }

    // Add tag filtering if tags provided
    if (tags && tags.length > 0) {
        for (const tag of tags) {
            searchQuery = searchQuery.where(arrayContains(practiceSets.tags, [tag]));
        }
    }

    const searchResults = await searchQuery;

    // Fetch items for each practice set
    const practiceSetsWithItems = await Promise.all(
        searchResults.map(async (practiceSet) => {
            const items = await db
                .select()
                .from(practiceSetItems)
                .where(eq(practiceSetItems.practiceSetId, practiceSet.id));

            const itemsWithDetails = await Promise.all(
                items.map(async (item) => {
                    const itemDetails = await fetchItemDetails(
                        item.itemType as 'move' | 'pattern',
                        item.itemId
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
        })
    );

    return practiceSetsWithItems;
}
