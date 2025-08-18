import { ChatStatus, UIMessage } from 'ai';
import { useEffect, useRef } from 'react';
import { useScrollToBottom } from '@/hooks/use-scroll-to-bottom';
import Message from './message';
import ThinkingMessage from './thinking-message';
import ScrollToBottomButton from './scroll-to-bottom-button';

function useAutoScroll({
    status,
    messages,
    scrollToBottom,
}: {
    status: ChatStatus;
    messages: UIMessage[];
    scrollToBottom: (scrollBehavior: ScrollBehavior) => void;
}) {
    const streamingRef = useRef(false);

    // Scroll to bottom on mount
    useEffect(() => {
        scrollToBottom('instant');
    }, []);

    // Scroll to bottom when a new message is submitted
    useEffect(() => {
        if (status === 'submitted') {
            scrollToBottom('instant');
        }
    }, [status, scrollToBottom]);

    // Scroll during streaming - simplified and more reliable
    useEffect(() => {
        if (status === 'streaming') {
            streamingRef.current = true;

            // Use a more efficient approach with throttled scrolling
            let animationId: number;

            const scrollDuringStreaming = () => {
                if (streamingRef.current) {
                    scrollToBottom('instant');
                    animationId = requestAnimationFrame(scrollDuringStreaming);
                }
            };

            // Start the scrolling loop
            animationId = requestAnimationFrame(scrollDuringStreaming);

            // Cleanup function to stop the animation loop
            return () => {
                streamingRef.current = false;
                if (animationId) {
                    cancelAnimationFrame(animationId);
                }
            };
        } else {
            streamingRef.current = false;
        }
    }, [status, scrollToBottom]);

    // Scroll when messages change during streaming
    useEffect(() => {
        if (status === 'streaming' && messages.length > 0) {
            scrollToBottom('instant');
        }
    }, [messages, status, scrollToBottom]);
}

export default function MessageList({ messages, status, isThinking }: { messages: UIMessage[]; status: ChatStatus; isThinking: boolean }) {
    const { containerRef, endRef, isAtBottom, scrollToBottom } = useScrollToBottom({ status });
    useAutoScroll({ status, messages, scrollToBottom });

    return (
        <div ref={containerRef} className="flex-1 p-4 overflow-y-auto">
            {messages.length === 0 && <NoMessages />}

            <div className="flex flex-col gap-6">
                {messages.map((message) => (
                    <Message key={message.id} message={message} status={status} />
                ))}
            </div>

            {isThinking && <ThinkingMessage className="mt-3" />}

            <div ref={endRef} className="shrink-0 min-w-[16px] min-h-[16px]" />

            {!isAtBottom && <ScrollToBottomButton scrollToBottom={scrollToBottom} />}
        </div>
    );
}

function NoMessages() {
    return <div>No messages</div>;
}
