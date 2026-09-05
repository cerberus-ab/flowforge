import type { ComponentChildren } from 'preact';
import { cx } from '@/shared/utils/cx';

interface LinkProps {
    href: string;
    variant?: 'primary' | 'secondary';
    disabled?: boolean;
    children: ComponentChildren;
}

export function Link({ href, variant = 'primary', disabled = false, children }: LinkProps) {
    const className = cx('flowforge-link', `flowforge-link--${variant}`);

    return (
        <a
            href={href}
            className={className}
            target="_blank"
            rel="noreferrer"
            aria-disabled={disabled ? 'true' : undefined}
        >
            {children}
        </a>
    );
}
