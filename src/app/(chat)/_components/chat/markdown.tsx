import Link from 'next/link';
import { memo, useMemo } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { UIMessage } from 'ai';

function createComponents(role: UIMessage['role']): Partial<Components> {
    return {
        // @ts-expect-error code block
        code: (props) => <SimpleCodeBlock {...props} role={role} />,
        pre: ({ children }) => <>{children}</>,
        ol: ({ node, children, ...props }) => {
            return (
                <ol className="list-decimal list-outside ml-4" {...props}>
                    {children}
                </ol>
            );
        },
        li: ({ node, children, ...props }) => {
            return (
                <li className="py-1" {...props}>
                    {children}
                </li>
            );
        },
        ul: ({ node, children, ...props }) => {
            return (
                <ul className="list-disc list-outside ml-4" {...props}>
                    {children}
                </ul>
            );
        },
        strong: ({ node, children, ...props }) => {
            return (
                <span className="font-semibold" {...props}>
                    {children}
                </span>
            );
        },
        a: ({ node, children, ...props }) => {
            return (
                // @ts-expect-error url comes from props
                <Link className="text-blue-500 hover:underline" target="_blank" rel="noreferrer" {...props}>
                    {children}
                </Link>
            );
        },
        h1: ({ node, children, ...props }) => {
            return (
                <h1 className="text-3xl font-semibold mt-6 mb-2" {...props}>
                    {children}
                </h1>
            );
        },
        h2: ({ node, children, ...props }) => {
            return (
                <h2 className="text-2xl font-semibold mt-6 mb-2" {...props}>
                    {children}
                </h2>
            );
        },
        h3: ({ node, children, ...props }) => {
            return (
                <h3 className="text-xl font-semibold mt-6 mb-2" {...props}>
                    {children}
                </h3>
            );
        },
        h4: ({ node, children, ...props }) => {
            return (
                <h4 className="text-lg font-semibold mt-6 mb-2" {...props}>
                    {children}
                </h4>
            );
        },
        h5: ({ node, children, ...props }) => {
            return (
                <h5 className="text-base font-semibold mt-6 mb-2" {...props}>
                    {children}
                </h5>
            );
        },
        h6: ({ node, children, ...props }) => {
            return (
                <h6 className="text-sm font-semibold mt-6 mb-2" {...props}>
                    {children}
                </h6>
            );
        },
    };
}

const remarkPlugins = [remarkGfm];

const NonMemoizedMarkdown = ({ role, children }: { role: UIMessage['role']; children: string }) => {
    const components = useMemo(() => createComponents(role), [role]);

    return (
        <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
            {children}
        </ReactMarkdown>
    );
};

export const Markdown = memo(NonMemoizedMarkdown, (prevProps, nextProps) => prevProps.children === nextProps.children);

function SimpleCodeBlock({
    node,
    inline,
    className,
    children,
    role,
    ...props
}: {
    node: any;
    inline?: boolean;
    className?: string;
    children: any;
    role: UIMessage['role'];
}) {
    // Determine if this is inline code or block code based on className. If className contains a language (e.g., "language-javascript"), it's a block,
    // if className is empty or doesn't contain a language, it's inline
    const isInline = !className || !className.includes('language-');

    if (isInline) {
        // Inline code (single backticks)
        return (
            <code
                className={cn(
                    'text-sm py-1 px-2 rounded-md',
                    role === 'user' ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800',
                    className
                )}
                {...props}
            >
                {children}
            </code>
        );
    } else {
        // Block code (triple backticks)
        return (
            <span
                className={cn(
                    'not-prose block rounded-md p-2 border border-zinc-300',
                    role === 'user' ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800',
                    className
                )}
            >
                <pre {...props} className="text-sm w-full overflow-x-auto">
                    <code className="whitespace-pre-wrap break-words">{children}</code>
                </pre>
            </span>
        );
    }
}

// function CodeBlock({ node, inline, className, children, ...props }: { node: any; inline: boolean; className: string; children: any }) {
//     console.log('*** CHILDREN', children);

//     if (!inline) {
//         return (
//             <span className="not-prose flex flex-col">
//                 <pre
//                     {...props}
//                     className={`text-sm w-full overflow-x-auto dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-700 rounded-xl dark:text-zinc-50 text-zinc-900`}
//                 >
//                     <code className="whitespace-pre-wrap break-words">{children}</code>
//                 </pre>
//             </span>
//         );
//     } else {
//         return (
//             <code className={`${className} text-sm bg-zinc-100 dark:bg-zinc-800 py-0.5 px-1 rounded-md`} {...props}>
//                 {children}
//             </code>
//         );
//     }
// }
