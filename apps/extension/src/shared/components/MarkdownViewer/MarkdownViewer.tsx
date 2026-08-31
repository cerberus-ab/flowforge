interface MarkdownViewerProps {
    value: string;
}

export function MarkdownViewer({ value }: MarkdownViewerProps) {
    return (
        <pre className="flowforge-markdown-viewer" data-testid="flowforge-markdown-viewer">
            <code className="flowforge-markdown-viewer__code">{value}</code>
        </pre>
    );
}
