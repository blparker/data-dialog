import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';

export default function ScrollToBottomButton({ scrollToBottom }: { scrollToBottom: () => void }) {
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
