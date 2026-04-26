import type { QuestionViewModel } from '#self/popup/hooks/usePopup.types';
import type { TargetedInputEvent, TargetedSubmitEvent } from 'preact';
import { Button } from '#self/shared/components/Button';
import { Card } from '#self/shared/components/Card';
import { useEffect, useRef } from 'preact/hooks';

interface QuestionProps extends QuestionViewModel {
    placeholder: string;
    selectOnly: boolean;
    disabled: boolean;
}

export function Question({ question, setQuestion, askQuestion, placeholder, selectOnly, disabled }: QuestionProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        textareaRef.current?.focus();
    }, []);

    const handleOnInput = (e: TargetedInputEvent<HTMLTextAreaElement>) => {
        setQuestion((e.currentTarget as HTMLTextAreaElement).value);
    };
    const handleOnKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            askQuestion();
        }
    };
    const handleOnSubmit = (e: TargetedSubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        askQuestion();
    };
    return (
        <Card title="Ask a question about this page">
            <form class="flowforge-question-form" onSubmit={handleOnSubmit}>
                <textarea
                    ref={textareaRef}
                    name="question"
                    className="flowforge-input-textarea"
                    placeholder={placeholder}
                    aria-label="Your question"
                    rows={4}
                    value={question}
                    onInput={handleOnInput}
                    onKeyDown={handleOnKeyDown}
                    readOnly={selectOnly}
                    disabled={disabled}
                />
                <Button type="submit" size="large" wide disabled={disabled}>
                    Ask anything
                </Button>
            </form>
        </Card>
    );
}
