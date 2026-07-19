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

// Frontend-only practice session types
export interface PracticeQueueItem {
	itemType: 'move' | 'pattern';
	itemId: number;
	item: DanceMove | Pattern;
	successes: number;
	failures: number;
}
