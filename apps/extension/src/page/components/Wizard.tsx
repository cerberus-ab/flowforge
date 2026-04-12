import { useEffect, useRef, useState } from 'preact/hooks';
import type { WizardViewModel } from '#self/page/hooks/types';
import { getEventTarget } from '#self/core/utils/dom';

interface DragState {
    startX: number;
    startY: number;
    originRight: number;
    originBottom: number;
}

export function Wizard({ title, description, steps, close, changeStep }: WizardViewModel) {
    const [currentStep, setCurrentStep] = useState(0);
    const [position, setPosition] = useState({ right: 20, bottom: 20 });
    const [isDragging, setIsDragging] = useState(false);

    const dragRef = useRef<DragState | null>(null);
    const wizardRef = useRef<HTMLDivElement>(null);

    // Notify parent of step change
    useEffect(() => {
        changeStep(currentStep);
    }, [currentStep, changeStep]);

    // Dragging logic
    useEffect(() => {
        if (!isDragging) return;

        const handlePointerMove = (event: PointerEvent) => {
            const drag = dragRef.current;
            const wizard = wizardRef.current;
            if (!drag || !wizard) return;

            const deltaX = event.clientX - drag.startX;
            const deltaY = event.clientY - drag.startY;

            const nextRight = drag.originRight - deltaX;
            const nextBottom = drag.originBottom - deltaY;

            const padding = 12;
            const maxRight = window.innerWidth - wizard.offsetWidth - padding;
            const maxBottom = window.innerHeight - wizard.offsetHeight - padding;

            setPosition({
                right: Math.max(padding, Math.min(nextRight, maxRight)),
                bottom: Math.max(padding, Math.min(nextBottom, maxBottom)),
            });
        };

        const handlePointerUp = () => {
            dragRef.current = null;
            setIsDragging(false);
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [isDragging]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = getEventTarget(e);
            // if typing in an input, don't navigate
            if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;

            if (e.key === 'Enter' && currentStep === 0) {
                e.preventDefault();
                handleStart();
                return;
            }
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                handleNext();
                return;
            }
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                handlePrev();
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                handleFinish();
                close();
                return;
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [currentStep, close]);

    // Handle wizard controls
    const handleStart = () => setCurrentStep(1);
    const handleNext = () => setCurrentStep(Math.min(steps.length, currentStep + 1));
    const handlePrev = () => setCurrentStep(Math.max(1, currentStep - 1));
    const handleFinish = () => {
        setCurrentStep(0);
        close();
    };
    // Handle drag handle
    const handlePointerDown = (e: PointerEvent) => {
        dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            originRight: position.right,
            originBottom: position.bottom,
        };
        setIsDragging(true);
    };

    const isStartScreen = currentStep === 0;
    const wizardStatus = isStartScreen ? `${steps.length}-step walkthrough` : `Step ${currentStep} of ${steps.length}`;

    return (
        <div
            ref={wizardRef}
            className={`flowforge-wizard ${isDragging ? 'flowforge-wizard--dragging' : ''}`}
            aria-labelledby="flowforge-wizard-title"
            style={{
                right: `${position.right}px`,
                bottom: `${position.bottom}px`,
            }}
        >
            <div className="flowforge-wizard__drag-handle" onPointerDown={handlePointerDown}>
                <h2 id="flowforge-wizard-title" className="flowforge-wizard__title">
                    {title}
                </h2>
            </div>
            <p className="flowforge-wizard__text">{description}</p>

            <div className="flowforge-wizard-controls">
                <h4 className="flowforge-wizard-controls__title">{wizardStatus}</h4>

                <div
                    className={`flowforge-wizard-controls-list ${
                        isStartScreen
                            ? 'flowforge-wizard-controls-list--start'
                            : 'flowforge-wizard-controls-list--steps'
                    }`}
                >
                    {isStartScreen ? (
                        <>
                            <button type="button" className="flowforge-button" onClick={handleStart}>
                                Start onboarding
                            </button>
                            <button
                                type="button"
                                className="flowforge-button flowforge-button--secondary"
                                onClick={handleFinish}
                            >
                                Finish
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                className="flowforge-button"
                                onClick={handlePrev}
                                disabled={currentStep <= 1}
                            >
                                Previous
                            </button>
                            <button
                                type="button"
                                className="flowforge-button"
                                onClick={handleNext}
                                disabled={currentStep >= steps.length}
                            >
                                Next
                            </button>
                            <button
                                type="button"
                                className="flowforge-button flowforge-button--secondary"
                                onClick={handleFinish}
                            >
                                Finish
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
