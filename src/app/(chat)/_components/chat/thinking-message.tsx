import { cn } from '@/lib/utils';

export default function ThinkingMessage({ className }: { className?: string }) {
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
