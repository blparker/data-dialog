'use client';

import ChatPane from './chat-pane';
import DataPane from './data-pane';

export default function ChatLayout({ chatId }: { chatId: string }) {
    return (
        <div className="flex overflow-hidden w-full h-screen">
            <div className="w-2/3 border-r">
                <DataPane chatId={chatId} />
            </div>
            <div className="w-1/3">
                <ChatPane chatId={chatId} />
            </div>
        </div>
    );
}
