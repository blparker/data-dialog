import { cn } from '@/lib/utils';

export default function TextMessage({ role, children }: { role: 'user' | 'system' | 'assistant'; children: React.ReactNode }) {
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
