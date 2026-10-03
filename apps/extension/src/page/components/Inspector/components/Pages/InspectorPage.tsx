import type { ComponentChildren } from 'preact';
import { cx } from '@/shared/utils/cx';

interface InspectorPageProps {
    children: ComponentChildren;
    padded?: boolean;
    scroll?: boolean;
}

export function InspectorPage({ children, padded = true, scroll = true }: InspectorPageProps) {
    return (
        <div
            className={cx(
                'flowforge-inspector-page',
                padded && 'flowforge-inspector-page--padded',
                scroll && 'flowforge-inspector-page--scroll',
            )}
        >
            {children}
        </div>
    );
}
