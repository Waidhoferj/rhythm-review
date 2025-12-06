import type { SM2PerformanceData, DanceMove, Pattern } from '$lib/types';

export interface SM2Result {
    easinessFactor: number;
    repetitions: number;
    interval: number;
    nextReviewDate: Date;
}

/**
 * Calculate SM-2 spaced repetition values based on performance quality
 * @param currentData - Current SM-2 performance data
 * @param quality - Quality score from 0-5 (0 = complete failure, 5 = perfect)
 * @returns Updated SM-2 values
 */
export function calculateSM2(currentData: SM2PerformanceData, quality: number): SM2Result {
    let { easinessFactor, repetitions, interval } = currentData;

    // Update easiness factor
    easinessFactor = Math.max(
        1.3,
        easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );

    // Update repetitions and interval
    if (quality < 3) {
        // Failed - reset repetitions
        repetitions = 0;
        interval = 1;
    } else {
        // Passed - increment repetitions
        repetitions += 1;
        if (repetitions === 1) {
            interval = 1;
        } else if (repetitions === 2) {
            interval = 6;
        } else {
            interval = Math.round(interval * easinessFactor);
        }
    }

    // Calculate next review date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    return { easinessFactor, repetitions, interval, nextReviewDate };
}

/**
 * Convert swipe result to SM-2 quality score
 * @param success - True for right swipe (success), false for left swipe (failure)
 * @returns Quality score (4 for success, 2 for failure)
 */
export function swipeToQuality(success: boolean): number {
    return success ? 4 : 2;
}

export interface ItemWithSM2Data {
    item: DanceMove | Pattern;
    sm2Data: SM2PerformanceData;
}

/**
 * Select the next item for practice based on SM-2 algorithm
 * @param availableItems - Array of items with their SM-2 data
 * @param currentTime - Current timestamp
 * @returns Selected item for practice
 */
export function selectNextItem(
    availableItems: ItemWithSM2Data[],
    currentTime: Date = new Date()
): DanceMove | Pattern | null {
    if (availableItems.length === 0) {
        return null;
    }

    // Calculate priority scores (items due for review get higher priority)
    const scoredItems = availableItems.map(({ item, sm2Data }) => {
        const daysSinceReview = Math.floor(
            (currentTime.getTime() - sm2Data.nextReviewDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        // Items overdue get positive priority, items not due yet get negative priority
        const priority = daysSinceReview > 0 ? daysSinceReview * (3 - sm2Data.easinessFactor) : daysSinceReview;
        return { item, priority };
    });

    // Sort by priority (highest first)
    scoredItems.sort((a, b) => b.priority - a.priority);

    // Select from top 3 items randomly to add variety
    const topItems = scoredItems.slice(0, Math.min(3, scoredItems.length));
    const selectedIndex = Math.floor(Math.random() * topItems.length);

    return topItems[selectedIndex].item;
}
