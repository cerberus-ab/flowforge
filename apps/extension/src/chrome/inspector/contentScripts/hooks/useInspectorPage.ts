import { useCallback, useLayoutEffect, useState } from 'preact/hooks';
import { constants } from '@/constants';
import { PageTrail, PageTrailCollector } from '@flowforge/page-trail';
import type { InspectorPageBackgroundClient } from '@/background/client/contract';

function collectPageTrail(): PageTrail {
    return PageTrailCollector.collectFor(window, document, {
        contentElementsLimit: constants.CONTENT_ELEMENTS_LIMIT,
        interactiveElementsLimit: constants.INTERACTIVE_ELEMENTS_LIMIT,
        contextOnly: true,
    });
}

export interface UseInspectorPageOptions {
    backgroundClient: InspectorPageBackgroundClient;
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
    backgroundClient,
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
        return backgroundClient.subscribeToInspectorPageMessages({
            onClearPage: closeInspector,
            onOpenInspector: (tab) => openInspector(collectPageTrail(), tab),
        });
    }, [backgroundClient, openInspector, closeInspector]);

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
