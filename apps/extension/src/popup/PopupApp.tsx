import { useCallback, useRef } from 'preact/hooks';
import type { TransportService } from '@/adapters/interface';

import { usePopup } from './hooks/usePopup';
import { Question } from './components/Question';
import { Loading } from './components/Loading';
import { Result } from './components/Result';
import { Examples } from './components/Examples';
import { Understanding } from '@/popup/components/Understanding';
import { ButtonText } from '@/shared/components/Button';
import { Link } from '@/shared/components/Link';
import { Notice } from '@/shared/components/Notice';
import type { ExtensionSettingsTheme } from '@/types';

export type PopupAppDemoProps =
    | {
          enabled: true;
          setup: {
              topic?: string;
              stubQuestions?: string[];
          };
      }
    | { enabled: false };

export interface PopupAppProps {
    variant: 'page' | 'dialog';
    transport: TransportService;
    demoProps?: PopupAppDemoProps;
    theme: ExtensionSettingsTheme;
    onToggleTheme: () => Promise<void>;
    initialQuestion?: string;
    onClose?: () => void;
}

export function PopupApp({
    variant,
    transport,
    demoProps,
    theme,
    onToggleTheme,
    initialQuestion,
    onClose,
}: PopupAppProps) {
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
        openPageInspector,
    } = usePopup({
        transport,
        presetQuestions: demoProps?.enabled ? demoProps.setup.stubQuestions : undefined,
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

    // Handle open page inspector and close popup
    const handleOpenPageInspector = useCallback(
        (tab?: string) => {
            openPageInspector(tab);
            onClose?.();
        },
        [openPageInspector, onClose],
    );

    const isDialog = variant === 'dialog';
    const Root = isDialog ? 'section' : 'div';

    return (
        <Root
            id={isDialog ? 'flowforge-popup' : undefined}
            className="flowforge-popup"
            role={isDialog ? 'dialog' : undefined}
            aria-modal={isDialog ? 'false' : undefined}
            aria-labelledby={isDialog ? 'flowforge-popup-title' : undefined}
        >
            <header className="flowforge-popup__header flowforge-popup__header--parallax">
                <h2 id={isDialog ? 'flowforge-popup-title' : undefined} className="flowforge-popup__header-title">
                    FlowForge
                </h2>
                <p className="flowforge-popup__header-subtitle">Web Onboarding Assistant</p>
            </header>
            <div ref={contentRef} className="flowforge-popup__content">
                {demoProps?.enabled && (
                    <Notice
                        type="status"
                        text={
                            demoProps.setup.topic
                                ? `✧ Demo for ${demoProps.setup.topic} enabled ✧`
                                : '✧ Demo mode enabled ✧'
                        }
                    />
                )}
                <Question
                    question={question}
                    onQuestionChange={setQuestion}
                    onAskQuestion={askQuestion}
                    placeholder={
                        demoProps?.enabled
                            ? 'I can forge the page... but only using preset options in Demo'
                            : 'I can forge the page for you... '
                    }
                    disabled={isLoading}
                    selectOnly={Boolean(demoProps?.enabled)}
                />

                {isLoading && <Loading />}

                {(result || error) && (
                    <Result
                        result={result}
                        resultMetadata={resultMetadata}
                        error={error}
                        onNavigateToElement={navigateToElement}
                    />
                )}

                <Examples examples={examples} onExampleQuestionSelect={handleApplyExampleQuestion} />

                <Understanding onOpenPageInspector={handleOpenPageInspector}></Understanding>

                <footer className="flowforge-popup__footer">
                    <div className="flowforge-popup__copyright">{copyright}</div>
                    <Link href={github}>Star me</Link>
                    <ButtonText onClick={onToggleTheme}>{theme === 'light' ? 'Dark' : 'Light'} theme</ButtonText>
                </footer>
            </div>
        </Root>
    );
}
