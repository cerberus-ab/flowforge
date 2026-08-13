import type { PopupExampleItem } from '@/popup/utils/data';
import { Card } from '@/shared/components/Card';

interface ExamplesProps {
    examples: PopupExampleItem[];
    onExampleQuestionSelect: (question: string) => void;
}

export function Examples({ examples, onExampleQuestionSelect }: ExamplesProps) {
    if (examples.length === 0) {
        return null;
    }
    return (
        <Card title="Try one of these">
            <div className="flowforge-examples-list">
                <ul>
                    {examples.map((example, index) => (
                        <li key={index}>
                            <button
                                type="button"
                                className={`flowforge-example-chip flowforge-example-chip--${
                                    example.type === 'default' ? 'primary' : 'secondary'
                                }`}
                                onClick={() => onExampleQuestionSelect(example.question)}
                            >
                                {example.question}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </Card>
    );
}
