import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Textarea } from '@/components/ui/textarea';
import { useScrollToBottom } from '@/hooks/use-scroll-to-bottom';
import { cn } from '@/lib/utils';
import { useChat } from '@ai-sdk/react';
import type { ChatStatus, UIMessage } from 'ai';
import { ArrowDown, ChevronRight, CircleStop, Loader, SendHorizonal } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MarkedMarkdown } from './marked-markdown';
import { Markdown } from './markdown';
import { AnimatedShinyText } from '@/components/magicui/animated-shiny-text';

export default function ChatPane({ chatId, initialMessages }: { chatId: string; initialMessages: UIMessage[] }) {
    const { messages, sendMessage, status, stop } = useChat({
        id: chatId,
        messages: initialMessages,
    });

    const isThinking = showThinkingMessage(status, messages);
    // console.log(
    //     `*** Status: [${status}], Show Thinking: [${isThinking}], Role: [${messages.at(-1)?.role}], Parts: [${messages.at(-1)?.parts}]`
    // );

    return (
        <div className="flex flex-col min-w-0 h-dvh">
            <MessageList messages={messages} status={status} isThinking={isThinking} />
            <form>
                <MessageInput status={status} isThinking={isThinking} sendMessage={(text) => sendMessage({ text })} stop={stop} />
            </form>
        </div>
    );
}

function MessageList({ messages, status, isThinking }: { messages: UIMessage[]; status: ChatStatus; isThinking: boolean }) {
    const { containerRef, endRef, isAtBottom, scrollToBottom } = useScrollToBottom({ status });
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

    return (
        <div ref={containerRef} className="flex-1 p-4 overflow-y-auto">
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

function Message({ message, status }: { message: UIMessage; status: ChatStatus }) {
    // Reorder parts to show reasoning before text
    const reorderedParts = [...message.parts].sort((a, b) => {
        // Put reasoning first, then text, then other types
        if (a.type === 'reasoning' && b.type !== 'reasoning') return -1;
        if (a.type === 'text' && b.type === 'reasoning') return 1;
        if (a.type === 'text' && b.type !== 'text' && b.type !== 'reasoning') return -1;
        return 0;
    });

    return (
        <div className="flex flex-col gap-1">
            {reorderedParts.map((part, index) => {
                if (part.type === 'text') {
                    return (
                        <TextMessage key={index} role={message.role}>
                            {/* <MarkedMarkdown>{part.text.trim()}</MarkedMarkdown> */}
                            <Markdown role={message.role}>{part.text.trim()}</Markdown>
                        </TextMessage>
                    );
                } else if (part.type === 'reasoning') {
                    const isLoading = status === 'streaming' && part.state === 'streaming';

                    return (
                        <ReasoningMessage key={index} isLoading={isLoading}>
                            {part.text.trim()}
                        </ReasoningMessage>
                    );
                } else if (part.type === 'dynamic-tool') {
                    return <DynamicToolMessage key={index}>Tool</DynamicToolMessage>;
                }

                return null;
            })}
        </div>
    );
}

function TextMessage({ role, children }: { role: 'user' | 'system' | 'assistant'; children: React.ReactNode }) {
    // return (
    //     <div
    //         className={cn(
    //             'flex flex-col rounded-lg px-4 py-3 max-w-10/12 w-fit',
    //             role === 'user' ? 'items-start bg-blue-500 text-white' : 'items-end bg-neutral-200',
    //             role === 'user' ? 'self-end' : 'self-start'
    //         )}
    //     >
    //         <div className="w-full overflow-hidden">{children}</div>
    //     </div>
    // );
    return (
        <div
            className={cn(
                'flex flex-col',
                role === 'user' && 'self-end rounded-lg px-4 py-3 max-w-10/12 w-fit items-start bg-blue-500 text-white'
            )}
        >
            <div className="w-full overflow-hidden">{children}</div>
        </div>
    );
}

function ThinkingMessage({ className }: { className?: string }) {
    return (
        <div className={cn('rounded-lg px-4 py-5 bg-neutral-200 w-fit', className)}>
            <div className="flex gap-1.5">
                <div className="bg-neutral-400 rounded-full w-2 h-2 animate-pulse" style={{ animationDelay: '0ms' }}></div>
                <div className="bg-neutral-400 rounded-full w-2 h-2 animate-pulse" style={{ animationDelay: '200ms' }}></div>
                <div className="bg-neutral-400 rounded-full w-2 h-2 animate-pulse" style={{ animationDelay: '400ms' }}></div>
            </div>
        </div>
    );
}

function ReasoningMessage({ isLoading, children }: { isLoading: boolean; children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="flex flex-col">
            <Collapsible
                open={isOpen}
                onOpenChange={(isOpen) => {
                    setIsOpen(isOpen);
                }}
            >
                <CollapsibleTrigger className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer">
                    {isLoading ? (
                        <AnimatedShinyText speed={2} className="text-muted-foreground/80 text-sm mr-auto flex items-center gap-1">
                            Reasoning
                            <ChevronRight className={cn('w-4 h-4 transition-transform duration-200', { 'rotate-90': isOpen })} />
                        </AnimatedShinyText>
                    ) : (
                        <>
                            Reasoning
                            <ChevronRight className={cn('w-4 h-4 transition-transform duration-200', { 'rotate-90': isOpen })} />
                        </>
                    )}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                    {/* <Markdown>{reasoning}</Markdown> */}
                    <div className="whitespace-pre-wrap text-sm px-3">{children}</div>
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
}

function DynamicToolMessage({ children }: { children: React.ReactNode }) {
    return <div>{children}</div>;
}

function MessageInput({
    status,
    isThinking,
    sendMessage,
    stop,
}: {
    status: ChatStatus;
    isThinking: boolean;
    sendMessage: (text: string) => void;
    stop: () => void;
}) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [input, setInput] = useState('');

    useEffect(() => {
        if (textareaRef.current) {
            adjustHeight();
        }
    }, []);

    const adjustHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
        }
    };

    const resetHeight = useCallback(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = '98px';
        }
    }, [textareaRef]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        adjustHeight();
    }, []);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();

                if (status !== 'ready') {
                    console.warn('Please wait for the model to finish its response');
                } else {
                    submitForm();
                }
            }
        },
        [input, setInput, status, sendMessage]
    );

    const submitForm = useCallback(() => {
        if (input.trim().length === 0) {
            return;
        }

        sendMessage(input);
        setInput('');
        resetHeight();
    }, [input, sendMessage, setInput, resetHeight]);

    return (
        <div className="w-full p-2">
            <div className="relative">
                <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="How can I help you?"
                    rows={2}
                    className="min-h-[24px] max-h-[calc(50dvh)] overflow-hidden resize-none pb-10 text-base! field-sizing-fixed"
                />
                <div className="absolute bottom-0 right-0 p-2 w-fit flex flex-row justify-end">
                    <Button
                        className="rounded-full p-1.5 w-8 h-8 cursor-pointer"
                        onClick={(e) => {
                            e.preventDefault();
                            isThinking ? stop() : submitForm();
                        }}
                    >
                        {isThinking ? <CircleStop size={14} /> : <SendHorizonal size={14} />}
                    </Button>
                </div>
            </div>
        </div>
    );
}

function ScrollToBottomButton({ scrollToBottom }: { scrollToBottom: () => void }) {
    return (
        <div className="sticky bottom-2 z-50 flex justify-center">
            <Button
                onClick={() => scrollToBottom()}
                variant="secondary"
                className="rounded-full w-12 h-12 border-2 shadow-sm cursor-pointer hover:bg-secondary"
            >
                <ArrowDown className="w-4 h-4 text-muted-foreground" />
            </Button>
        </div>
    );
}
