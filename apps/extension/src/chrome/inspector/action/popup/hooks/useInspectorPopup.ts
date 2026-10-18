import { config } from '@/config';
import type { InspectorPopupBackgroundClient } from '@/background';
import { useSidePanelOpener } from '@/chrome/sidePanel/hooks/useSidePanelOpener';

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
    const opener = useSidePanelOpener(backgroundClient);

    return {
        copyright: config.copyright,
        github: config.github,
        website: config.website,
        canOpen: opener.canOpen,
        error: opener.error,
        // actions
        openPageInspector: opener.openPageInspector,
    };
}
