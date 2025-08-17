import { useScrollToBottom } from '@/hooks/use-scroll-to-bottom';
import { useChat } from '@ai-sdk/react';
import type { ChatStatus, UIMessage } from 'ai';
import { useEffect, useRef } from 'react';
import MessageInput from './message-input';
import Message from './message';
import ThinkingMessage from './thinking-message';
import ScrollToBottomButton from './scroll-to-bottom-button';
import MessageList from './messages-list';

export default function ChatPane({ chatId, initialMessages }: { chatId: string; initialMessages: UIMessage[] }) {
    const { messages, sendMessage, status, stop } = useChat({
        id: chatId,
        messages: initialMessages,
    });

    const isThinking = showThinkingMessage(status, messages);

    return (
        <div className="flex flex-col min-w-0 h-dvh">
            <MessageList messages={messages} status={status} isThinking={isThinking} />
            <form>
                <MessageInput status={status} isThinking={isThinking} sendMessage={(text) => sendMessage({ text })} stop={stop} />
            </form>
        </div>
    );
}

function showThinkingMessage(status: ChatStatus, messages: UIMessage[]) {
    if (status == 'ready') {
        return false;
    } else if (status === 'submitted') {
        return true;
    } else if (status === 'streaming') {
        const lastMessage = messages.at(-1);
        if (!lastMessage) {
            return true;
        }

        const { role, parts } = lastMessage;
        const textIsEmpty = parts.some((part) => part.type === 'text' && part.text.trim().length === 0);

        if (role === 'assistant' && parts.length === 0) {
            return true;
        } else if (role === 'assistant' && parts.length > 0 && textIsEmpty) {
            return true;
        }
    }

    return false;
}
