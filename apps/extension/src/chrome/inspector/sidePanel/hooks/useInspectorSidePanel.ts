import { useEffect, useState } from 'preact/hooks';
import { PageTrail } from '@flowforge/page-trail';

import type { PageInspectorDataBackgroundClient } from '@/background';

export interface UseInspectorSidePanelOptions {
    backgroundClient: PageInspectorDataBackgroundClient;
    pageId: number | null;
}

export type InspectorSidePanelViewModel =
    { status: 'loading' } | { status: 'ready'; pageTrail: PageTrail } | { status: 'error' };

export function useInspectorSidePanel({
    backgroundClient,
    pageId,
}: UseInspectorSidePanelOptions): InspectorSidePanelViewModel {
    const [snapshot, setSnapshot] = useState<InspectorSidePanelViewModel>({ status: 'loading' });

    // Collect context from the tab bound to this panel, not whichever tab is currently active.
    useEffect(() => {
        if (pageId === null) return;
        let active = true;
        setSnapshot({ status: 'loading' });
        void backgroundClient
            .getPageInspectorData(pageId)
            .then((dto) => {
                if (active) setSnapshot({ status: 'ready', pageTrail: PageTrail.fromDto(dto) });
            })
            .catch(() => {
                if (active) setSnapshot({ status: 'error' });
            });
        return () => {
            active = false;
        };
    }, [backgroundClient, pageId]);

    return snapshot;
}
