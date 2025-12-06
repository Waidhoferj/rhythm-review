import { pgTable, serial, integer, text, timestamp, boolean, real } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Dance Moves Table
export const moves = pgTable('moves', {
	id: serial('id').primaryKey(),
	userId: text('user_id').notNull(),
	name: text('name').notNull(),
	description: text('description'),
	counts: integer('counts').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Patterns Table
export const patterns = pgTable('patterns', {
	id: serial('id').primaryKey(),
	userId: text('user_id').notNull(),
	name: text('name').notNull(),
	description: text('description'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Pattern Moves Junction Table (for ordering)
export const patternMoves = pgTable('pattern_moves', {
	id: serial('id').primaryKey(),
	patternId: integer('pattern_id')
		.notNull()
		.references(() => patterns.id, { onDelete: 'cascade' }),
	moveId: integer('move_id')
		.notNull()
		.references(() => moves.id, { onDelete: 'cascade' }),
	sequenceOrder: integer('sequence_order').notNull()
});

// Practice Sets Table
export const practiceSets = pgTable('practice_sets', {
	id: serial('id').primaryKey(),
	userId: text('user_id').notNull(),
	name: text('name').notNull(),
	description: text('description'),
	icon: text('icon'),
	tags: text('tags').array(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Practice Set Items Junction Table
export const practiceSetItems = pgTable('practice_set_items', {
	id: serial('id').primaryKey(),
	practiceSetId: integer('practice_set_id')
		.notNull()
		.references(() => practiceSets.id, { onDelete: 'cascade' }),
	itemType: text('item_type').notNull(), // 'move' or 'pattern'
	itemId: integer('item_id').notNull() // references either moves.id or patterns.id
});

// Practice Sessions Table
export const practiceSessions = pgTable('practice_sessions', {
	id: serial('id').primaryKey(),
	userId: text('user_id').notNull(),
	practiceSetId: integer('practice_set_id')
		.notNull()
		.references(() => practiceSets.id),
	startTime: timestamp('start_time').notNull(),
	endTime: timestamp('end_time'),
	duration: integer('duration'), // in seconds
	notes: text('notes'),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

// Practice Executions Table (individual move/pattern attempts)
export const practiceExecutions = pgTable('practice_executions', {
	id: serial('id').primaryKey(),
	sessionId: integer('session_id')
		.notNull()
		.references(() => practiceSessions.id, { onDelete: 'cascade' }),
	itemType: text('item_type').notNull(), // 'move' or 'pattern'
	itemId: integer('item_id').notNull(),
	success: boolean('success').notNull(),
	timestamp: timestamp('timestamp').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

// SM-2 Performance Tracking Table
export const sm2Performance = pgTable('sm2_performance', {
	id: serial('id').primaryKey(),
	userId: text('user_id').notNull(),
	itemType: text('item_type').notNull(),
	itemId: integer('item_id').notNull(),
	easinessFactor: real('easiness_factor').notNull().default(2.5),
	repetitions: integer('repetitions').notNull().default(0),
	interval: integer('interval').notNull().default(0),
	nextReviewDate: timestamp('next_review_date').notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Define relations for proper joins
export const movesRelations = relations(moves, ({ many }) => ({
	patternMoves: many(patternMoves)
}));

export const patternsRelations = relations(patterns, ({ many }) => ({
	patternMoves: many(patternMoves)
}));

export const patternMovesRelations = relations(patternMoves, ({ one }) => ({
	pattern: one(patterns, {
		fields: [patternMoves.patternId],
		references: [patterns.id]
	}),
	move: one(moves, {
		fields: [patternMoves.moveId],
		references: [moves.id]
	})
}));

export const practiceSetsRelations = relations(practiceSets, ({ many }) => ({
	items: many(practiceSetItems),
	sessions: many(practiceSessions)
}));

export const practiceSetItemsRelations = relations(practiceSetItems, ({ one }) => ({
	practiceSet: one(practiceSets, {
		fields: [practiceSetItems.practiceSetId],
		references: [practiceSets.id]
	})
}));

export const practiceSessionsRelations = relations(practiceSessions, ({ one, many }) => ({
	practiceSet: one(practiceSets, {
		fields: [practiceSessions.practiceSetId],
		references: [practiceSets.id]
	}),
	executions: many(practiceExecutions)
}));

export const practiceExecutionsRelations = relations(practiceExecutions, ({ one }) => ({
	session: one(practiceSessions, {
		fields: [practiceExecutions.sessionId],
		references: [practiceSessions.id]
	})
}));
