import { db } from '@/lib/db';
import { TransformationStep, transformationStep } from '../schema';
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
