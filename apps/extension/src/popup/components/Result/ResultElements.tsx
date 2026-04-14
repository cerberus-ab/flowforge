import type { AgentResultElement, AgentResultMode } from '@flowforge/shared';
import type { JSX } from 'preact';

interface ResultElementsProps {
    titleTag?: keyof JSX.IntrinsicElements;
    elements: AgentResultElement[];
    mode: AgentResultMode;
    navigateToElement: (element: AgentResultElement) => void;
}

export function ResultElements({ titleTag = 'h3', elements, mode, navigateToElement }: ResultElementsProps) {
    const isSteps = mode === 'steps';
    const TitleTag = titleTag;

    return (
        <div className="flowforge-elements">
            <TitleTag className="flowforge-elements__title">{isSteps ? 'Walkthrough' : 'Relevant findings'}</TitleTag>
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
