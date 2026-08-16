import type { PageTrail } from '@flowforge/contract';

export interface PageMetadataProps {
    metadata: PageTrail['metadata'];
}

export function PageMetadata({ metadata }: PageMetadataProps) {
    return (
        <div className="flowforge-inspector-page-metadata">
            Selected{' '}
            {metadata.contentElementsLimitReached ? (
                <>
                    <span
                        className="flowforge-u-color-secondary"
                        title="Only a limited number of top candidates by importance are selected"
                    >
                        {metadata.contentElements}
                    </span>
                    /{metadata.contentElementsTotal}
                </>
            ) : (
                <>{metadata.contentElements}</>
            )}{' '}
            content elements,{' '}
            {metadata.interactiveElementsLimitReached ? (
                <>
                    <span
                        className="flowforge-u-color-secondary"
                        title="Only a limited number of top candidates by importance are selected"
                    >
                        {metadata.interactiveElements}
                    </span>
                    /{metadata.interactiveElementsTotal}
                </>
            ) : (
                <>{metadata.interactiveElements}</>
            )}{' '}
            interactive elements · {metadata.performance.totalMs}ms
        </div>
    );
}
