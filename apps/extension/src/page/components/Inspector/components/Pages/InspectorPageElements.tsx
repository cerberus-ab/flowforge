import {
    type CollectionMetadata,
    type ContentElement,
    type InteractiveElement,
    type PageBasics,
    type PageTrail,
    presentEnrichedContent,
    presentEnrichedInteractive,
    presentEnrichedStructure,
    presentPreviewContent,
    presentPreviewInteractive,
    presentPreviewStructure,
} from '@flowforge/page-trail';
import { JsonViewer } from '@/shared/components/JsonViewer';
import { InspectorPage } from './InspectorPage';

// "importanceScore.value · semanticText"
function getPageElementSummary(value: unknown): string | undefined {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined;

    const obj = value as Record<string, unknown>;
    if (typeof obj.semanticText !== 'string') return undefined;

    const importance =
        typeof obj.importanceScore === 'object' && obj.importanceScore !== null
            ? (obj.importanceScore as Record<string, unknown>).value
            : undefined;
    const score = typeof importance === 'number' && Number.isFinite(importance) ? importance.toFixed(2) : undefined;

    return score ? `${score} · ${obj.semanticText}` : obj.semanticText;
}

// Exports

export function InspectorPageBasics({ basics }: { basics: PageBasics }) {
    return (
        <InspectorPage>
            <JsonViewer value={basics} sortKeys />
        </InspectorPage>
    );
}

export function InspectorPageStructure({
    structure,
    devMode,
}: {
    structure: ReturnType<PageTrail['getStructure']>;
    devMode: boolean;
}) {
    return (
        <InspectorPage>
            <JsonViewer
                getNodeSummary={getPageElementSummary}
                sortKeys
                value={devMode ? presentEnrichedStructure(structure) : presentPreviewStructure(structure)}
            />
        </InspectorPage>
    );
}

export function InspectorPageContent({ content, devMode }: { content: ContentElement[]; devMode: boolean }) {
    return (
        <InspectorPage>
            <JsonViewer
                getNodeSummary={getPageElementSummary}
                rootArrayExpandedItems={1}
                sortKeys
                value={devMode ? presentEnrichedContent(content) : presentPreviewContent(content)}
            />
        </InspectorPage>
    );
}

export function InspectorPageInteractive({
    interactive,
    devMode,
}: {
    interactive: InteractiveElement[];
    devMode: boolean;
}) {
    return (
        <InspectorPage>
            <JsonViewer
                getNodeSummary={getPageElementSummary}
                rootArrayExpandedItems={1}
                sortKeys
                value={devMode ? presentEnrichedInteractive(interactive) : presentPreviewInteractive(interactive)}
            />
        </InspectorPage>
    );
}

export function InspectorPageMetadata({ metadata }: { metadata: CollectionMetadata }) {
    return (
        <InspectorPage>
            <JsonViewer value={metadata} sortKeys />
        </InspectorPage>
    );
}
