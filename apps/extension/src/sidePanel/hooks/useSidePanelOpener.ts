import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

import type { InspectorPopupBackgroundClient } from '@/background';

/** Prepares a tab-specific panel before the click so opening retains the user gesture. */
export function useSidePanelOpener(backgroundClient: InspectorPopupBackgroundClient) {
    const [pageId, setPageId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isOpening, setIsOpening] = useState(false);
    const openingRef = useRef(false);

    useEffect(() => {
        let active = true;
        void backgroundClient
            .preparePageInspector()
            .then((id) => {
                if (active) setPageId(id);
            })
            .catch(() => {
                if (active) setError('Page Inspector is unavailable for this tab.');
            });
        return () => {
            active = false;
        };
    }, [backgroundClient]);

    const openPageInspector = useCallback(
        async (tab?: string): Promise<boolean> => {
            if (pageId === null || openingRef.current) return false;
            openingRef.current = true;
            setIsOpening(true);
            setError(null);
            try {
                await backgroundClient.openPageInspectorForPage(pageId, tab);
                return true;
            } catch {
                setError('Could not open Page Inspector. Please try again.');
                return false;
            } finally {
                openingRef.current = false;
                setIsOpening(false);
            }
        },
        [backgroundClient, pageId],
    );

    return { canOpen: pageId !== null && !isOpening, error, openPageInspector };
}
