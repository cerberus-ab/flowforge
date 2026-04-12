import { Question } from './components/Question';
import { Loading } from './components/Loading';
import { Result } from './components/Result';
import { Examples } from './components/Examples';
import { usePopup } from './hooks/usePopup';
import type { TransportService } from '#self/adapters/interface';
import { useCallback, useRef } from 'preact/hooks';

interface PopupAppProps {
    transport: TransportService;
}

export function PopupApp({ transport }: PopupAppProps) {
    const {
        question,
        setQuestion,
        isLoading,
        result,
        error,
        examples,
        copyright,
        askQuestion,
        applyExampleQuestion,
        navigateToElement,
    } = usePopup({ transport });

    const contentRef = useRef<HTMLDivElement>(null);

    // Handle example selection with scroll to top
    const handleApplyExampleQuestion = useCallback(
        (value: string) => {
            applyExampleQuestion(value);

            contentRef.current?.scrollTo({
                top: 0,
                behavior: 'smooth',
            });
        },
        [applyExampleQuestion],
    );

    return (
        <div className="flowforge-main flowforge-main--popup">
            <main className="flowforge-popup">
                <header className="flowforge-popup__header">
                    <h1 className="flowforge-popup__header-title">FlowForge</h1>
                    <p className="flowforge-popup__header-subtitle">Web Onboarding Assistant</p>
                </header>

                <div ref={contentRef} className="flowforge-popup__content">
                    <Question
                        question={question}
                        setQuestion={setQuestion}
                        askQuestion={askQuestion}
                        disabled={isLoading}
                    />

                    {isLoading && <Loading />}

                    {(result || error) && (
                        <Result result={result} error={error} navigateToElement={navigateToElement} />
                    )}

                    <Examples examples={examples} applyExampleQuestion={handleApplyExampleQuestion} />

                    {copyright && <footer className="flowforge-popup__footer">{copyright}</footer>}
                </div>
            </main>
        </div>
    );
}
