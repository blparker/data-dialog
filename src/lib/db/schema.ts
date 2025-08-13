import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { pgTable, varchar, timestamp, json, uuid, text, integer, AnyPgColumn } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { StepTypes, StepData } from '@/lib/types/steps';

export const dataSource = pgTable('DataSource', {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    title: text('title').notNull(),
    contentType: varchar('contentType').default('text').notNull(),
    url: text('url').default('').notNull(),
    size: integer('size').default(0).notNull(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type DataSource = InferSelectModel<typeof dataSource>;
export type NewDataSource = InferInsertModel<typeof dataSource>;

export const chat = pgTable('Chat', {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    createdAt: timestamp('createdAt').notNull(),
    title: text('title').notNull(),
    analysisDb: text('analysisDb'),
});

export type Chat = InferSelectModel<typeof chat>;
export type NewChat = InferInsertModel<typeof chat>;

export const message = pgTable('Message', {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    chatId: uuid('chatId')
        .notNull()
        .references(() => chat.id),
    role: varchar('role').notNull(),
    parts: json('parts').notNull(),
    attachments: json('attachments').notNull().default([]),
    createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
});

export type DBMessage = InferSelectModel<typeof message>;

export const user = pgTable('User', {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull(),
    providerId: varchar('providerId', { length: 255 }).notNull(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type User = InferSelectModel<typeof user>;
export type NewUser = InferInsertModel<typeof user>;

export const transformationStep = pgTable('TransformationStep', {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    chatId: uuid('chatId')
        .notNull()
        .references(() => chat.id),
    parentStepId: uuid('parentStepId').references((): AnyPgColumn => transformationStep.id),
    type: varchar('type', { enum: [...StepTypes, 'dynamic'] }).notNull(),
    data: json('data').$type<StepData>().notNull(),
    sql: text('sql'),
    reads: json('reads').$type<string[]>().notNull().default([]),
    writes: varchar('writes').notNull(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type TransformationStep = InferSelectModel<typeof transformationStep>;
export type NewTransformationStep = InferInsertModel<typeof transformationStep>;
export type UpdateTransformationStep = Partial<InferSelectModel<typeof transformationStep>>;

/**
 * Relations
 */

export const chatRelations = relations(chat, ({ many }) => ({
    messages: many(message),
    transformationSteps: many(transformationStep),
}));

export const messageRelations = relations(message, ({ one }) => ({
    chat: one(chat, {
        fields: [message.chatId],
        references: [chat.id],
    }),
}));
