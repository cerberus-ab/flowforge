import { useCallback, useRef } from 'preact/hooks';
import type { TransportService } from '#self/adapters/interface';

import { usePopup } from './hooks/usePopup';
import { Main } from '#self/shared/components/Main';
import { Question } from './components/Question';
import { Loading } from './components/Loading';
import { Result } from './components/Result';
import { Examples } from './components/Examples';
import { ButtonText } from '#self/shared/components/Button';
import { useSettings } from '#self/shared/hooks/useSettings';
import { Link } from '#self/shared/components/Link';

interface PopupAppProps {
    transport: TransportService;
}

export function PopupApp({ transport }: PopupAppProps) {
    const {
        question,
        setQuestion,
        isLoading,
        result,
        resultMetadata,
        error,
        examples,
        copyright,
        github,
        askQuestion,
        applyExampleQuestion,
        navigateToElement,
    } = usePopup({ transport });
    const { theme, toggleTheme } = useSettings({ transport });

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
        <Main theme={theme}>
            <main className="flowforge-popup">
                <header className="flowforge-popup__header flowforge-popup__header--parallax">
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
                        <Result
                            result={result}
                            resultMetadata={resultMetadata}
                            error={error}
                            navigateToElement={navigateToElement}
                        />
                    )}

                    <Examples examples={examples} applyExampleQuestion={handleApplyExampleQuestion} />

                    <footer className="flowforge-popup__footer">
                        <div className="flowforge-popup__copyright">{copyright}</div>
                        <Link href={github}>Star me</Link>
                        <ButtonText onClick={toggleTheme}>{theme === 'light' ? 'Dark' : 'Light'} theme</ButtonText>
                    </footer>
                </div>
            </main>
        </Main>
    );
}
