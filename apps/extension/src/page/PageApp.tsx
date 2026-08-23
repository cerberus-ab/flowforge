import type { TransportService } from '@/adapters/interface';

import { usePage } from '@/page/hooks/usePage';
import { Highlight } from '@/page/components/Highlight';
import { Wizard } from '@/page/components/Wizard';
import { Inspector } from '@/page/components/Inspector';

export interface PageAppProps {
    transport: TransportService;
    devMode: boolean;
    onDevModeChange: (enabled: boolean) => void | Promise<void>;
    onReady?: () => void;
}

export function PageApp({ transport, devMode, onDevModeChange, onReady }: PageAppProps) {
    const { highlights, wizard, inspector } = usePage({ transport, devMode, onDevModeChange, onReady });

    return (
        <div className="flowforge-page">
            {highlights.length > 0 && (
                <div className="flowforge-highlights-container">
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
