import type { ComponentChildren } from 'preact';

interface LinkProps {
    href: string;
    variant?: 'primary' | 'secondary';
    disabled?: boolean;
    children: ComponentChildren;
}

export function Link({ href, variant = 'primary', disabled = false, children }: LinkProps) {
    const className = ['flowforge-link', `flowforge-link--${variant}`].join(' ');

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
