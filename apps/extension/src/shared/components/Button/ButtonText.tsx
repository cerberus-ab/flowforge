import type { ComponentProps } from 'preact';

interface ButtonTextProps extends ComponentProps<'button'> {
    variant?: 'primary' | 'secondary';
}

export function ButtonText({ variant = 'primary', ...props }: ButtonTextProps) {
    const classes = ['flowforge-button-text', `flowforge-button-text--${variant}`].filter(Boolean).join(' ');

    return <button type="button" className={classes} {...props} />;
}
