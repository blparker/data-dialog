import { getChatById } from '@/lib/db/queries/chat';
import { notFound } from 'next/navigation';
import ChatLayout from '../../_components/chat-layout';

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const chat = await getChatById({ id });

    if (!chat) {
        notFound();
    }

    return <ChatLayout chatId={id} />;
}
