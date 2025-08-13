import { memo, useEffect, useRef, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Custom renderer for marked
const renderer = new marked.Renderer();

// Handle code blocks (both inline and block)
renderer.code = (code: string, language: string | undefined) => {
    // This is a block code (```code```)
    return `<pre class="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto"><code class="text-sm">${code}</code></pre>`;
};

renderer.codespan = (code: string) => {
    // This is an inline code (`code`)
    return `<code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm">${code}</code>`;
};

// Handle headings
renderer.heading = (text: string, level: number) => {
    return `<h${level} class="text-2xl font-semibold mt-6 mb-2">${text}</h${level}>`;
};

marked.use({ renderer });

// Configure marked options
marked.setOptions({
    breaks: true, // Convert line breaks to <br>
    gfm: true, // GitHub Flavored Markdown
});

// DOMPurify configuration
const purifyConfig = {
    ALLOWED_TAGS: [
        'p',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'ul',
        'ol',
        'li',
        'blockquote',
        'code',
        'pre',
        'strong',
        'em',
        'del',
        'a',
        'br',
        'hr',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
};

const NonMemoizedMarkedMarkdown = ({ children }: { children: string }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [html, setHtml] = useState<string>('');

    useEffect(() => {
        // Convert markdown to HTML (marked can be async)
        const convertMarkdown = async () => {
            try {
                const rawHtml = await marked(children);
                const sanitizedHtml = DOMPurify.sanitize(rawHtml, purifyConfig);
                setHtml(sanitizedHtml);
            } catch (error) {
                console.error('Error converting markdown:', error);
                setHtml(children); // Fallback to plain text
            }
        };

        convertMarkdown();
    }, [children]);

    useEffect(() => {
        if (containerRef.current) {
            // Process external links to open in new tabs
            const links = containerRef.current.querySelectorAll('a[href^="http"]');
            links.forEach((link) => {
                if (!link.hasAttribute('target')) {
                    link.setAttribute('target', '_blank');
                    link.setAttribute('rel', 'noopener noreferrer');
                }
            });
        }
    }, [html]);

    return (
        <div
            ref={containerRef}
            className="prose prose-sm dark:prose-invert w-full break-words overflow-hidden"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
};

export const MarkedMarkdown = memo(NonMemoizedMarkedMarkdown, (prevProps, nextProps) => prevProps.children === nextProps.children);
