import type { ComponentProps } from 'preact';
import { cx } from '@/shared/utils/cx';

interface ButtonTextProps extends ComponentProps<'button'> {
    variant?: 'primary' | 'secondary';
    tooltip?: string;
}

export function ButtonText({ variant = 'primary', tooltip, ...props }: ButtonTextProps) {
    const classes = cx('flowforge-button-text', `flowforge-button-text--${variant}`);

    return <button type="button" title={tooltip} className={classes} {...props} />;
}
