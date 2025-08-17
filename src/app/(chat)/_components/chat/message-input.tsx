import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChatStatus } from 'ai';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CircleStop, SendHorizonal } from 'lucide-react';

export default function MessageInput({
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
