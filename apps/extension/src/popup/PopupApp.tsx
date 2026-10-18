import { useCallback, useRef } from 'preact/hooks';
import type { PopupBackgroundClient } from '@/background';

import { usePopup } from './hooks/usePopup';
import { Question } from './components/Question';
import { Loading } from './components/Loading';
import { Result } from './components/Result';
import { Examples } from './components/Examples';
import { Advanced } from '@/popup/components/Advanced';
import { ButtonText } from '@/shared/components/Button';
import { Link } from '@/shared/components/Link';
import { Notice } from '@/shared/components/Notice';
import type { ExtensionSettingsTheme } from '@/types';

export interface PopupDemoPresentation {
    topic?: string;
}

export interface PopupAppProps {
    variant: 'page' | 'dialog';
    backgroundClient: PopupBackgroundClient;
    demoPresentation?: PopupDemoPresentation;
    presetQuestions?: string[];
    theme: ExtensionSettingsTheme;
    onToggleTheme: () => Promise<void>;
    initialQuestion?: string;
    onClose?: () => void;
    sidePanelOpener?: {
        canOpen: boolean;
        error: string | null;
        openPageInspector: (tab?: string) => Promise<boolean>;
    };
}

export function PopupApp({
    variant,
    backgroundClient,
    demoPresentation,
    presetQuestions,
    theme,
    onToggleTheme,
    initialQuestion,
    onClose,
    sidePanelOpener,
}: PopupAppProps) {
    const {
        inputQuestion,
        setInputQuestion,
        isLoading,
        isClearingResult,
        result,
        resultMetadata,
        isResultStale,
        warning,
        error,
        examples,
        copyright,
        github,
        askQuestion,
        askPresetQuestion,
        presetSubmitLabel,
        isUnavailableQuestion,
        clearResult,
        openOnboarding,
        applyExampleQuestion,
        navigateToElement,
    } = usePopup({
        backgroundClient,
        presetQuestions,
        initialQuestion,
    });

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

    // Chrome uses a prepared side panel; embed keeps its page overlay.
    const handleOpenPageInspector = useCallback(
        async (tab?: string) => {
            if (sidePanelOpener) {
                if (!(await sidePanelOpener.openPageInspector(tab))) return;
            } else {
                await backgroundClient.openPageInspector(tab);
            }
            onClose?.();
        },
        [backgroundClient, onClose, sidePanelOpener],
    );

    // Handle open onboarding on the page
    const handleOpenOnboarding = useCallback(async () => {
        await openOnboarding();
        onClose?.();
    }, [openOnboarding, onClose]);

    const isPresetMode = presetQuestions !== undefined;
    const hasPresetQuestions = Boolean(presetQuestions?.length);
    const questionPlaceholder = !isPresetMode
        ? 'I can forge the page for you...'
        : hasPresetQuestions
          ? 'Choose a question below, or ask the next one.'
          : 'No preset questions available.';

    const isDialog = variant === 'dialog';
    const Root = isDialog ? 'section' : 'div';

    return (
        <Root
            id={isDialog ? 'flowforge-popup' : undefined}
            className="flowforge-popup"
            role={isDialog ? 'dialog' : undefined}
            aria-modal={isDialog ? 'false' : undefined}
            aria-labelledby={isDialog ? 'flowforge-popup-title' : undefined}
            data-testid="flowforge-popup"
        >
            <header className="flowforge-popup__header flowforge-popup__header--parallax">
                <h2 id={isDialog ? 'flowforge-popup-title' : undefined} className="flowforge-popup__header-title">
                    FlowForge
                </h2>
                <p className="flowforge-popup__header-subtitle">Web Onboarding Assistant</p>
            </header>
            <div ref={contentRef} className="flowforge-popup__content" data-testid="flowforge-popup-content">
                {demoPresentation && (
                    <Notice
                        type="status"
                        text={
                            demoPresentation.topic
                                ? `✧ Demo for ${demoPresentation.topic} enabled ✧`
                                : '✧ Demo mode enabled ✧'
                        }
                    />
                )}
                <Question
                    inputQuestion={inputQuestion}
                    onInputQuestionChange={setInputQuestion}
                    onAskQuestion={isPresetMode ? askPresetQuestion : askQuestion}
                    placeholder={questionPlaceholder}
                    disabled={
                        isLoading || isClearingResult || isUnavailableQuestion || (isPresetMode && !hasPresetQuestions)
                    }
                    readOnly={isPresetMode}
                    submitLabel={isPresetMode ? presetSubmitLabel : 'Ask anything'}
                />

                {isLoading && <Loading />}

                {warning && <Notice type="note" text={warning} />}

                {(result || error) && (
                    <Result
                        result={result}
                        resultMetadata={resultMetadata}
                        isStale={isResultStale}
                        error={error}
                        onNavigateToElement={navigateToElement}
                        onOpenOnboarding={handleOpenOnboarding}
                        onClearResult={() => void clearResult()}
                        isClearing={isClearingResult}
                    />
                )}

                <Examples
                    examples={examples}
                    onExampleQuestionSelect={handleApplyExampleQuestion}
                    disabled={isLoading || isClearingResult}
                    title={isPresetMode ? 'Available questions' : 'Try one of these'}
                />

                <Advanced
                    onOpenPageInspector={handleOpenPageInspector}
                    disabled={sidePanelOpener !== undefined && !sidePanelOpener.canOpen}
                    error={sidePanelOpener?.error}
                />

                <footer className="flowforge-popup__footer">
                    <div className="flowforge-popup__footer-copyright">{copyright}</div>
                    <div className="flowforge-popup__footer-actions">
                        <Link href={github}>Star me</Link>
                        <ButtonText onClick={onToggleTheme}>{theme === 'light' ? 'Dark' : 'Light'} theme</ButtonText>
                    </div>
                </footer>
            </div>
        </Root>
    );
}
