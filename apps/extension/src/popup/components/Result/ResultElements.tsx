import type { AgentResultElement, AgentResultMode } from '@flowforge/shared';

interface ResultElementsProps {
    elements: AgentResultElement[];
    mode: AgentResultMode;
    navigateToElement: (element: AgentResultElement) => void;
}

export function ResultElements({ elements, mode, navigateToElement }: ResultElementsProps) {
    const isSteps = mode === 'steps';

    return (
        <div className="flowforge-elements">
            <h4 className="flowforge-elements__title">{isSteps ? 'Walkthrough' : 'Relevant findings'}</h4>
            <div
                className={
                    isSteps ? 'flowforge-elements-list flowforge-elements-list--steps' : 'flowforge-elements-list'
                }
            >
                {elements.map((element, i) =>
                    !isSteps ? (
                        <button
                            key={i}
                            type="button"
                            className="flowforge-element-item flowforge-element-item--chip"
                            onClick={() => navigateToElement(element)}
                        >
                            {element.text}
                        </button>
                    ) : (
                        <div key={`element-item-${i + 1}`} className="flowforge-element-item">
                            <span>Step {i + 1}: </span>
                            {element.text}
                        </div>
                    ),
                )}
            </div>
        </div>
    );
}
