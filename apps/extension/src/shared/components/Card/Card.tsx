import { useId } from 'preact/hooks';
import type { ComponentChildren, ComponentProps } from 'preact';
import { cx } from '@/shared/utils/cx';

type CardProps = ComponentProps<'section'> & {
    title?: string;
    action?: ComponentChildren;
    text?: string;
    variant?: 'primary' | 'secondary';
    direction?: 'none' | 'left';
    twinkle?: boolean;
    error?: boolean;
    className?: string;
    children?: ComponentChildren;
};

export function Card({
    title,
    action,
    text,
    variant = 'primary',
    direction = 'none',
    twinkle = false,
    error = false,
    className,
    children,
    ...props
}: CardProps) {
    const classNames = cx(
        'flowforge-card',
        `flowforge-card--${variant}`,
        direction !== 'none' && `flowforge-card--${direction}`,
        twinkle && 'flowforge-stared-twinkle',
        twinkle && `flowforge-stared-twinkle--${variant}`,
        className,
    );

    const titleId = title ? `flowforge-card-title-${useId()}` : undefined;

    return (
        <section
            className={classNames}
            data-state={error ? 'error' : undefined}
            aria-labelledby={titleId}
            role={error ? 'alert' : undefined}
            {...props}
        >
            {title && (
                <div className="flowforge-card__header">
                    <h3 id={titleId} className="flowforge-card__title">
                        {title}
                    </h3>
                    {action}
                </div>
            )}
            {text && <p className="flowforge-card__text">{text}</p>}
            {children}
        </section>
    );
}
