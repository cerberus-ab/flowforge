import type { CollectionMetadata } from '@flowforge/page-trail';
import { Tooltip } from '@/shared/components/Tooltip';

const limitTooltip = 'Only a limited number of top candidates by importance are selected.';

// Exports

export function InspectorLineMetadata({ metadata }: { metadata: CollectionMetadata }) {
    const { elements, performance } = metadata;

    return (
        <div className="flowforge-inspector-line-metadata">
            Selected{' '}
            {elements.contentElementsLimitReached ? (
                <>
                    <Tooltip content={limitTooltip} variant="secondary">
                        <span className="flowforge-u-color-secondary">{elements.contentElements}</span>
                    </Tooltip>
                    /{elements.contentElementsCandidates}
                </>
            ) : (
                <>{elements.contentElements}</>
            )}{' '}
            content elements,{' '}
            {elements.interactiveElementsLimitReached ? (
                <>
                    <Tooltip content={limitTooltip} variant="secondary">
                        <span className="flowforge-u-color-secondary">{elements.interactiveElements}</span>
                    </Tooltip>
                    /{elements.interactiveElementsCandidates}
                </>
            ) : (
                <>{elements.interactiveElements}</>
            )}{' '}
            interactive elements · {performance.totalMs}ms
        </div>
    );
}
