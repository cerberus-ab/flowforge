import type { ComponentProps } from 'preact';
import { forwardRef } from 'preact/compat';
import type { LucideIcon } from 'lucide-preact';
import { Icon } from '@/shared/components/Icon';

type ButtonOwnProps = {
    size?: 'small' | 'medium' | 'large';
    icon?: LucideIcon;
    iconPosition?: 'start' | 'end';
    wide?: boolean;
} & (
    | {
          appearance?: 'solid';
          variant?: 'primary' | 'secondary';
      }
    | {
          appearance: 'ghost';
          variant?: never;
      }
);

type ButtonProps = ComponentProps<'button'> & ButtonOwnProps;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    {
        appearance = 'solid',
        variant = 'primary',
        size = 'medium',
        icon,
        iconPosition = 'start',
        wide = false,
        className,
        children,
        ...props
    },
    ref,
) {
    const classes = [
        'flowforge-button',
        `flowforge-button--${appearance}`,
        appearance === 'solid' && `flowforge-button--${variant}`,
        size === 'small' && 'flowforge-button--sm',
        size === 'large' && 'flowforge-button--lg',
        icon && iconPosition === 'end' && 'flowforge-button--icon-end',
        wide && 'flowforge-button--wide',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <button type="button" ref={ref} className={classes} {...props}>
            {icon && <Icon icon={icon} size={size} aria-hidden="true" />}
            {children}
        </button>
    );
});
