import { throttle } from '@/lib/utils';
import { ChatStatus } from 'ai';
import { useCallback, useRef, useState } from 'react';
import { useEffect } from 'react';

export function useScrollToBottom({ status }: { status: ChatStatus }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const endRef = useRef<HTMLDivElement>(null);
    const [isAtBottom, setIsAtBottom] = useState(false);
    const [scrollBehavior, setScrollBehavior] = useState<ScrollBehavior | false>(false);

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

    useEffect(() => {
        // console.log(`Scroll behavior changed to: [${scrollBehavior}], endRef: [${endRef.current}]`);
        if (scrollBehavior) {
            endRef.current?.scrollIntoView({ behavior: scrollBehavior });
            setScrollBehavior(false);
        }
    }, [scrollBehavior, setScrollBehavior]);

    const scrollToBottom = useCallback(
        (scrollBehavior: ScrollBehavior = 'smooth') => {
            // console.log(`Scroll to bottom called with behavior: [${scrollBehavior}]`);
            setScrollBehavior(scrollBehavior);
        },
        [setScrollBehavior]
    );

    // function onViewportEnter() {
    //     setIsAtBottom(true);
    // }

    // function onViewportLeave() {
    //     setIsAtBottom(false);
    // }

    // useEffect(() => {
    //     if (status === 'submitted') {
    //         scrollToBottom();
    //     }
    // }, [status, scrollToBottom]);

    // useEffect(() => {
    //     scrollToBottom('instant');
    // }, [scrollToBottom]);

    return {
        containerRef,
        endRef,
        isAtBottom,
        scrollToBottom,
        // onViewportEnter,
        // onViewportLeave,
    };
}
