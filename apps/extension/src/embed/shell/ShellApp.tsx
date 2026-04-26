import type { TransportService } from '#self/adapters/interface';

import { Main } from '#self/shared/components/Main';
import { PopupApp, type PopupAppDemoProps } from '#self/popup/PopupApp';
import { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'preact/hooks';
import { getEventTarget } from '#self/core/utils/dom';
import { forwardRef } from 'preact/compat';
import { PageApp } from '#self/page/PageApp';
import { useSettings } from '#self/shared/hooks/useSettings';
import { Trigger } from '#self/embed/components/Trigger';
import type { TriggerSize } from '#self/embed/components/Trigger/Trigger';

export type ShellAppDemoProps = PopupAppDemoProps;

export interface ShellAppProps {
    transport: TransportService;
    demoProps?: ShellAppDemoProps;
    triggerSize?: TriggerSize;
}

export interface ShellAppRef {
    open: (question?: string) => void;
    close: () => void;
}

export const ShellApp = forwardRef<ShellAppRef, ShellAppProps>(function ShellApp({ transport, demoProps, triggerSize }, ref) {
    const [isOpen, setIsOpen] = useState(false);
    const [initialQuestion, setInitialQuestion] = useState<string>();
    const { theme, toggleTheme } = useSettings({ transport });

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
        function handleClickOutside(e: MouseEvent) {
            const target = getEventTarget(e);
            if (
                popupRef.current &&
                !popupRef.current.contains(target) &&
                triggerRef.current &&
                !triggerRef.current.contains(target)
            ) {
                closePopup();
            }
        }
        // Close popup when pressing escape
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = getEventTarget(e);
            // if typing in an input, don't escape
            if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;

            if (e.key === 'Escape') {
                e.preventDefault();
                closePopup();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, closePopup]);

    return (
        <Main theme={theme}>
            <div className="flowforge-shell">
                <PageApp transport={transport} />
                <Trigger ref={triggerRef} size={triggerSize} isOpen={isOpen} onToggle={togglePopup} />
                {isOpen && (
                    <div className="flowforge-popup-container" ref={popupRef}>
                        <PopupApp
                            variant="dialog"
                            transport={transport}
                            demoProps={demoProps}
                            theme={theme}
                            toggleTheme={toggleTheme}
                            initialQuestion={initialQuestion}
                        />
                    </div>
                )}
            </div>
        </Main>
    );
});
