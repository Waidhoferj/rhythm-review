import { db } from '../db';
import { moves } from '../db/schema';
import { eq, and, or, ilike } from 'drizzle-orm';
import type { DanceMove } from '$lib/types';

export interface CreateMoveData {
    name: string;
    description?: string;
    counts: number;
}

export interface UpdateMoveData {
    name?: string;
    description?: string;
    counts?: number;
}

export async function createMove(userId: string, data: CreateMoveData): Promise<DanceMove> {
    const [move] = await db
        .insert(moves)
        .values({
            userId,
            name: data.name,
            description: data.description,
            counts: data.counts
        })
        .returning();

    return move as DanceMove;
}

export async function getMove(id: number, userId: string): Promise<DanceMove | null> {
    const [move] = await db
        .select()
        .from(moves)
        .where(and(eq(moves.id, id), eq(moves.userId, userId)));

    return move ? (move as DanceMove) : null;
}

export async function getMovesByUser(userId: string): Promise<DanceMove[]> {
    const userMoves = await db.select().from(moves).where(eq(moves.userId, userId));

    return userMoves as DanceMove[];
}

export async function updateMove(
    id: number,
    userId: string,
    data: UpdateMoveData
): Promise<DanceMove | null> {
    const [updatedMove] = await db
        .update(moves)
        .set({
            ...data,
            updatedAt: new Date()
        })
        .where(and(eq(moves.id, id), eq(moves.userId, userId)))
        .returning();

    return updatedMove ? (updatedMove as DanceMove) : null;
}

export async function deleteMove(id: number, userId: string): Promise<boolean> {
    const result = await db
        .delete(moves)
        .where(and(eq(moves.id, id), eq(moves.userId, userId)))
        .returning();

    return result.length > 0;
}

export async function searchMoves(userId: string, query: string): Promise<DanceMove[]> {
    const searchResults = await db
        .select()
        .from(moves)
        .where(
            and(
                eq(moves.userId, userId),
                or(ilike(moves.name, `%${query}%`), ilike(moves.description, `%${query}%`))
            )
        );

    return searchResults as DanceMove[];
}
