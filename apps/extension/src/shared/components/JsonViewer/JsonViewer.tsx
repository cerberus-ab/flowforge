type JsonObject = Record<string, unknown>;

interface JsonViewerProps {
    value: unknown;
}

interface JsonViewerNodeProps {
    name?: string;
    value: unknown;
    depth?: number;
}

function isJsonObject(value: unknown): value is JsonObject {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function formatPrimitive(value: unknown) {
    if (value === null) return 'null';
    if (typeof value === 'string') return JSON.stringify(value);
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (typeof value === 'undefined') return 'undefined';
    return JSON.stringify(value);
}

function getValueType(value: unknown) {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
}

function getCollectionMeta(value: unknown) {
    if (Array.isArray(value)) {
        return `${value.length} ${value.length === 1 ? 'item' : 'items'}`;
    }
    if (isJsonObject(value)) {
        const count = Object.keys(value).length;
        return `${count} ${count === 1 ? 'key' : 'keys'}`;
    }
    return '';
}

function getCollapsedPreview(value: unknown) {
    if (Array.isArray(value)) return value.length === 0 ? '[]' : '[…]';
    if (isJsonObject(value)) return Object.keys(value).length === 0 ? '{}' : '{…}';
    return formatPrimitive(value);
}

function JsonPrimitive({ value }: JsonViewerProps) {
    const type = getValueType(value);

    return (
        <span className={`flowforge-json-viewer__primitive flowforge-json-viewer__primitive--${type}`}>
            {formatPrimitive(value)}
        </span>
    );
}

function JsonViewerNode({ name, value, depth = 0 }: JsonViewerNodeProps) {
    const isArray = Array.isArray(value);
    const isObject = isJsonObject(value);
    const isCollection = isArray || isObject;
    const hasName = name !== undefined;

    if (!isCollection) {
        return (
            <div className="flowforge-json-viewer__row">
                {hasName ? <span className="flowforge-json-viewer__key">{JSON.stringify(name)}: </span> : null}
                <JsonPrimitive value={value} />
            </div>
        );
    }

    const entries = isArray ? value.map((item, index) => [String(index), item] as const) : Object.entries(value);
    const collectionType = isArray ? 'array' : 'object';
    const isEmpty = entries.length === 0;

    return (
        <details className="flowforge-json-viewer__node" open={depth < 2}>
            <summary className="flowforge-json-viewer__summary">
                {hasName ? <span className="flowforge-json-viewer__key">{JSON.stringify(name)}: </span> : null}
                <span className={`flowforge-json-viewer__bracket flowforge-json-viewer__bracket--${collectionType}`}>
                    {isArray ? '[' : '{'}
                </span>
                <span className="flowforge-json-viewer__preview">{getCollapsedPreview(value)}</span>
                <span className="flowforge-json-viewer__meta">{getCollectionMeta(value)}</span>
            </summary>
            {isEmpty ? null : (
                <div className="flowforge-json-viewer__children">
                    {entries.map(([entryName, entryValue]) => (
                        <JsonViewerNode key={entryName} name={entryName} value={entryValue} depth={depth + 1} />
                    ))}
                </div>
            )}
            <div className="flowforge-json-viewer__row flowforge-json-viewer__closing">
                <span className={`flowforge-json-viewer__bracket flowforge-json-viewer__bracket--${collectionType}`}>
                    {isArray ? ']' : '}'}
                </span>
            </div>
        </details>
    );
}

export function JsonViewer({ value }: JsonViewerProps) {
    return (
        <div className="flowforge-json-viewer">
            <JsonViewerNode value={value} />
        </div>
    );
}
