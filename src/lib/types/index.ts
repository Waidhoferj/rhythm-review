// Core Types
export interface DanceMove {
    id: number;
    userId: string;
    name: string;
    description?: string;
    counts: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface Pattern {
    id: number;
    userId: string;
    name: string;
    description?: string;
    moves: PatternMove[];
    createdAt: Date;
    updatedAt: Date;
}

export interface PatternMove {
    id: number;
    patternId: number;
    moveId: number;
    sequenceOrder: number;
    move: DanceMove;
}

export interface PracticeSet {
    id: number;
    userId: string;
    name: string;
    description?: string;
    icon?: string;
    tags: string[];
    items: PracticeSetItem[];
    createdAt: Date;
    updatedAt: Date;
}

export interface PracticeSetItem {
    id: number;
    practiceSetId: number;
    itemType: 'move' | 'pattern';
    itemId: number;
    item: DanceMove | Pattern;
}

export interface PracticeSession {
    id: number;
    userId: string;
    practiceSetId: number;
    practiceSet: PracticeSet;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    notes?: string;
    executions: PracticeExecution[];
    createdAt: Date;
}

export interface PracticeExecution {
    id: number;
    sessionId: number;
    itemType: 'move' | 'pattern';
    itemId: number;
    success: boolean;
    timestamp: Date;
    item: DanceMove | Pattern;
}

export interface SM2PerformanceData {
    id: number;
    userId: string;
    itemType: 'move' | 'pattern';
    itemId: number;
    easinessFactor: number;
    repetitions: number;
    interval: number;
    nextReviewDate: Date;
    updatedAt: Date;
}

// Practice Session Statistics
export interface SessionStatistics {
    duration: number;
    totalExecutions: number;
    successfulExecutions: number;
    successRate: number;
    bestMoves: Array<{ item: DanceMove | Pattern; successRate: number }>;
    worstMoves: Array<{ item: DanceMove | Pattern; successRate: number }>;
}

// Overall User Statistics
export interface UserStatistics {
    totalSessions: number;
    totalPracticeTime: number;
    overallSuccessRate: number;
    mostPracticedMoves: Array<{ item: DanceMove | Pattern; count: number }>;
    recentSessions: PracticeSession[];
}
