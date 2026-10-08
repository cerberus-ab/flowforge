import type { PageBackgroundClient } from '@/background/client/contract';

import { usePage } from '@/page/hooks/usePage';
import { Highlight } from '@/page/components/Highlight';
import { Wizard } from '@/page/components/Wizard';
import { Inspector } from '@/page/components/Inspector';

export interface PageAppProps {
    backgroundClient: PageBackgroundClient;
    devMode: boolean;
    onDevModeChange: (enabled: boolean) => void | Promise<void>;
    onReady?: () => void;
}

export function PageApp({ backgroundClient, devMode, onDevModeChange, onReady }: PageAppProps) {
    const { highlights, wizard, inspector } = usePage({ backgroundClient, devMode, onDevModeChange, onReady });

    return (
        <div className="flowforge-page" data-testid="flowforge-page">
            {highlights.length > 0 && (
                <div className="flowforge-highlights-container" data-testid="flowforge-highlights">
                    {highlights.map((highlight) => (
                        <Highlight key={highlight.id} {...highlight} />
                    ))}
                </div>
            )}
            {wizard && <Wizard {...wizard} />}
            {inspector && <Inspector {...inspector} />}
        </div>
    );
}
