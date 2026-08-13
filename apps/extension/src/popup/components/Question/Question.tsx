import type { TargetedInputEvent, TargetedSubmitEvent } from 'preact';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { useEffect, useRef } from 'preact/hooks';

interface QuestionProps {
    question: string;
    onQuestionChange: (value: string) => void;
    onAskQuestion: () => Promise<void>;
    placeholder: string;
    selectOnly: boolean;
    disabled: boolean;
}

export function Question({
    question,
    onQuestionChange,
    onAskQuestion,
    placeholder,
    selectOnly,
    disabled,
}: QuestionProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        textareaRef.current?.focus();
    }, []);

    const handleOnInput = (e: TargetedInputEvent<HTMLTextAreaElement>) => {
        onQuestionChange((e.currentTarget as HTMLTextAreaElement).value);
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
