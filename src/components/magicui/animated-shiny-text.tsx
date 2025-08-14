import { ComponentPropsWithoutRef, CSSProperties, FC } from 'react';

import { cn } from '@/lib/utils';

export interface AnimatedShinyTextProps extends ComponentPropsWithoutRef<'span'> {
    shimmerWidth?: number;
    speed?: number;
}

export const AnimatedShinyText: FC<AnimatedShinyTextProps> = ({ children, className, shimmerWidth = 100, speed = 8, ...props }) => {
    return (
        <span
            style={
                {
                    '--shiny-width': `${shimmerWidth}px`,
                    animation: `shiny-text ${speed}s infinite`,
                } as CSSProperties
            }
            className={cn(
                'inline-block text-neutral-600/70 dark:text-neutral-400/70',

                // Shine effect - removed animate-shiny-text class to use custom animation
                'bg-clip-text bg-no-repeat [background-position:0_0] [background-size:var(--shiny-width)_100%]',

                // Shine gradient
                'bg-gradient-to-r from-transparent via-black/95 via-50% to-transparent  dark:via-white/95',

                className
            )}
            {...props}
        >
            {children}
        </span>
    );
};
