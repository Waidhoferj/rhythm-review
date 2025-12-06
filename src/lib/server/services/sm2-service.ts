import { db } from '../db';
import { sm2Performance } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import type { SM2PerformanceData } from '$lib/types';
import { calculateSM2 } from '$lib/utils/sm2-algorithm';

/**
 * Initialize SM-2 data for a new item
 * @param userId - User ID
 * @param itemType - Type of item ('move' or 'pattern')
 * @param itemId - ID of the item
 * @returns Created SM-2 performance data
 */
export async function initializeSM2Data(
    userId: string,
    itemType: 'move' | 'pattern',
    itemId: number
): Promise<SM2PerformanceData> {
    const [sm2Data] = await db
        .insert(sm2Performance)
        .values({
            userId,
            itemType,
            itemId,
            easinessFactor: 2.5,
            repetitions: 0,
            interval: 0,
            nextReviewDate: new Date() // Due immediately
        })
        .returning();

    return sm2Data as SM2PerformanceData;
}

/**
 * Get SM-2 data for a specific item
 * @param userId - User ID
 * @param itemType - Type of item ('move' or 'pattern')
 * @param itemId - ID of the item
 * @returns SM-2 performance data or null if not found
 */
export async function getSM2Data(
    userId: string,
    itemType: 'move' | 'pattern',
    itemId: number
): Promise<SM2PerformanceData | null> {
    const [sm2Data] = await db
        .select()
        .from(sm2Performance)
        .where(
            and(
                eq(sm2Performance.userId, userId),
                eq(sm2Performance.itemType, itemType),
                eq(sm2Performance.itemId, itemId)
            )
        );

    return sm2Data ? (sm2Data as SM2PerformanceData) : null;
}

/**
 * Update SM-2 data based on practice performance
 * @param userId - User ID
 * @param itemType - Type of item ('move' or 'pattern')
 * @param itemId - ID of the item
 * @param quality - Quality score (0-5)
 * @returns Updated SM-2 performance data
 */
export async function updateSM2Data(
    userId: string,
    itemType: 'move' | 'pattern',
    itemId: number,
    quality: number
): Promise<SM2PerformanceData> {
    // Get current SM-2 data
    let currentData = await getSM2Data(userId, itemType, itemId);

    // Initialize if doesn't exist
    if (!currentData) {
        currentData = await initializeSM2Data(userId, itemType, itemId);
    }

    // Calculate new SM-2 values
    const newValues = calculateSM2(currentData, quality);

    // Update in database
    const [updatedData] = await db
        .update(sm2Performance)
        .set({
            easinessFactor: newValues.easinessFactor,
            repetitions: newValues.repetitions,
            interval: newValues.interval,
            nextReviewDate: newValues.nextReviewDate,
            updatedAt: new Date()
        })
        .where(eq(sm2Performance.id, currentData.id))
        .returning();

    return updatedData as SM2PerformanceData;
}


