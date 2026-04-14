import type { QuestionViewModel } from '#self/popup/hooks/usePopup.types';
import type { TargetedInputEvent } from 'preact';
import { Button } from '#self/shared/components/Button';
import { Card } from '#self/shared/components/Card';

interface QuestionProps extends QuestionViewModel {
    disabled: boolean;
}

export function Question({ question, setQuestion, askQuestion, disabled }: QuestionProps) {
    const handleOnInput = (e: TargetedInputEvent<HTMLTextAreaElement>) => {
        setQuestion((e.currentTarget as HTMLTextAreaElement).value);
    };
    const handleOnKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            askQuestion();
        }
    };
    return (
        <Card title="Ask a question about this page">
            <textarea
                autoFocus
                name="question"
                className="flowforge-input-textarea"
                placeholder="I can forge the page for you..."
                aria-label="Your question"
                rows={4}
                value={question}
                onInput={handleOnInput}
                onKeyDown={handleOnKeyDown}
                disabled={disabled}
            />
            <Button size="large" wide onClick={askQuestion} disabled={disabled}>
                Ask anything
            </Button>
        </Card>
    );
}
