import type { ComponentProps } from 'preact';

interface ButtonTextProps extends ComponentProps<'button'> {
    variant?: 'primary' | 'secondary';
    tooltip?: string;
}

export function ButtonText({ variant = 'primary', tooltip, ...props }: ButtonTextProps) {
    const classes = ['flowforge-button-text', `flowforge-button-text--${variant}`].filter(Boolean).join(' ');

    return <button type="button" title={tooltip} className={classes} {...props} />;
}
