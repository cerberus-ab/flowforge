import type { ContentElementType } from '../../../types/index.ts';
import { ScoringFeat, type ScoringResult } from '../ScoringFeat.ts';

const scoringWeights = {
    type: {
        // Headings usually carry stronger standalone meaning than body text.
        heading: 3,
        // Regular text is still useful content, but needs length to provide enough signal.
        text: 1,
    },
    textLength: {
        // Empty text should not be a meaningful content target.
        empty: -4,
        // Very short snippets are often labels, fragments, or layout noise.
        tooShort: -2,
        // Short text can still be meaningful, but carries limited standalone context.
        short: 0,
        // Medium text usually contains enough information to be useful.
        meaningful: 2,
        // Paragraph-sized text is often the most useful standalone content.
        optimal: 3,
        // Long text remains useful, but is less concise for ranking/sampling.
        long: 1,
        // Very long text is often noisy or too broad as a single target.
        tooLong: -1,
    },
} as const;

const scoringFeat = ScoringFeat.create(scoringWeights);

function readTextLengthScoringCategory(text: string): keyof typeof scoringWeights.textLength {
    if (text.length === 0) return 'empty';
    if (text.length < 20) return 'tooShort';
    if (text.length < 60) return 'short';
    if (text.length < 100) return 'meaningful';
    if (text.length < 300) return 'optimal';
    if (text.length <= 600) return 'long';
    return 'tooLong';
}

// Exports

export interface ContentMeaningScoringData {
    type: ContentElementType;
    text: string;
}

export function scoreContentMeaning(scoringData: ContentMeaningScoringData): ScoringResult {
    const { type, text } = scoringData;

    return scoringFeat.calc({
        type,
        textLength: readTextLengthScoringCategory(text),
    });
}
