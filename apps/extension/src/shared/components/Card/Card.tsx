import { useId } from 'preact/hooks';
import type { ComponentChildren } from 'preact';

interface CardProps {
    title?: string;
    text?: string;
    direction?: 'none' | 'left';
    error?: boolean;
    children?: ComponentChildren;
}

export function Card({ title, text, direction = 'none', error = false, children }: CardProps) {
    const className = ['flowforge-card', direction !== 'none' && `flowforge-card--${direction}`].filter(Boolean).join(' ');
    const titleId = `flowforge-card-title-${useId()}`;

    return (
        <section
            className={className}
            data-state={error ? 'error' : undefined}
            aria-labelledby={titleId}
            role={error ? 'alert' : undefined}
        >
            <h3 id={titleId} className="flowforge-card__title">
                {title}
            </h3>
            {text && <p className="flowforge-card__text">{text}</p>}
            {children}
        </section>
    );
}
