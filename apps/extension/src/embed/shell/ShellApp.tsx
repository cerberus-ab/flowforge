import { Main } from '@/shared/components/Main';
import { PopupApp, type PopupDemoPresentation } from '@/popup/PopupApp';
import { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'preact/hooks';
import { getEventTarget } from '@/shared/utils/dom';
import { forwardRef } from 'preact/compat';
import { PageApp } from '@/page/PageApp';
import { useSettings } from '@/shared/hooks/useSettings';
import { Trigger } from '@/embed/shell/components/Trigger';
import type { TriggerSize } from '@/embed/shell/components/Trigger/Trigger';
import type { AssistantBackgroundClient } from '@/background';

export interface ShellAppProps {
    backgroundClient: AssistantBackgroundClient;
    demoPresentation?: PopupDemoPresentation;
    presetQuestions?: string[];
    triggerSize?: TriggerSize;
    onShellReady?: () => void;
}

export interface ShellAppRef {
    open: (question?: string) => void;
    close: () => void;
}

export const ShellApp = forwardRef<ShellAppRef, ShellAppProps>(function ShellApp(
    { backgroundClient, demoPresentation, presetQuestions, triggerSize, onShellReady },
    ref,
) {
    const [isOpen, setIsOpen] = useState(false);
    const [initialQuestion, setInitialQuestion] = useState<string>();
    const settings = useSettings({ backgroundClient });

    const triggerRef = useRef<HTMLButtonElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);

    const openPopup = useCallback((question?: string) => {
        setInitialQuestion(question);
        setIsOpen(true);
    }, []);

    const closePopup = useCallback(() => {
        setIsOpen(false);
        setInitialQuestion(undefined);
    }, []);

    const togglePopup = useCallback(() => {
        if (isOpen) {
            closePopup();
        } else {
            openPopup();
        }
    }, [isOpen, openPopup, closePopup]);

    useImperativeHandle(ref, () => ({
        open: openPopup,
        close: closePopup,
    }));

    useEffect(() => {
        if (!isOpen) return;

        // Close popup when clicking outside of it
        function handlePointerDownOutside(e: PointerEvent) {
            const target = getEventTarget(e);

            if (!target) return;

            const isInsidePopup = popupRef.current?.contains(target) ?? false;
            const isInsideTrigger = triggerRef.current?.contains(target) ?? false;

            if (!isInsidePopup && !isInsideTrigger) {
                closePopup();
            }
        }

        // Close popup when pressing escape
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;

            const target = getEventTarget(e);
            // if typing in an input, don't escape
            if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;

            e.preventDefault();
            closePopup();
        };

        document.addEventListener('pointerdown', handlePointerDownOutside);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('pointerdown', handlePointerDownOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, closePopup]);

    if (settings.status === 'loading') {
        return null;
    }
    return (
        <Main theme={settings.theme}>
            <div className="flowforge-shell">
                <PageApp
                    backgroundClient={backgroundClient}
                    devMode={settings.devMode}
                    onDevModeChange={settings.setDevMode}
                    onReady={onShellReady}
                />
                <Trigger ref={triggerRef} size={triggerSize} isOpen={isOpen} onToggle={togglePopup} />
                {isOpen && (
                    <div className="flowforge-popup-container" ref={popupRef}>
                        <PopupApp
                            variant="dialog"
                            backgroundClient={backgroundClient}
                            demoPresentation={demoPresentation}
                            presetQuestions={presetQuestions}
                            theme={settings.theme}
                            onToggleTheme={settings.toggleTheme}
                            initialQuestion={initialQuestion}
                            onClose={closePopup}
                        />
                    </div>
                )}
            </div>
        </Main>
    );
});
