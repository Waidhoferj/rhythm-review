import { db } from '../db';
import {
    practiceSessions,
    practiceExecutions,
    practiceSets,
    practiceSetItems,
    moves,
    patterns,
    patternMoves
} from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import type {
    PracticeSession,
    PracticeExecution,
    SessionStatistics,
    DanceMove,
    Pattern,
    PatternMove,
    PracticeSet,
    PracticeSetItem
} from '$lib/types';

/**
 * Start a new practice session
 * @param userId - User ID
 * @param practiceSetId - Practice set ID
 * @returns Created practice session
 */
export async function startSession(
    userId: string,
    practiceSetId: number
): Promise<PracticeSession> {
    const [session] = await db
        .insert(practiceSessions)
        .values({
            userId,
            practiceSetId,
            startTime: new Date()
        })
        .returning();

    // Fetch the complete session with practice set
    return getSession(session.id, userId) as Promise<PracticeSession>;
}

/**
 * Record a move/pattern execution during practice
 * @param sessionId - Session ID
 * @param itemType - Type of item ('move' or 'pattern')
 * @param itemId - ID of the item
 * @param success - Whether the execution was successful
 * @returns Created practice execution
 */
export async function recordExecution(
    sessionId: number,
    itemType: 'move' | 'pattern',
    itemId: number,
    success: boolean
): Promise<PracticeExecution> {
    const [execution] = await db
        .insert(practiceExecutions)
        .values({
            sessionId,
            itemType,
            itemId,
            success,
            timestamp: new Date()
        })
        .returning();

    // Fetch item details
    let itemDetails: DanceMove | Pattern | null = null;

    if (itemType === 'move') {
        const [move] = await db.select().from(moves).where(eq(moves.id, itemId));
        itemDetails = move as DanceMove;
    } else {
        const [pattern] = await db.select().from(patterns).where(eq(patterns.id, itemId));
        if (pattern) {
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

            itemDetails = {
                ...pattern,
                moves: patternMovesData as PatternMove[]
            } as Pattern;
        }
    }

    return {
        ...execution,
        item: itemDetails
    } as PracticeExecution;
}

/**
 * End a practice session and calculate statistics
 * @param sessionId - Session ID
 * @returns Updated practice session with statistics
 */
export async function endSession(sessionId: number): Promise<PracticeSession> {
    const endTime = new Date();

    // Get session start time
    const [session] = await db
        .select()
        .from(practiceSessions)
        .where(eq(practiceSessions.id, sessionId));

    if (!session) {
        throw new Error('Session not found');
    }

    // Calculate duration in seconds
    const duration = Math.floor((endTime.getTime() - session.startTime.getTime()) / 1000);

    // Update session with end time and duration
    await db
        .update(practiceSessions)
        .set({
            endTime,
            duration
        })
        .where(eq(practiceSessions.id, sessionId));

    // Fetch and return the complete session
    return getSession(sessionId, session.userId) as Promise<PracticeSession>;
}

/**
 * Get a practice session by ID
 * @param id - Session ID
 * @param userId - User ID for authorization
 * @returns Practice session with executions or null
 */
export async function getSession(id: number, userId: string): Promise<PracticeSession | null> {
    const [session] = await db
        .select()
        .from(practiceSessions)
        .where(and(eq(practiceSessions.id, id), eq(practiceSessions.userId, userId)));

    if (!session) {
        return null;
    }

    // Fetch practice set
    const [practiceSet] = await db
        .select()
        .from(practiceSets)
        .where(eq(practiceSets.id, session.practiceSetId));

    // Fetch practice set items
    const items = await db
        .select()
        .from(practiceSetItems)
        .where(eq(practiceSetItems.practiceSetId, session.practiceSetId));

    const itemsWithDetails = await Promise.all(
        items.map(async (item) => {
            let itemDetails: DanceMove | Pattern | null = null;

            if (item.itemType === 'move') {
                const [move] = await db.select().from(moves).where(eq(moves.id, item.itemId));
                itemDetails = move as DanceMove;
            } else {
                const [pattern] = await db.select().from(patterns).where(eq(patterns.id, item.itemId));
                if (pattern) {
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
                        .where(eq(patternMoves.patternId, item.itemId))
                        .orderBy(patternMoves.sequenceOrder);

                    itemDetails = {
                        ...pattern,
                        moves: patternMovesData as PatternMove[]
                    } as Pattern;
                }
            }

            return {
                ...item,
                item: itemDetails
            } as PracticeSetItem;
        })
    );

    // Fetch executions
    const executionsData = await db
        .select()
        .from(practiceExecutions)
        .where(eq(practiceExecutions.sessionId, id))
        .orderBy(practiceExecutions.timestamp);

    const executionsWithDetails = await Promise.all(
        executionsData.map(async (execution) => {
            let itemDetails: DanceMove | Pattern | null = null;

            if (execution.itemType === 'move') {
                const [move] = await db.select().from(moves).where(eq(moves.id, execution.itemId));
                itemDetails = move as DanceMove;
            } else {
                const [pattern] = await db
                    .select()
                    .from(patterns)
                    .where(eq(patterns.id, execution.itemId));
                if (pattern) {
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
                        .where(eq(patternMoves.patternId, execution.itemId))
                        .orderBy(patternMoves.sequenceOrder);

                    itemDetails = {
                        ...pattern,
                        moves: patternMovesData as PatternMove[]
                    } as Pattern;
                }
            }

            return {
                ...execution,
                item: itemDetails
            } as PracticeExecution;
        })
    );

    return {
        ...session,
        practiceSet: {
            ...practiceSet,
            items: itemsWithDetails
        } as PracticeSet,
        executions: executionsWithDetails
    } as PracticeSession;
}

/**
 * Get all practice sessions for a user
 * @param userId - User ID
 * @returns Array of practice sessions
 */
export async function getSessionsByUser(userId: string): Promise<PracticeSession[]> {
    const sessions = await db
        .select()
        .from(practiceSessions)
        .where(eq(practiceSessions.userId, userId))
        .orderBy(desc(practiceSessions.startTime));

    // Fetch complete data for each session
    const sessionsWithDetails = await Promise.all(
        sessions.map(async (session) => {
            return getSession(session.id, userId);
        })
    );

    return sessionsWithDetails.filter((s) => s !== null) as PracticeSession[];
}

/**
 * Update session notes
 * @param sessionId - Session ID
 * @param userId - User ID for authorization
 * @param notes - Notes text
 * @returns Updated practice session
 */
export async function updateSessionNotes(
    sessionId: number,
    userId: string,
    notes: string
): Promise<PracticeSession | null> {
    // Check authorization
    const [session] = await db
        .select()
        .from(practiceSessions)
        .where(and(eq(practiceSessions.id, sessionId), eq(practiceSessions.userId, userId)));

    if (!session) {
        return null;
    }

    // Update notes
    await db.update(practiceSessions).set({ notes }).where(eq(practiceSessions.id, sessionId));

    // Fetch and return updated session
    return getSession(sessionId, userId);
}

/**
 * Calculate session statistics
 * @param sessionId - Session ID
 * @returns Session statistics
 */
export async function calculateSessionStats(sessionId: number): Promise<SessionStatistics> {
    // Get session
    const [session] = await db.select().from(practiceSessions).where(eq(practiceSessions.id, sessionId));

    if (!session) {
        throw new Error('Session not found');
    }

    // Get all executions
    const executions = await db
        .select()
        .from(practiceExecutions)
        .where(eq(practiceExecutions.sessionId, sessionId));

    const totalExecutions = executions.length;
    const successfulExecutions = executions.filter((e) => e.success).length;
    const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;

    // Calculate per-item statistics
    const itemStats = new Map<
        string,
        { item: DanceMove | Pattern; total: number; successful: number }
    >();

    for (const execution of executions) {
        const key = `${execution.itemType}-${execution.itemId}`;

        if (!itemStats.has(key)) {
            // Fetch item details
            let itemDetails: DanceMove | Pattern | null = null;

            if (execution.itemType === 'move') {
                const [move] = await db.select().from(moves).where(eq(moves.id, execution.itemId));
                itemDetails = move as DanceMove;
            } else {
                const [pattern] = await db
                    .select()
                    .from(patterns)
                    .where(eq(patterns.id, execution.itemId));
                if (pattern) {
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
                        .where(eq(patternMoves.patternId, execution.itemId))
                        .orderBy(patternMoves.sequenceOrder);

                    itemDetails = {
                        ...pattern,
                        moves: patternMovesData as PatternMove[]
                    } as Pattern;
                }
            }

            if (itemDetails) {
                itemStats.set(key, { item: itemDetails, total: 0, successful: 0 });
            }
        }

        const stats = itemStats.get(key);
        if (stats) {
            stats.total += 1;
            if (execution.success) {
                stats.successful += 1;
            }
        }
    }

    // Calculate success rates and sort
    const itemsWithRates = Array.from(itemStats.values())
        .map((stats) => ({
            item: stats.item,
            successRate: stats.total > 0 ? (stats.successful / stats.total) * 100 : 0
        }))
        .sort((a, b) => b.successRate - a.successRate);

    const bestMoves = itemsWithRates.slice(0, 3);
    const worstMoves = itemsWithRates.slice(-3).reverse();

    return {
        duration: session.duration || 0,
        totalExecutions,
        successfulExecutions,
        successRate,
        bestMoves,
        worstMoves
    };
}
