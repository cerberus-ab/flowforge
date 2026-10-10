import { config } from '@/config';
import { useCallback, useEffect } from 'preact/hooks';
import type { InspectorPopupBackgroundClient } from '@/background';

export interface UseInspectorPopupOptions {
    backgroundClient: InspectorPopupBackgroundClient;
}

export interface InspectorPopupViewModel {
    copyright: string;
    github: string;
    website: string;
    openPageInspector: (tab?: string) => Promise<void>;
}

export function useInspectorPopup({ backgroundClient }: UseInspectorPopupOptions): InspectorPopupViewModel {
    // Clear page UI state when popup opens.
    useEffect(() => {
        void (async () => {
            try {
                await backgroundClient.notifyPopupOpened();
            } catch {
                // Popup startup should not fail if the active tab cannot receive page messages.
            }
        })();
    }, [backgroundClient]);

    // Handle open inspector
    const handleOpenPageInspector = useCallback(
        async (tab?: string) => {
            await backgroundClient.openPageInspector(tab);
        },
        [backgroundClient],
    );

    return {
        copyright: config.copyright,
        github: config.github,
        website: config.website,
        // actions
        openPageInspector: handleOpenPageInspector,
    };
}
