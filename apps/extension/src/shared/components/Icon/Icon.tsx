import type { LucideIcon, LucideProps } from 'lucide-preact';

interface IconProps extends Omit<LucideProps, 'class' | 'size'> {
    icon: LucideIcon;
    size?: 'small' | 'medium' | 'large';
    className?: string;
}

export function Icon({
    icon: IconComponent,
    size = 'medium',
    className,
    strokeWidth = 2,
    ...props
}: IconProps) {
    const classes = [
        'flowforge-icon',
        size === 'small' && 'flowforge-icon--sm',
        size === 'large' && 'flowforge-icon--lg',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return <IconComponent class={classes} focusable="false" size="1em" strokeWidth={strokeWidth} {...props} />;
}
