import type { PageTrail } from '@flowforge/contract';
import { Tooltip } from '@/shared/components/Tooltip';

const limitTooltip = 'Only a limited number of top candidates by importance are selected.';

// Exports

export function InspectorPageMetadata({ metadata }: { metadata: PageTrail['metadata']; devMode: boolean }) {
    return (
        <div className="flowforge-inspector-page-metadata">
            Selected{' '}
            {metadata.contentElementsLimitReached ? (
                <>
                    <Tooltip content={limitTooltip} variant="secondary">
                        <span className="flowforge-u-color-secondary">{metadata.contentElements}</span>
                    </Tooltip>
                    /{metadata.contentElementsTotal}
                </>
            ) : (
                <>{metadata.contentElements}</>
            )}{' '}
            content elements,{' '}
            {metadata.interactiveElementsLimitReached ? (
                <>
                    <Tooltip content={limitTooltip} variant="secondary">
                        <span className="flowforge-u-color-secondary">{metadata.interactiveElements}</span>
                    </Tooltip>
                    /{metadata.interactiveElementsTotal}
                </>
            ) : (
                <>{metadata.interactiveElements}</>
            )}{' '}
            interactive elements · {metadata.performance.totalMs}ms
        </div>
    );
}
