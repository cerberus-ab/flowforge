import type { TransportService } from '#self/adapters/interface';

import { usePage } from '#self/page/hooks/usePage';
import { Main } from '#self/shared/components/Main';
import { Highlight } from '#self/page/components/Highlight';
import { Wizard } from '#self/page/components/Wizard';
import { useSettings } from '#self/shared/hooks/useSettings';

interface PageAppProps {
    transport: TransportService;
}

export function PageApp({ transport }: PageAppProps) {
    const { highlights, wizard } = usePage({ transport });
    const { theme } = useSettings({ transport });

    return (
        <Main theme={theme}>
            {highlights.length > 0 && (
                <div className="flowforge-highlights-container">
                    {highlights.map((highlight) => (
                        <Highlight key={highlight.id} {...highlight} />
                    ))}
                </div>
            )}
            {wizard && <Wizard {...wizard} />}
        </Main>
    );
}
