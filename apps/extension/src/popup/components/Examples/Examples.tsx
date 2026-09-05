import type { PopupExampleItem } from '@/popup/utils/data';
import { Card } from '@/shared/components/Card';
import { cx } from '@/shared/utils/cx';

interface ExamplesProps {
    examples: PopupExampleItem[];
    onExampleQuestionSelect: (question: string) => void;
}

export function Examples({ examples, onExampleQuestionSelect }: ExamplesProps) {
    if (examples.length === 0) {
        return null;
    }
    return (
        <Card title="Try one of these" data-testid="flowforge-examples">
            <div className="flowforge-examples-list">
                <ul>
                    {examples.map((example, index) => (
                        <li key={index}>
                            <button
                                type="button"
                                className={cx(
                                    'flowforge-example-chip',
                                    `flowforge-example-chip--${example.type === 'default' ? 'primary' : 'secondary'}`,
                                )}
                                data-testid={`flowforge-example-${index}`}
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
