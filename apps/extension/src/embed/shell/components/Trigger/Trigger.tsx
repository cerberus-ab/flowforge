import type { Ref } from 'preact';
import { forwardRef } from 'preact/compat';
import { cx } from '@/shared/utils/cx';

export type TriggerSize = 'medium' | 'large';

interface TriggerProps {
    size?: TriggerSize;
    isOpen: boolean;
    onToggle: () => void;
    ref?: Ref<HTMLButtonElement>;
}

export const Trigger = forwardRef<HTMLButtonElement, TriggerProps>(({ size = 'medium', isOpen, onToggle }, ref) => {
    const classes = cx('flowforge-trigger', size === 'large' && 'flowforge-trigger--lg');

    return (
        <button
            className={classes}
            type="button"
            ref={ref}
            aria-label={isOpen ? 'Close FlowForge' : 'Open FlowForge'}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            aria-controls="flowforge-popup"
            data-testid="flowforge-trigger"
            onClick={onToggle}
        >
            ✦ FlowForge
        </button>
    );
});
