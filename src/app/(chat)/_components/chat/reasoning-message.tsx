import { AnimatedShinyText } from '@/components/magicui/animated-shiny-text';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';

export default function ReasoningMessage({ isLoading, children }: { isLoading: boolean; children: React.ReactNode }) {
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
