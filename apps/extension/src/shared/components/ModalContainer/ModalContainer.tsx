import type { ComponentChildren, TargetedPointerEvent } from 'preact';
import { useEffect } from 'preact/hooks';

import { Button } from '@/shared/components/Button';
import { Tooltip } from '@/shared/components/Tooltip';
import { getEventTarget } from '@/shared/utils/dom';
import { X } from 'lucide-preact';

export interface ModalContainerProps {
    children: ComponentChildren;
    onClose: () => void;
    title: string;
    titleId: string;
    descriptionId?: string;
}

/** Provides the overlay and close behavior around embedded content. */
export function ModalContainer({ children, onClose, title, titleId, descriptionId }: ModalContainerProps) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;

            const target = getEventTarget(event);
            if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;

            event.preventDefault();
            onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleBackdropPointerDown = (event: TargetedPointerEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) onClose();
    };

    return (
        <div
            className="flowforge-modal-container"
            data-testid="flowforge-modal-container"
            onPointerDown={handleBackdropPointerDown}
        >
            <div
                className="flowforge-modal-container__dialog"
                role="dialog"
                aria-modal="false"
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
            >
                <div className="flowforge-modal-container__toolbar">
                    <h3 id={titleId} className="flowforge-modal-container__title" data-testid="flowforge-modal-title">
                        {title}
                    </h3>
                    <Tooltip content="Close" variant="secondary" side="bottom">
                        <Button
                            size="small"
                            variant="secondary"
                            hollow
                            compact
                            icon={X}
                            aria-label="Close"
                            onClick={onClose}
                            data-testid="flowforge-modal-close"
                        />
                    </Tooltip>
                </div>
                {children}
            </div>
        </div>
    );
}
