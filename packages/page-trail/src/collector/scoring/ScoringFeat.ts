import { toUpperSnakeCase } from '../../utils/index.ts';

/**
 * Feature weight schema for additive scoring.
 *
 * A feature can be represented in one of two ways:
 * - `number` for a boolean feature that contributes its weight only when selected as `true`;
 * - `Record<string, number>` for a categorical feature where at most one category contributes.
 */
type ScoringWeights = Record<string, Record<string, number> | number>;

/**
 * Type-safe feature selection derived from a concrete scoring weight schema.
 *
 * Numeric features accept boolean values. Categorical features accept only category
 * names declared in the corresponding schema entry. Features are optional; omitted
 * or `undefined` selections do not contribute to the score.
 */
type ScoringSelection<T extends ScoringWeights> = {
    [K in keyof T]?: T[K] extends number ? boolean : Extract<keyof T[K], string>;
};

function formatFeatureName(feature: string, weight: number, category?: string): string {
    const featureName = category
        ? `${toUpperSnakeCase(feature)}_${toUpperSnakeCase(category)}`
        : toUpperSnakeCase(feature);
    const direction = weight >= 0 ? 'INC' : 'DEC';

    return `${featureName}_${direction}_${Math.abs(weight)}`;
}

export interface ScoringResult {
    /**
     * Raw additive score before normalization.
     */
    score: number;
    /**
     * Normalized score in the `[0..1]` range.
     */
    value: number;
    /**
     * Diagnostic feature names that contributed to the raw score.
     */
    features: string[];
}

/**
 * Computes additive feature scores from a declarative weight schema.
 *
 * `ScoringFeat` keeps scoring policy separate from domain-specific signal extraction:
 * callers map domain data into a `ScoringSelection`, while this class sums matching
 * weights and normalizes the result into `[0..1]` when requested.
 *
 * The score range is inferred from the schema:
 * - numeric features contribute their negative weight to the minimum or positive weight to the maximum;
 * - categorical features contribute only the lowest negative category to the minimum and the highest positive
 *   category to the maximum, because categories within a feature are mutually exclusive.
 *
 * Unknown runtime keys and unknown categories are ignored. This keeps the scorer tolerant
 * of partially-built selections, while compile-time callers still get strict category
 * checking from `ScoringSelection<T>`.
 */
export class ScoringFeat<T extends ScoringWeights> {
    private constructor(
        private readonly weights: T,
        private readonly minScore: number,
        private readonly maxScore: number,
    ) {}

    /**
     * Creates a scorer and precomputes the normalization range from the weight schema.
     *
     * Use `as const` on the schema object when category names should be preserved as
     * string literal types.
     */
    static create<const T extends ScoringWeights>(weights: T): ScoringFeat<T> {
        let minScore = 0;
        let maxScore = 0;

        for (const value of Object.values(weights)) {
            if (typeof value === 'number') {
                if (value < 0) minScore += value;
                else maxScore += value;
            } else {
                let minCatValue = Infinity;
                let maxCatValue = -Infinity;

                for (const catValue of Object.values(value)) {
                    if (catValue < minCatValue) minCatValue = catValue;
                    if (catValue > maxCatValue) maxCatValue = catValue;
                }
                if (minCatValue < 0) minScore += minCatValue;
                if (maxCatValue > 0) maxScore += maxCatValue;
            }
        }
        return new ScoringFeat(weights, minScore, maxScore);
    }

    /**
     * Computes the raw additive score for a feature selection.
     *
     * Boolean features contribute only when selected as `true`. Categorical features
     * contribute the configured weight for the selected category. Omitted features,
     * `undefined` values, mismatched runtime values, and unknown runtime categories
     * contribute `0`.
     */
    score(selection: ScoringSelection<T>): number {
        let score = 0;

        for (const [key, value] of Object.entries(selection)) {
            const weight = this.weights[key];
            if (weight === undefined) continue;

            if (typeof weight === 'number') {
                if (value === true) score += weight;
                continue;
            }
            if (typeof value !== 'string') continue;

            score += weight[value] ?? 0;
        }
        return score;
    }

    /**
     * Computes the normalized score for a feature selection.
     *
     * The raw score is clamped to the inferred minimum/maximum range and mapped to
     * `[0..1]`, where `0` is the weakest possible configured score and `1` is the
     * strongest possible configured score.
     */
    value(selection: ScoringSelection<T>): number {
        return this.normalise(this.score(selection));
    }

    /**
     * Lists selected scoring features using their normalized diagnostic names.
     *
     * Boolean features are emitted when selected as `true`. Categorical features
     * include the selected category name. Runtime-unknown keys, mismatched values,
     * and unknown categories are ignored the same way as `score(...)`.
     *
     * Examples:
     * - `role: 'critical'` with weight `4` -> `ROLE_CRITICAL_INC_4`
     * - `sizeTooSmall: true` with weight `-4` -> `SIZE_TOO_SMALL_DEC_4`
     */
    features(selection: ScoringSelection<T>): string[] {
        const features: string[] = [];

        for (const [key, value] of Object.entries(selection)) {
            const weight = this.weights[key];
            if (weight === undefined) continue;

            if (typeof weight === 'number') {
                if (value === true && weight !== 0) features.push(formatFeatureName(key, weight));
                continue;
            }
            if (typeof value !== 'string') continue;

            const categoryWeight = weight[value];
            if (categoryWeight === undefined || categoryWeight === 0) continue;

            features.push(formatFeatureName(key, categoryWeight, value));
        }
        return features;
    }

    /**
     * Computes the complete scoring result for a feature selection.
     *
     * Returns the raw additive score, the normalized score, and diagnostic
     * feature names from the same selection pass semantics used by `score(...)`,
     * `value(...)`, and `features(...)`.
     */
    calc(selection: ScoringSelection<T>): ScoringResult {
        const score = this.score(selection);

        return {
            score,
            value: this.normalise(score),
            features: this.features(selection),
        };
    }

    private normalise(score: number): number {
        if (score <= this.minScore) return 0;
        if (score >= this.maxScore) return 1;
        return (score - this.minScore) / (this.maxScore - this.minScore);
    }
}
