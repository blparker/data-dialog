import { cn } from '@/lib/utils';

export default function FullScreenMessage({ className, children }: { className?: string; children: React.ReactNode }) {
    return <div className={cn('flex items-center justify-center h-full text-muted-foreground', className)}>{children}</div>;
}
