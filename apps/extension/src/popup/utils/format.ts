import type { QueryResponseMetadata } from '@flowforge/shared';

// Format duration in seconds
function formatDuration(ms: number): string {
    const s = ms / 1000;
    if (s < 10) {
        const v = Math.round(s * 10) / 10;
        return v % 1 === 0 ? `${v.toFixed(0)}s` : `${v.toFixed(1)}s`;
    }
    return `${Math.round(s)}s`;
}

// Format tokens with 'k' suffix for thousands
function formatTokens(n: number): string {
    if (n < 1000) return `${n}`;

    const k = n / 1000;
    if (k < 10) {
        const v = Math.round(k * 10) / 10;
        return v % 1 === 0 ? `${v.toFixed(0)}k` : `${v.toFixed(1)}k`;
    }
    return `${Math.round(k)}k`;
}

/**
 * Formats query response metadata into a compact display string.
 *
 * @param metadata - Query response metadata including model, token usage, and execution time.
 * @returns A formatted string like `model · 1.2k tokens · 3.4s`.
 */
export function formatQueryResponseMetadata(metadata: QueryResponseMetadata) {
    return `${metadata.model} · ${formatTokens(metadata.usage.totalTokens)} tokens · ${formatDuration(metadata.execTimeMs)}`;
}
