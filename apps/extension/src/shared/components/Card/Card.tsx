import { useId } from 'preact/hooks';
import type { ComponentChildren, JSX } from 'preact';

interface CardProps {
    title?: string;
    titleTag?: keyof JSX.IntrinsicElements;
    text?: string;
    direction?: 'none' | 'left';
    error?: boolean;
    children?: ComponentChildren;
}

export function Card({ title, titleTag = 'h2', text, direction = 'none', error = false, children }: CardProps) {
    const className = ['flowforge-card', direction !== 'none' && `flowforge-card--${direction}`].filter(Boolean).join(' ');
    const titleId = `flowforge-card-title-${useId()}`;
    const TitleTag = titleTag || 'p';

    return (
        <section className={className} data-state={error ? 'error' : undefined} aria-labelledby={titleId}>
            <TitleTag id={titleId} className="flowforge-card__title">{title}</TitleTag>
            {text && <p className="flowforge-card__text">{text}</p>}
            {children}
        </section>
    );
}
