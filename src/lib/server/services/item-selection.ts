import { db } from '../db';
import { practiceSetItems, moves, patterns, patternMoves, practiceExecutions } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { DanceMove, Pattern, PatternMove } from '$lib/types';
import {
    type SelectionContext,
    type SelectionStrategy,
    type StrategyName,
    getStrategy
} from './selection-strategies';
import { getSM2Data, initializeSM2Data } from './sm2-service';

/**
 * Get the next item to practice from a practice set using the specified strategy
 * @param userId - User ID
 * @param practiceSetId - Practice set ID
 * @param strategyName - Name of the selection strategy to use
 * @param sessionId - Optional session ID for context (used by some strategies)
 * @param previousItem - Optional previous item and result for context
 * @returns Next item to practice or null if no items available
 */
export async function getNextItem(
    userId: string,
    practiceSetId: number,
    strategyName: StrategyName = 'sequential',
    sessionId?: number,
    previousItem?: {
        itemType: 'move' | 'pattern';
        itemId: number;
        success: boolean;
    }
): Promise<DanceMove | Pattern | null> {
    // Get all items in the practice set
    const items = await db
        .select()
        .from(practiceSetItems)
        .where(eq(practiceSetItems.practiceSetId, practiceSetId));

    if (items.length === 0) {
        return null;
    }

    // Fetch item details and SM-2 data for each item
    const availableItems: SelectionContext['availableItems'] = [];

    for (const item of items) {
        // Fetch item details
        let itemDetails: DanceMove | Pattern | null = null;

        if (item.itemType === 'move') {
            const [move] = await db.select().from(moves).where(eq(moves.id, item.itemId));
            itemDetails = move as DanceMove;
        } else {
            const [pattern] = await db.select().from(patterns).where(eq(patterns.id, item.itemId));
            if (pattern) {
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
                    .where(eq(patternMoves.patternId, item.itemId))
                    .orderBy(patternMoves.sequenceOrder);

                itemDetails = {
                    ...pattern,
                    moves: patternMovesData as PatternMove[]
                } as Pattern;
            }
        }

        if (!itemDetails) continue;

        // Get or initialize SM-2 data (for strategies that need it)
        let sm2Data = await getSM2Data(userId, item.itemType as 'move' | 'pattern', item.itemId);
        if (!sm2Data && strategyName === 'sm2') {
            sm2Data = await initializeSM2Data(userId, item.itemType as 'move' | 'pattern', item.itemId);
        }

        availableItems.push({
            item: itemDetails,
            itemType: item.itemType as 'move' | 'pattern',
            itemId: item.itemId,
            sm2Data: sm2Data || undefined
        });
    }

    // Build selection context
    const context: SelectionContext = {
        userId,
        practiceSetId,
        availableItems
    };

    // Add previous item if provided
    if (previousItem) {
        const prevItemDetails = availableItems.find(
            (item) => item.itemType === previousItem.itemType && item.itemId === previousItem.itemId
        );
        if (prevItemDetails) {
            context.previousItem = {
                item: prevItemDetails.item,
                itemType: previousItem.itemType,
                itemId: previousItem.itemId,
                success: previousItem.success
            };
        }
    }

    // Add session history if session ID provided (for weighted strategies)
    if (sessionId) {
        const executions = await db
            .select()
            .from(practiceExecutions)
            .where(eq(practiceExecutions.sessionId, sessionId))
            .orderBy(practiceExecutions.timestamp);

        context.sessionHistory = executions.map((e) => ({
            itemType: e.itemType as 'move' | 'pattern',
            itemId: e.itemId,
            success: e.success,
            timestamp: e.timestamp
        }));
    }

    // Get the strategy and select next item
    const strategy = getStrategy(strategyName);
    return strategy.selectNext(context);
}

/**
 * Get information about a specific strategy
 * @param strategyName - Name of the strategy
 * @returns Strategy information
 */
export function getStrategyInfo(strategyName: StrategyName): SelectionStrategy {
    return getStrategy(strategyName);
}

/**
 * Get all available selection strategies
 * @returns Array of all strategies with their info
 */
export function getAllStrategyInfo(): SelectionStrategy[] {
    return [
        getStrategy('sequential'),
        getStrategy('random'),
        getStrategy('weighted-random'),
        getStrategy('sm2'),
        getStrategy('repeat-failed')
    ];
}
