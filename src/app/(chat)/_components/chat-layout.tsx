'use client';

import { UIMessage } from 'ai';
import ChatPane from './chat/chat-pane';
import DataPane from './data-pane';
import { DataSource, TransformationStep } from '@/lib/db/schema';
import { TabsProvider } from './tabs-context';

export default function ChatLayout({
    chatId,
    steps,
    previewSteps,
    initialMessages,
}: {
    chatId: string;
    steps: TransformationStep[];
    previewSteps: { step: TransformationStep; dataSource: DataSource | null }[];
    initialMessages: UIMessage[];
}) {
    // Calculate the initial tab - use the first preview step if available, otherwise 'new'
    const initialTab = previewSteps.length > 0 ? previewSteps[0].step.id : 'new';

    return (
        <TabsProvider initialTab={initialTab}>
            <div className="flex overflow-hidden w-full h-screen">
                <div className="w-2/3 border-r">
                    <DataPane chatId={chatId} steps={steps} previewSteps={previewSteps} />
                </div>
                <div className="w-1/3">
                    <ChatPane chatId={chatId} initialMessages={initialMessages} />
                </div>
            </div>
        </TabsProvider>
    );
}
