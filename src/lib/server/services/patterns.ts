import { db } from '../db';
import { patterns, patternMoves, moves } from '../db/schema';
import { eq, and, or, ilike } from 'drizzle-orm';
import type { Pattern, PatternMove } from '$lib/types';

export interface CreatePatternData {
    name: string;
    description?: string;
    moveIds: number[]; // Array of move IDs in sequence order
}

export interface UpdatePatternData {
    name?: string;
    description?: string;
    // TODO: How do we ensure no id collisions between moves and patterns?
    moveIds?: number[]; // Array of move IDs in sequence order
}

export async function createPattern(userId: string, data: CreatePatternData): Promise<Pattern> {
    // Validate that all moveIds belong to the user
    if (data.moveIds && data.moveIds.length > 0) {
        const userMoves = await db
            .select({ id: moves.id })
            .from(moves)
            .where(and(eq(moves.userId, userId), or(...data.moveIds.map(id => eq(moves.id, id)))));

        const foundMoveIds = new Set(userMoves.map(move => move.id));
        const missingMoves = data.moveIds.filter(id => !foundMoveIds.has(id));

        if (missingMoves.length > 0) {
            throw new Error(`Moves not found or unauthorized: ${missingMoves.join(', ')}`);
        }
    }

    // Create the pattern
    const [pattern] = await db
        .insert(patterns)
        .values({
            userId,
            name: data.name,
            description: data.description
        })
        .returning();

    // Create pattern-move relationships with sequence order
    if (data.moveIds && data.moveIds.length > 0) {
        await db.insert(patternMoves).values(
            data.moveIds.map((moveId, index) => ({
                patternId: pattern.id,
                moveId,
                sequenceOrder: index
            }))
        );
    }

    // Fetch and return the complete pattern with moves
    return getPattern(pattern.id, userId) as Promise<Pattern>;
}

export async function getPattern(id: number, userId: string): Promise<Pattern | null> {
    const [pattern] = await db.select().from(patterns).where(eq(patterns.id, id));

    if (!pattern || pattern.userId !== userId) {
        return null;
    }

    // Fetch pattern moves with move details - ensure moves belong to the user
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
        .where(eq(patternMoves.patternId, id))
        .orderBy(patternMoves.sequenceOrder);

    return {
        ...pattern,
        moves: patternMovesData as PatternMove[]
    } as Pattern;
}

export async function getPatternsByUser(userId: string): Promise<Pattern[]> {
    const userPatterns = await db.select().from(patterns).where(eq(patterns.userId, userId));

    if (userPatterns.length === 0) {
        return [];
    }

    // Fetch all pattern moves in one query
    const patternIds = userPatterns.map(p => p.id);
    const allPatternMoves = await db
        .select({
            id: patternMoves.id,
            patternId: patternMoves.patternId,
            moveId: patternMoves.moveId,
            sequenceOrder: patternMoves.sequenceOrder,
            move: moves
        })
        .from(patternMoves)
        .innerJoin(moves, and(eq(patternMoves.moveId, moves.id), eq(moves.userId, userId)))
        .where(or(...patternIds.map(id => eq(patternMoves.patternId, id))))
        .orderBy(patternMoves.sequenceOrder);

    // Group pattern moves by pattern ID
    const patternMovesMap = new Map<number, typeof allPatternMoves>();
    for (const pm of allPatternMoves) {
        if (!patternMovesMap.has(pm.patternId)) {
            patternMovesMap.set(pm.patternId, []);
        }
        patternMovesMap.get(pm.patternId)!.push(pm);
    }

    // Assemble the final result
    return userPatterns.map(pattern => ({
        ...pattern,
        moves: (patternMovesMap.get(pattern.id) || []) as PatternMove[]
    } as Pattern));
}

export async function updatePattern(
    id: number,
    userId: string,
    data: UpdatePatternData
): Promise<Pattern | null> {
    // Check authorization
    const [existingPattern] = await db
        .select()
        .from(patterns)
        .where(and(eq(patterns.id, id), eq(patterns.userId, userId)));

    if (!existingPattern) {
        return null;
    }

    // Update pattern metadata
    const updateData: { name?: string; description?: string; updatedAt: Date } = {
        updatedAt: new Date()
    };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;

    await db.update(patterns).set(updateData).where(eq(patterns.id, id));

    // Update move sequence if provided
    if (data.moveIds !== undefined) {
        // Validate that all moveIds belong to the user
        if (data.moveIds.length > 0) {
            const userMoves = await db
                .select({ id: moves.id })
                .from(moves)
                .where(and(eq(moves.userId, userId), or(...data.moveIds.map(id => eq(moves.id, id)))));

            const foundMoveIds = new Set(userMoves.map(move => move.id));
            const missingMoves = data.moveIds.filter(id => !foundMoveIds.has(id));

            if (missingMoves.length > 0) {
                throw new Error(`Moves not found or unauthorized: ${missingMoves.join(', ')}`);
            }
        }

        // Delete existing pattern moves
        await db.delete(patternMoves).where(eq(patternMoves.patternId, id));

        // Insert new pattern moves
        if (data.moveIds.length > 0) {
            await db.insert(patternMoves).values(
                data.moveIds.map((moveId, index) => ({
                    patternId: id,
                    moveId,
                    sequenceOrder: index
                }))
            );
        }
    }

    // Fetch and return the updated pattern
    return getPattern(id, userId);
}

export async function deletePattern(id: number, userId: string): Promise<boolean> {
    const result = await db
        .delete(patterns)
        .where(and(eq(patterns.id, id), eq(patterns.userId, userId)))
        .returning();

    return result.length > 0;
}

export async function searchPatterns(userId: string, query: string): Promise<Pattern[]> {
    const searchResults = await db
        .select()
        .from(patterns)
        .where(
            and(
                eq(patterns.userId, userId),
                or(ilike(patterns.name, `%${query}%`), ilike(patterns.description, `%${query}%`))
            )
        );

    if (searchResults.length === 0) {
        return [];
    }

    // Fetch all pattern moves in one query
    const patternIds = searchResults.map(p => p.id);
    const allPatternMoves = await db
        .select({
            id: patternMoves.id,
            patternId: patternMoves.patternId,
            moveId: patternMoves.moveId,
            sequenceOrder: patternMoves.sequenceOrder,
            move: moves
        })
        .from(patternMoves)
        .innerJoin(moves, and(eq(patternMoves.moveId, moves.id), eq(moves.userId, userId)))
        .where(or(...patternIds.map(id => eq(patternMoves.patternId, id))))
        .orderBy(patternMoves.sequenceOrder);

    // Group pattern moves by pattern ID
    const patternMovesMap = new Map<number, typeof allPatternMoves>();
    for (const pm of allPatternMoves) {
        if (!patternMovesMap.has(pm.patternId)) {
            patternMovesMap.set(pm.patternId, []);
        }
        patternMovesMap.get(pm.patternId)!.push(pm);
    }

    // Assemble the final result
    return searchResults.map(pattern => ({
        ...pattern,
        moves: (patternMovesMap.get(pattern.id) || []) as PatternMove[]
    } as Pattern));
}
