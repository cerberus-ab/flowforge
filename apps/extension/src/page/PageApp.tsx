import { usePage } from '#self/page/hooks/usePage';
import { Highlight } from '#self/page/components/Highlight';
import { Wizard } from '#self/page/components/Wizard';
import type { TransportService } from '#self/adapters/interface';

interface PageAppProps {
    transport: TransportService;
}

export function PageApp({ transport }: PageAppProps) {
    const { highlights, wizard } = usePage({ transport });

    return (
        <div className="flowforge-main flowforge-main--page">
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
