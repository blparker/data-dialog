import systemPrompt from '@/lib/ai/prompts';
import { aiProvider } from '@/lib/ai/providers';
import { createTools } from '@/lib/ai/tools';
import { dataSourcesForPreviewSteps } from '@/lib/db/actions/steps';
import { getChatById, saveMessage } from '@/lib/db/queries/chat';
import { stepsForChatId } from '@/lib/db/queries/steps';
import { sortTransformationSteps } from '@/lib/step-lib';
import { convertToModelMessages, streamText, UIMessage, generateId, stepCountIs } from 'ai';

export async function POST(req: Request) {
    const { id, messages }: { id: string; messages: UIMessage[] } = await req.json();

    const userMessage = messages.at(-1);
    if (!userMessage) {
        return new Response('User message not found', { status: 404 });
    }

    await saveMessage({ chatId: id, message: userMessage });

    const chat = await getChatById({ id });
    if (!chat) {
        // TODO: create a new chat
        return new Response('Chat not found', { status: 404 });
    }

    const steps = sortTransformationSteps(await stepsForChatId({ chatId: id }));
    const previewDataSources = (await dataSourcesForPreviewSteps({ steps }))
        .filter(({ dataSource }) => dataSource !== null)
        .map(({ dataSource }) => dataSource!);

    const result = streamText({
        model: aiProvider.languageModel('chat-model-reasoning-local'),
        // system: 'You are a helpful assistant.',
        system: systemPrompt(),
        tools: createTools({ chatId: chat.id, selectedDataSources: previewDataSources }),
        messages: convertToModelMessages(messages),
        stopWhen: stepCountIs(3),
    });

    return result.toUIMessageStreamResponse({
        originalMessages: messages,
        generateMessageId: () => generateId(),
        onFinish: async ({ messages, responseMessage }) => {
            // console.log('*** onFinish, responseMessage:');
            // console.dir(responseMessage, { depth: null });
            // console.log('*** onFinish, messages:');
            // console.dir(messages, { depth: null });

            saveMessage({ chatId: chat.id, message: responseMessage });
        },
    });
}
