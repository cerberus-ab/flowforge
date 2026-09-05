import { cx } from '@/shared/utils/cx';

type JsonObject = Record<string, unknown>;

interface JsonViewerProps {
    value: unknown;
    getNodeSummary?: (value: unknown) => string | undefined;
    rootArrayExpandedItems?: number;
    sortKeys?: boolean;
}

interface JsonPrimitiveProps {
    value: unknown;
}

interface JsonViewerNodeProps {
    name?: string;
    value: unknown;
    getNodeSummary?: (value: unknown) => string | undefined;
    rootArrayExpandedItems?: number;
    sortKeys?: boolean;
    initialOpen?: boolean;
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

function getCollectionSummary(value: unknown, getNodeSummary?: (value: unknown) => string | undefined) {
    if (Array.isArray(value)) {
        const summary = getNodeSummary?.(value);

        if (summary) {
            return summary;
        }
        return `${value.length} ${value.length === 1 ? 'item' : 'items'}`;
    }
    if (isJsonObject(value)) {
        const count = Object.keys(value).length;
        const summary = getNodeSummary?.(value);

        if (summary) {
            return summary;
        }
        return `${count} ${count === 1 ? 'key' : 'keys'}`;
    }
    return '';
}

function getShapePreview(value: unknown) {
    if (Array.isArray(value)) return value.length === 0 ? '[]' : '[…]';
    if (isJsonObject(value)) return Object.keys(value).length === 0 ? '{}' : '{…}';
    return formatPrimitive(value);
}

function getObjectEntries(value: JsonObject, sortKeys?: boolean) {
    const entries = Object.entries(value);

    if (!sortKeys) {
        return entries;
    }
    return entries.toSorted(([firstKey], [secondKey]) => firstKey.localeCompare(secondKey));
}

function JsonPrimitive({ value }: JsonPrimitiveProps) {
    const type = getValueType(value);

    return (
        <span className={cx('flowforge-json-viewer__primitive', `flowforge-json-viewer__primitive--${type}`)}>
            {formatPrimitive(value)}
        </span>
    );
}

function JsonViewerNode({
    name,
    value,
    getNodeSummary,
    rootArrayExpandedItems,
    sortKeys,
    initialOpen,
    depth = 0,
}: JsonViewerNodeProps) {
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

    const entries = isArray
        ? value.map((item, index) => [String(index), item] as const)
        : getObjectEntries(value, sortKeys);
    const collectionType = isArray ? 'array' : 'object';
    const isEmpty = entries.length === 0;
    const isOpen = initialOpen ?? depth < 2;

    return (
        <details className="flowforge-json-viewer__node" open={isOpen}>
            <summary className="flowforge-json-viewer__summary">
                {hasName ? <span className="flowforge-json-viewer__key">{JSON.stringify(name)}: </span> : null}
                <span
                    className={cx(
                        'flowforge-json-viewer__bracket',
                        `flowforge-json-viewer__bracket--${collectionType}`,
                    )}
                >
                    {isArray ? '[' : '{'}
                </span>
                <span className="flowforge-json-viewer__shape">{getShapePreview(value)}</span>
                <span className="flowforge-json-viewer__summary-text">
                    {getCollectionSummary(value, getNodeSummary)}
                </span>
            </summary>
            {isEmpty ? null : (
                <div className="flowforge-json-viewer__children">
                    {entries.map(([entryName, entryValue], entryIndex) => {
                        const childInitialOpen =
                            depth === 0 && isArray && rootArrayExpandedItems !== undefined
                                ? entryIndex < rootArrayExpandedItems
                                : undefined;

                        return (
                            <JsonViewerNode
                                key={entryName}
                                name={entryName}
                                value={entryValue}
                                getNodeSummary={getNodeSummary}
                                rootArrayExpandedItems={rootArrayExpandedItems}
                                sortKeys={sortKeys}
                                initialOpen={childInitialOpen}
                                depth={depth + 1}
                            />
                        );
                    })}
                </div>
            )}
            <div className="flowforge-json-viewer__row flowforge-json-viewer__closing">
                <span
                    className={cx(
                        'flowforge-json-viewer__bracket',
                        `flowforge-json-viewer__bracket--${collectionType}`,
                    )}
                >
                    {isArray ? ']' : '}'}
                </span>
            </div>
        </details>
    );
}

export function JsonViewer({ value, getNodeSummary, rootArrayExpandedItems, sortKeys }: JsonViewerProps) {
    return (
        <div className="flowforge-json-viewer">
            <JsonViewerNode
                value={value}
                getNodeSummary={getNodeSummary}
                rootArrayExpandedItems={rootArrayExpandedItems}
                sortKeys={sortKeys}
            />
        </div>
    );
}
