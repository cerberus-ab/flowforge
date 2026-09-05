import type { ComponentProps } from 'preact';
import { forwardRef } from 'preact/compat';
import type { LucideIcon } from 'lucide-preact';
import { Icon } from '@/shared/components/Icon';
import { cx } from '@/shared/utils/cx';

type ButtonOwnProps = {
    size?: 'small' | 'medium' | 'large';
    variant?: 'primary' | 'secondary';
    icon?: LucideIcon;
    iconPosition?: 'start' | 'end';
    wide?: boolean;
    hollow?: boolean;
};

type ButtonProps = ComponentProps<'button'> & ButtonOwnProps;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    {
        size = 'medium',
        variant = 'primary',
        icon,
        iconPosition = 'start',
        wide = false,
        hollow = false,
        className,
        children,
        ...props
    },
    ref,
) {
    const classes = cx(
        'flowforge-button',
        size === 'small' && 'flowforge-button--sm',
        size === 'large' && 'flowforge-button--lg',
        `flowforge-button--${variant}`,
        icon && iconPosition === 'end' && 'flowforge-button--icon-end',
        wide && 'flowforge-button--wide',
        hollow ? 'flowforge-button--hollow' : 'flowforge-button--solid',
        typeof className === 'string' ? className : undefined,
    );

    return (
        <button type="button" ref={ref} className={classes} {...props}>
            {icon && <Icon icon={icon} size={size} aria-hidden="true" />}
            {children}
        </button>
    );
});
