import type { TargetedInputEvent, TargetedSubmitEvent } from 'preact';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { useEffect, useRef } from 'preact/hooks';

interface QuestionProps {
    inputQuestion: string;
    onInputQuestionChange: (value: string) => void;
    onAskQuestion: () => Promise<void>;
    placeholder: string;
    readOnly: boolean;
    disabled: boolean;
    submitLabel: string;
}

export function Question({
    inputQuestion,
    onInputQuestionChange,
    onAskQuestion,
    placeholder,
    readOnly,
    disabled,
    submitLabel,
}: QuestionProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        textareaRef.current?.focus();
    }, []);

    const handleOnInput = (e: TargetedInputEvent<HTMLTextAreaElement>) => {
        onInputQuestionChange((e.currentTarget as HTMLTextAreaElement).value);
    };
    const handleOnKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void onAskQuestion();
        }
    };
    const handleOnSubmit = (e: TargetedSubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        void onAskQuestion();
    };
    return (
        <Card title="Ask a question about this page">
            <form class="flowforge-question-form" data-testid="flowforge-question-form" onSubmit={handleOnSubmit}>
                <textarea
                    ref={textareaRef}
                    name="question"
                    className="flowforge-input-textarea"
                    placeholder={placeholder}
                    aria-label="Your question"
                    data-testid="flowforge-question-input"
                    rows={4}
                    value={inputQuestion}
                    onInput={handleOnInput}
                    onKeyDown={handleOnKeyDown}
                    readOnly={readOnly}
                    disabled={disabled}
                />
                <Button type="submit" size="large" wide disabled={disabled} data-testid="flowforge-question-submit">
                    {submitLabel}
                </Button>
            </form>
        </Card>
    );
}
