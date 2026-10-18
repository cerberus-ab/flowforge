import { config } from '@/config';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import type { InspectorPopupBackgroundClient } from '@/background';

export interface UseInspectorPopupOptions {
    backgroundClient: InspectorPopupBackgroundClient;
}

export interface InspectorPopupViewModel {
    copyright: string;
    github: string;
    website: string;
    canOpen: boolean;
    error: string | null;
    openPageInspector: () => Promise<boolean>;
}

export function useInspectorPopup({ backgroundClient }: UseInspectorPopupOptions): InspectorPopupViewModel {
    const [pageId, setPageId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isOpening, setIsOpening] = useState(false);
    const openingRef = useRef(false);

    // Prepare a tab-specific panel before the user clicks Open.
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

    // Open the prepared panel without resolving the active tab again.
    const handleOpenPageInspector = useCallback(async () => {
        if (pageId === null || openingRef.current) return false;
        openingRef.current = true;
        setIsOpening(true);
        try {
            await backgroundClient.openPageInspectorForPage(pageId);
            return true;
        } catch {
            setError('Could not open Page Inspector. Please try again.');
            return false;
        } finally {
            openingRef.current = false;
            setIsOpening(false);
        }
    }, [backgroundClient, pageId]);

    return {
        copyright: config.copyright,
        github: config.github,
        website: config.website,
        canOpen: pageId !== null && !isOpening,
        error,
        // actions
        openPageInspector: handleOpenPageInspector,
    };
}
