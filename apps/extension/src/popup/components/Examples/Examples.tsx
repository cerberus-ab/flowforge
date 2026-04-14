import type { ExamplesViewModel } from '#self/popup/hooks/usePopup.types';
import { Card } from '#self/shared/components/Card';

export function Examples({ examples, applyExampleQuestion }: ExamplesViewModel) {
    if (examples.length === 0) {
        return null;
    }
    return (
        <Card title="Try one of these">
            <div className="flowforge-examples-list">
                {examples.map((example, index) => (
                    <button
                        key={index}
                        type="button"
                        className={`flowforge-example-chip flowforge-example-chip--${
                            example.type === 'default' ? 'primary' : 'secondary'
                        }`}
                        onClick={() => applyExampleQuestion(example.question)}
                    >
                        {example.question}
                    </button>
                ))}
            </div>
        </Card>
    );
}
