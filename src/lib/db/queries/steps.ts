import 'server-only';

import { db } from '@/lib/db';
import { NewTransformationStep, TransformationStep, transformationStep } from '../schema';
import { eq } from 'drizzle-orm';

export async function stepsForChatId({ chatId }: { chatId: string }): Promise<TransformationStep[]> {
    try {
        const steps = await db.select().from(transformationStep).where(eq(transformationStep.chatId, chatId));
        return steps;
    } catch (error) {
        console.error('error while getting transformation steps for chat:', error);
        throw new Error('bad_request:database. Failed to get transformation steps for chat');
    }
}

export async function createStep({ newStep }: { newStep: NewTransformationStep }): Promise<TransformationStep> {
    try {
        const [step] = await db.insert(transformationStep).values(newStep).returning();
        return step;
    } catch (error) {
        console.error('error while creating transformation step:', error);
        throw new Error('bad_request:database. Failed to create transformation step');
    }
}
