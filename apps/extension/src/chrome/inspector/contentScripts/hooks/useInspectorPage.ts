import type { Message } from '@/types';
import { isClearPageMessage, isOpenInspectorMessage } from '@/types';
import { useCallback, useLayoutEffect, useState } from 'preact/hooks';
import type { TransportService } from '@/adapters/interface';
import { constants } from '@/constants';
import { PageTrail, PageTrailCollector } from '@flowforge/page-trail';

function collectPageTrail(): PageTrail {
    return PageTrailCollector.collectFor(window, document, {
        contentElementsLimit: constants.CONTENT_ELEMENTS_LIMIT,
        interactiveElementsLimit: constants.INTERACTIVE_ELEMENTS_LIMIT,
        contextOnly: true,
    });
}

export interface UseInspectorPageOptions {
    transport: TransportService;
    devMode: boolean;
    onDevModeChange: (enabled: boolean) => void | Promise<void>;
}

interface InspectorState {
    pageTrail: PageTrail;
    initialTab?: string;
}

interface InspectorViewModel extends InspectorState {
    close: () => void;
    devMode: boolean;
    onDevModeChange: (enabled: boolean) => void | Promise<void>;
}

export interface InspectorPageViewModel {
    inspector: InspectorViewModel | null;
}

export function useInspectorPage({
    transport,
    devMode,
    onDevModeChange,
}: UseInspectorPageOptions): InspectorPageViewModel {
    const [inspector, setInspector] = useState<InspectorState | null>(null);

    const openInspector = useCallback((pageTrail: PageTrail, initialTab?: string) => {
        setInspector({ pageTrail, initialTab });
    }, []);

    const closeInspector = useCallback(() => {
        setInspector(null);
    }, []);

    // Listen to messages from background
    useLayoutEffect(() => {
        return transport.addMessageListener((message: Message) => {
            if (isClearPageMessage(message)) {
                closeInspector();
                return { success: true };
            }
            if (isOpenInspectorMessage(message)) {
                const pageTrail = collectPageTrail();
                openInspector(pageTrail, message.data.tab);
                return { success: true };
            }
            return undefined;
        });
    }, [transport, openInspector, closeInspector]);

    return {
        inspector: inspector
            ? {
                  ...inspector,
                  close: closeInspector,
                  devMode,
                  onDevModeChange,
              }
            : null,
    };
}
