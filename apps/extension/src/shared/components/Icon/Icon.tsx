import type { LucideIcon, LucideProps } from 'lucide-preact';
import { cx } from '@/shared/utils/cx';

interface IconProps extends Omit<LucideProps, 'class' | 'size'> {
    icon: LucideIcon;
    size?: 'small' | 'medium' | 'large';
    className?: string;
}

export function Icon({ icon: IconComponent, size = 'medium', className, strokeWidth = 2, ...props }: IconProps) {
    const classes = cx(
        'flowforge-icon',
        size === 'small' && 'flowforge-icon--sm',
        size === 'large' && 'flowforge-icon--lg',
        className,
    );

    return <IconComponent class={classes} focusable="false" size="1em" strokeWidth={strokeWidth} {...props} />;
}
