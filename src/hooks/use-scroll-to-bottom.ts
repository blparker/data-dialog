import { throttle } from '@/lib/utils';
import { ChatStatus } from 'ai';
import { useCallback, useRef, useState } from 'react';
import { useEffect } from 'react';

export function useScrollToBottom({ status }: { status: ChatStatus }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const endRef = useRef<HTMLDivElement>(null);
    const [isAtBottom, setIsAtBottom] = useState(false);

    useEffect(() => {
        const endElement = endRef.current;
        const containerElement = containerRef.current;

        if (!endElement || !containerElement) return;

        let lastIntersectionState = false;

        const observer = new IntersectionObserver(
            ([entry]) => {
                lastIntersectionState = entry.isIntersecting;
                setIsAtBottom(entry.isIntersecting);
            },
            {
                root: containerElement, // Use the container as the root
                threshold: 0.1, // Trigger when 10% of the element is visible
                rootMargin: '0px 0px -10px 0px', // 10px margin at bottom
            }
        );

        observer.observe(endElement);

        // Also check scroll position as a fallback
        const checkScrollPosition = () => {
            const { scrollTop, scrollHeight, clientHeight } = containerElement;
            const isAtBottomByScroll = scrollTop + clientHeight >= scrollHeight - 20; // 20px tolerance

            // Use scroll position as fallback if Intersection Observer doesn't work
            if (!lastIntersectionState && isAtBottomByScroll) {
                setIsAtBottom(true);
            }
        };

        const throttledCheckScrollPosition = throttle(checkScrollPosition, 100);

        containerElement.addEventListener('scroll', throttledCheckScrollPosition);
        checkScrollPosition(); // Check initial position

        return () => {
            observer.disconnect();
            containerElement.removeEventListener('scroll', throttledCheckScrollPosition);
        };
    }, []);

    const scrollToBottom = useCallback((scrollBehavior: ScrollBehavior = 'smooth') => {
        // Direct DOM manipulation for immediate response - perfect for streaming
        if (endRef.current) {
            endRef.current.scrollIntoView({ behavior: scrollBehavior });
        }
    }, []);

    return {
        containerRef,
        endRef,
        isAtBottom,
        scrollToBottom,
    };
}
