import type { ComponentProps } from 'preact';

interface ButtonProps extends ComponentProps<'button'> {
    variant?: 'primary' | 'secondary';
    size?: 'small' | 'medium' | 'large';
    wide?: boolean;
}

export function Button({ variant = 'primary', size = 'medium', wide = false, ...props }: ButtonProps) {
    const classes = [
        'flowforge-button',
        `flowforge-button--${variant}`,
        size === 'small' && 'flowforge-button--sm',
        size === 'large' && 'flowforge-button--lg',
        wide && 'flowforge-button--wide',
    ]
        .filter(Boolean)
        .join(' ');

    return <button type="button" className={classes} {...props} />;
}
