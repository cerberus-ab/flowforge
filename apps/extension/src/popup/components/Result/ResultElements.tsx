import type { AgentResultElement, AgentResultMode } from '@flowforge/contract';
import { cx } from '@/shared/utils/cx';

interface ResultElementsProps {
    elements: AgentResultElement[];
    mode: AgentResultMode;
    onNavigateToElement: (element: AgentResultElement) => void;
}

export function ResultElements({ elements, mode, onNavigateToElement }: ResultElementsProps) {
    const isSteps = mode === 'steps';

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
        </div>
    );
}
