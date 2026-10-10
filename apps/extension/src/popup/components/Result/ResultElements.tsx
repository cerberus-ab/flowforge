import type { AgentResultElement, AgentResultMode } from '@flowforge/contract';
import { cx } from '@/shared/utils/cx';
import { Button } from '@/shared/components/Button';
import { useEffect, useRef } from 'preact/hooks';

interface ResultElementsProps {
    elements: AgentResultElement[];
    mode: AgentResultMode;
    onNavigateToElement: (element: AgentResultElement) => void;
    onOpenOnboarding: () => void;
}

export function ResultElements({ elements, mode, onNavigateToElement, onOpenOnboarding }: ResultElementsProps) {
    const isSteps = mode === 'steps';
    const openOnboardingButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (isSteps) openOnboardingButtonRef.current?.focus();
    }, [isSteps]);

    return (
        <div className="flowforge-elements" data-testid="flowforge-result-elements">
            <h4 className="flowforge-elements__title">{isSteps ? 'Walkthrough' : 'Relevant findings'}</h4>
            <div className={cx('flowforge-elements-list', isSteps && 'flowforge-elements-list--steps')}>
                {elements.map((element, i) =>
                    !isSteps ? (
                        <button
                            key={i}
                            type="button"
                            className="flowforge-element-item flowforge-element-item--chip"
                            data-testid={`flowforge-result-element-${element.dataId || i}`}
                            onClick={() => onNavigateToElement(element)}
                        >
                            {element.text}
                        </button>
                    ) : (
                        <div
                            key={`element-item-${i + 1}`}
                            className="flowforge-element-item"
                            data-testid={`flowforge-result-step-${element.dataId || i}`}
                        >
                            <span>Step {i + 1}: </span>
                            {element.text}
                        </div>
                    ),
                )}
            </div>
            {isSteps && (
                <div className="flowforge-elements__actions">
                    <span className="flowforge-elements__action-label">To continue:</span>
                    <Button
                        size="small"
                        onClick={onOpenOnboarding}
                        ref={openOnboardingButtonRef}
                        data-testid="flowforge-open-onboarding"
                    >
                        Open onboarding
                    </Button>
                </div>
            )}
        </div>
    );
}
