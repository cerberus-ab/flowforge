import type { TransportService } from '@/adapters/interface';

import { usePage } from '@/page/hooks/usePage';
import { Highlight } from '@/page/components/Highlight';
import { Wizard } from '@/page/components/Wizard';

export interface PageAppProps {
    transport: TransportService;
}

export function PageApp({ transport }: PageAppProps) {
    const { highlights, wizard } = usePage({ transport });

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
        </div>
    );
}
