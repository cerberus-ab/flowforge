import {
    type PageTrail,
    semModelEnrichedContent,
    semModelEnrichedInteractive,
    semModelEnrichedStructure,
    semModelPreviewContent,
    semModelPreviewInteractive,
    semModelPreviewStructure,
} from '@flowforge/page-trail';
import { JsonViewer } from '@/shared/components/JsonViewer';

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

export function InspectorPageStructure({
    structure,
    devMode,
}: {
    structure: PageTrail['structure'];
    devMode: boolean;
}) {
    return (
        <JsonViewer
            getNodeSummary={getPageElementSummary}
            rootArrayExpandedItems={1}
            sortKeys
            value={devMode ? semModelEnrichedStructure(structure) : semModelPreviewStructure(structure)}
        />
    );
}

export function InspectorPageContent({ content, devMode }: { content: PageTrail['content']; devMode: boolean }) {
    return (
        <JsonViewer
            getNodeSummary={getPageElementSummary}
            rootArrayExpandedItems={1}
            sortKeys
            value={devMode ? semModelEnrichedContent(content) : semModelPreviewContent(content)}
        />
    );
}

export function InspectorPageInteractive({
    interactive,
    devMode,
}: {
    interactive: PageTrail['interactive'];
    devMode: boolean;
}) {
    return (
        <JsonViewer
            getNodeSummary={getPageElementSummary}
            rootArrayExpandedItems={1}
            sortKeys
            value={devMode ? semModelEnrichedInteractive(interactive) : semModelPreviewInteractive(interactive)}
        />
    );
}
