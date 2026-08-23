import { useId } from 'preact/hooks';
import type { ComponentChildren } from 'preact';

interface CardProps {
    title?: string;
    text?: string;
    variant?: 'primary' | 'secondary';
    direction?: 'none' | 'left';
    twinkle?: boolean;
    error?: boolean;
    className?: string;
    children?: ComponentChildren;
}

export function Card({
    title,
    text,
    variant = 'primary',
    direction = 'none',
    twinkle = false,
    error = false,
    className,
    children,
}: CardProps) {
    const classNames = [
        'flowforge-card',
        `flowforge-card--${variant}`,
        direction !== 'none' && `flowforge-card--${direction}`,
        twinkle && 'flowforge-stared-twinkle',
        twinkle && `flowforge-stared-twinkle--${variant}`,
        className,
    ]
        .filter(Boolean)
        .join(' ');

    const titleId = title ? `flowforge-card-title-${useId()}` : undefined;

    return (
        <section
            className={classNames}
            data-state={error ? 'error' : undefined}
            aria-labelledby={titleId}
            role={error ? 'alert' : undefined}
        >
            {title && (
                <h3 id={titleId} className="flowforge-card__title">
                    {title}
                </h3>
            )}
            {text && <p className="flowforge-card__text">{text}</p>}
            {children}
        </section>
    );
}
