import type { TargetedPointerEvent } from 'preact';
import { useEffect } from 'preact/hooks';
import { getEventTarget } from '@/core/utils/dom';
import type { InspectorViewModel } from '@/page/hooks/usePage';
import { Button } from '@/shared/components/Button';

export function Inspector({ pageTrail, close } : InspectorViewModel) {
    // Close on esc
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;

            const target = getEventTarget(e);
            // if typing in an input, don't close
            if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;

            e.preventDefault();
            close();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [close]);

    // Close on click outside the inspector
    const handleContainerPointerDown = (e: TargetedPointerEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            close();
        }
    };

    return (
        <div className="flowforge-inspector-container" onPointerDown={handleContainerPointerDown}>
            <div className="flowforge-inspector">
                {JSON.stringify(Object.keys(pageTrail), null, 2)}
                <Button onClick={close}>Close</Button>
            </div>
        </div>
    );
}
