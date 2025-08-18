import { ChatStatus, UIMessage } from 'ai';
import { Markdown } from './markdown';
import ReasoningMessage from './reasoning-message';
import TextMessage from './text-message';
import ToolMessage from './tool-message';

export default function Message({ message, status }: { message: UIMessage; status: ChatStatus }) {
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
                if (part.type === 'text' && part.text.trim().length > 0) {
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
                } else if (part.type.startsWith('tool-')) {
                    // console.log('*** tool part:', part);
                    return (
                        <ToolMessage key={index} toolName={part.type}>
                            Tool
                        </ToolMessage>
                    );
                }

                return null;
            })}
        </div>
    );
}
