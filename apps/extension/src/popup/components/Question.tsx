import type { QuestionViewModel } from '#self/popup/hooks/types';
import type { TargetedInputEvent } from 'preact';

interface QuestionSectionProps extends QuestionViewModel {
    disabled: boolean;
}

export function Question({ question, setQuestion, askQuestion, disabled }: QuestionSectionProps) {
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
        <section className="flowforge-card" aria-labelledby="flowforge-question-heading">
            <h2 id="flowforge-question-heading" className="flowforge-card__title">
                Ask a question about this page
            </h2>
            <textarea
                autofocus
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
            <button
                type="button"
                className="flowforge-button flowforge-button--lg flowforge-button--wide flowforge-button--primary"
                onClick={askQuestion}
                disabled={disabled}
            >
                Ask question
            </button>
        </section>
    );
}
