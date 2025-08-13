import { getChatById, getMessagesForChat } from '@/lib/db/queries/chat';
import { notFound } from 'next/navigation';
import ChatLayout from '../../_components/chat-layout';
import { stepsForChatId } from '@/lib/db/queries/steps';
import { computePreviewSteps, sortTransformationSteps } from '@/lib/step-lib';
import { DataSource, DBMessage, TransformationStep } from '@/lib/db/schema';
import { dataSourcesForPreviewSteps } from '@/lib/db/actions/steps';
import { UIMessage } from 'ai';

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const chat = await getChatById({ id });

    if (!chat) {
        notFound();
    }

    const messages = await getMessagesForChat({ id });
    const steps = sortTransformationSteps(await stepsForChatId({ chatId: id }));
    const previewSteps = await dataSourcesForPreviewSteps({ steps });

    return <ChatLayout chatId={id} steps={steps} previewSteps={previewSteps} initialMessages={convertToUIMessages(messages)} />;
}

function convertToUIMessages(messages: Array<DBMessage>): Array<UIMessage> {
    return messages.map((message) => ({
        id: message.id,
        parts: message.parts as UIMessage['parts'],
        role: message.role as UIMessage['role'],
        content: '',
        createdAt: message.createdAt,
    }));
}
