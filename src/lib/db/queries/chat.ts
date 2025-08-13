import 'server-only';

import { db } from '@/lib/db';
import { chat, message as dbMessage } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { UIMessage } from 'ai';

export async function getChatById({ id }: { id: string }) {
    try {
        const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
        return selectedChat;
    } catch (error) {
        console.error('error while getting chat by id:', error);
        throw new Error('bad_request:database. Failed to get chat by id');
    }
}

export async function getMessagesForChat({ id }: { id: string }) {
    try {
        const messages = await db.select().from(dbMessage).where(eq(dbMessage.chatId, id));
        return messages;
    } catch (error) {
        console.error('error while getting messages for chat:', error);
        throw new Error('bad_request:database. Failed to get messages for chat');
    }
}

export async function saveMessage({ chatId, message }: { chatId: string; message: UIMessage }) {
    try {
        await db.insert(dbMessage).values({
            // id: newMessage.id,
            chatId,
            role: message.role,
            parts: message.parts,
            attachments: [],
        });
    } catch (error) {
        console.error('error while saving message:', error);
        throw new Error('bad_request:database. Failed to save message');
    }
}
