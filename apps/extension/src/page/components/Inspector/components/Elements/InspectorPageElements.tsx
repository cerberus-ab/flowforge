import { type PageTrail, semModelContainer, semModelContent, semModelInteractive } from '@flowforge/page-trail';
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

export function InspectorPageContainer({ container }: { container: PageTrail['container'] }) {
    return (
        <JsonViewer
            getNodeSummary={getPageElementSummary}
            rootArrayExpandedItems={1}
            sortKeys
            value={semModelContainer(container)}
        />
    );
}

export function InspectorPageContent({ content }: { content: PageTrail['content'] }) {
    return (
        <JsonViewer
            getNodeSummary={getPageElementSummary}
            rootArrayExpandedItems={1}
            sortKeys
            value={semModelContent(content)}
        />
    );
}

export function InspectorPageInteractive({ interactive }: { interactive: PageTrail['interactive'] }) {
    return (
        <JsonViewer
            getNodeSummary={getPageElementSummary}
            rootArrayExpandedItems={1}
            sortKeys
            value={semModelInteractive(interactive)}
        />
    );
}
