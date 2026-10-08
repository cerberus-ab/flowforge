import { config } from '@/config';
import { useCallback, useEffect } from 'preact/hooks';
import type { Response, TransportService } from '@/adapters';
import type { OpenPageInspectorMessage, PopupInitializeMessage } from '@/types';

export interface UseInspectorPopupOptions {
    transport: TransportService;
}

export interface InspectorPopupViewModel {
    copyright: string;
    github: string;
    website: string;
    openPageInspector: (tab?: string) => Promise<void>;
}

export function useInspectorPopup({ transport }: UseInspectorPopupOptions): InspectorPopupViewModel {
    // Clear page UI state when popup opens.
    useEffect(() => {
        void (async () => {
            try {
                const message: PopupInitializeMessage = {
                    type: 'POPUP_INITIALISE',
                    senderId: await transport.getActivePageId(),
                };
                await transport.sendToBackground<PopupInitializeMessage, Response>(message);
            } catch {
                // Popup startup should not fail if the active tab cannot receive page messages.
            }
        })();
    }, [transport]);

    // Handle open inspector
    const handleOpenPageInspector = useCallback(
        async (tab?: string) => {
            const message: OpenPageInspectorMessage = {
                type: 'OPEN_PAGE_INSPECTOR',
                senderId: await transport.getActivePageId(),
                data: { tab },
            };
            await transport.sendToBackground<OpenPageInspectorMessage, Response>(message);
        },
        [transport],
    );

    return {
        copyright: config.copyright,
        github: config.github,
        website: config.website,
        // actions
        openPageInspector: handleOpenPageInspector,
    };
}
