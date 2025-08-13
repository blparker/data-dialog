import { aiProvider } from '@/lib/ai/providers';
import { getChatById, saveMessage } from '@/lib/db/queries/chat';
import { convertToModelMessages, streamText, UIMessage, generateId } from 'ai';

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

    const result = streamText({
        model: aiProvider.languageModel('chat-model-reasoning-local'),
        system: 'You are a helpful assistant.',
        messages: convertToModelMessages(messages),
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
