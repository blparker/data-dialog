import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function throttle<T extends unknown[]>(callback: (...args: T) => void, delay: number) {
    let isWaiting = false;

    return (...args: T) => {
        if (isWaiting) {
            return;
        }

        callback(...args);
        isWaiting = true;

        setTimeout(() => {
            isWaiting = false;
        }, delay);
    };
}

export function generateUUID(): string {
    return crypto.randomUUID();
}

export async function fetchWithErrorHandlers(input: RequestInfo | URL, init?: RequestInit) {
    try {
        const response = await fetch(input, init);

        if (!response.ok) {
            const { cause } = await response.json();
            throw new Error(cause);
        }

        return response;
    } catch (error: unknown) {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            throw new Error('offline:chat');
        }

        throw error;
    }
}
