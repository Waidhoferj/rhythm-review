import type { DanceMove, Pattern, SM2PerformanceData } from '$lib/types';
import { selectNextItem as sm2SelectNextItem } from '$lib/utils/sm2-algorithm';

export interface SelectionContext {
    userId: string;
    practiceSetId: number;
    availableItems: Array<{
        item: DanceMove | Pattern;
        itemType: 'move' | 'pattern';
        itemId: number;
        sm2Data?: SM2PerformanceData;
    }>;
    previousItem?: {
        item: DanceMove | Pattern;
        itemType: 'move' | 'pattern';
        itemId: number;
        success: boolean;
    };
    sessionHistory?: Array<{
        itemType: 'move' | 'pattern';
        itemId: number;
        success: boolean;
        timestamp: Date;
    }>;
}

export interface SelectionStrategy {
    name: string;
    description: string;
    selectNext(context: SelectionContext): DanceMove | Pattern | null;
}

/**
 * Sequential strategy - goes through items in order
 */
export class SequentialStrategy implements SelectionStrategy {
    name = 'sequential';
    description = 'Practice items in order, one after another';

    selectNext(context: SelectionContext): DanceMove | Pattern | null {
        if (context.availableItems.length === 0) {
            return null;
        }

        // If no previous item, start with first
        if (!context.previousItem) {
            return context.availableItems[0].item;
        }

        // Find the previous item's index
        const previousIndex = context.availableItems.findIndex(
            (item) =>
                item.itemType === context.previousItem!.itemType &&
                item.itemId === context.previousItem!.itemId
        );

        // Move to next item, wrapping around to start
        const nextIndex = (previousIndex + 1) % context.availableItems.length;
        return context.availableItems[nextIndex].item;
    }
}

/**
 * Random strategy - selects items randomly
 */
export class RandomStrategy implements SelectionStrategy {
    name = 'random';
    description = 'Practice items in random order';

    selectNext(context: SelectionContext): DanceMove | Pattern | null {
        if (context.availableItems.length === 0) {
            return null;
        }

        // Select a random item
        const randomIndex = Math.floor(Math.random() * context.availableItems.length);
        return context.availableItems[randomIndex].item;
    }
}

/**
 * Weighted random strategy - items with lower success rates appear more often
 */
export class WeightedRandomStrategy implements SelectionStrategy {
    name = 'weighted-random';
    description = 'Practice items randomly, with more focus on items you struggle with';

    selectNext(context: SelectionContext): DanceMove | Pattern | null {
        if (context.availableItems.length === 0) {
            return null;
        }

        if (!context.sessionHistory || context.sessionHistory.length === 0) {
            // No history yet, use random selection
            const randomIndex = Math.floor(Math.random() * context.availableItems.length);
            return context.availableItems[randomIndex].item;
        }

        // Calculate success rates for each item
        const itemStats = new Map<string, { total: number; successful: number }>();

        for (const execution of context.sessionHistory) {
            const key = `${execution.itemType}-${execution.itemId}`;
            if (!itemStats.has(key)) {
                itemStats.set(key, { total: 0, successful: 0 });
            }
            const stats = itemStats.get(key)!;
            stats.total += 1;
            if (execution.success) {
                stats.successful += 1;
            }
        }

        // Calculate weights (lower success rate = higher weight)
        const weights = context.availableItems.map((item) => {
            const key = `${item.itemType}-${item.itemId}`;
            const stats = itemStats.get(key);

            if (!stats) {
                // Not practiced yet, give high weight
                return 1.0;
            }

            const successRate = stats.successful / stats.total;
            // Invert success rate so lower success = higher weight
            // Add 0.2 minimum so even mastered items can still appear
            return 1.2 - successRate;
        });

        // Select based on weights
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        let random = Math.random() * totalWeight;

        for (let i = 0; i < context.availableItems.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return context.availableItems[i].item;
            }
        }

        // Fallback to last item
        return context.availableItems[context.availableItems.length - 1].item;
    }
}

/**
 * SM-2 spaced repetition strategy
 */
export class SM2Strategy implements SelectionStrategy {
    name = 'sm2';
    description = 'Spaced repetition algorithm that schedules reviews based on your performance';

    selectNext(context: SelectionContext): DanceMove | Pattern | null {
        if (context.availableItems.length === 0) {
            return null;
        }

        // Filter items that have SM-2 data
        const itemsWithSM2 = context.availableItems
            .filter((item) => item.sm2Data)
            .map((item) => ({
                item: item.item,
                sm2Data: item.sm2Data!
            }));

        if (itemsWithSM2.length === 0) {
            // No SM-2 data yet, fall back to first item
            return context.availableItems[0].item;
        }

        // Use the SM-2 algorithm's selection logic
        return sm2SelectNextItem(itemsWithSM2);
    }
}

/**
 * Repeat failed strategy - focuses on items that were just failed
 */
export class RepeatFailedStrategy implements SelectionStrategy {
    name = 'repeat-failed';
    description = 'Immediately retry items you fail until you succeed';

    selectNext(context: SelectionContext): DanceMove | Pattern | null {
        if (context.availableItems.length === 0) {
            return null;
        }

        // If previous item was failed, repeat it
        if (context.previousItem && !context.previousItem.success) {
            return context.previousItem.item;
        }

        // Otherwise, go to next item sequentially
        if (!context.previousItem) {
            return context.availableItems[0].item;
        }

        const previousIndex = context.availableItems.findIndex(
            (item) =>
                item.itemType === context.previousItem!.itemType &&
                item.itemId === context.previousItem!.itemId
        );

        const nextIndex = (previousIndex + 1) % context.availableItems.length;
        return context.availableItems[nextIndex].item;
    }
}

// Registry of available strategies
export const SELECTION_STRATEGIES: Record<string, SelectionStrategy> = {
    sequential: new SequentialStrategy(),
    random: new RandomStrategy(),
    'weighted-random': new WeightedRandomStrategy(),
    sm2: new SM2Strategy(),
    'repeat-failed': new RepeatFailedStrategy()
};

export type StrategyName = keyof typeof SELECTION_STRATEGIES;

/**
 * Get a selection strategy by name
 */
export function getStrategy(name: StrategyName): SelectionStrategy {
    return SELECTION_STRATEGIES[name];
}

/**
 * Get all available strategies
 */
export function getAllStrategies(): SelectionStrategy[] {
    return Object.values(SELECTION_STRATEGIES);
}
