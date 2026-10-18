import { useEffect, useState } from 'preact/hooks';
import { PageTrail } from '@flowforge/page-trail';

import type { PageInspectorDataBackgroundClient } from '@/background';

export interface UseInspectorSidePanelOptions {
    backgroundClient: PageInspectorDataBackgroundClient;
    pageId: number | null;
}

type InspectorSnapshot = { status: 'loading' } | { status: 'ready'; pageTrail: PageTrail } | { status: 'error' };

export interface InspectorSidePanelViewModel {
    snapshot: InspectorSnapshot;
    requestedTab?: string;
    openVersion: number;
}

export function useInspectorSidePanel({
    backgroundClient,
    pageId,
}: UseInspectorSidePanelOptions): InspectorSidePanelViewModel {
    const [snapshot, setSnapshot] = useState<InspectorSnapshot>({ status: 'loading' });
    const [openRequest, setOpenRequest] = useState<{ tab?: string; version: number }>({ version: 0 });

    // Keep the snapshot tied to its tab across reopenings and navigation.
    useEffect(() => {
        if (pageId === null) return;
        let active = true;
        let requestVersion = 0;

        const invalidate = () => {
            requestVersion++;
            setSnapshot({ status: 'loading' });
        };

        const refresh = () => {
            invalidate();
            const currentVersion = requestVersion;
            void (async () => {
                for (let attempt = 0; attempt < 4; attempt++) {
                    try {
                        const dto = await backgroundClient.getPageInspectorData(pageId);
                        if (active && requestVersion === currentVersion) {
                            setSnapshot({ status: 'ready', pageTrail: PageTrail.fromDto(dto) });
                        }
                        return;
                    } catch {
                        if (!active || requestVersion !== currentVersion) return;
                        if (attempt === 3) {
                            setSnapshot({ status: 'error' });
                            return;
                        }
                        // Chrome may report navigation complete before the content script starts listening.
                        await new Promise<void>((resolve) => setTimeout(resolve, 100 * (attempt + 1)));
                    }
                }
            })();
        };

        const onTabUpdated = (tabId: number, changeInfo: chrome.tabs.OnUpdatedInfo) => {
            if (tabId !== pageId) return;
            if (changeInfo.status === 'loading') invalidate();
            if (changeInfo.status === 'complete' || (changeInfo.url && changeInfo.status === undefined)) refresh();
        };

        const unsubscribe = backgroundClient.subscribeToSidePanelMessages(pageId, {
            onRefreshPageInspector: (tab) => {
                setOpenRequest((current) => ({ tab, version: current.version + 1 }));
                refresh();
            },
        });
        chrome.tabs.onUpdated.addListener(onTabUpdated);
        refresh();

        return () => {
            active = false;
            requestVersion++;
            unsubscribe();
            chrome.tabs.onUpdated.removeListener(onTabUpdated);
        };
    }, [backgroundClient, pageId]);

    return { snapshot, requestedTab: openRequest.tab, openVersion: openRequest.version };
}
