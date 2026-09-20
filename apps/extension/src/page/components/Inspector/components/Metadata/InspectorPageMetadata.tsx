import type { CollectionMetadata } from '@flowforge/page-trail';
import { Tooltip } from '@/shared/components/Tooltip';

const limitTooltip = 'Only a limited number of top candidates by importance are selected.';

// Exports

export function InspectorPageMetadata({ metadata }: { metadata: CollectionMetadata; devMode: boolean }) {
    return (
        <div className="flowforge-inspector-page-metadata">
            Selected{' '}
            {metadata.contentElementsLimitReached ? (
                <>
                    <Tooltip content={limitTooltip} variant="secondary">
                        <span className="flowforge-u-color-secondary">{metadata.contentElements}</span>
                    </Tooltip>
                    /{metadata.contentElementsCandidates}
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
                    /{metadata.interactiveElementsCandidates}
                </>
            ) : (
                <>{metadata.interactiveElements}</>
            )}{' '}
            interactive elements · {metadata.performance.totalMs}ms
        </div>
    );
}
