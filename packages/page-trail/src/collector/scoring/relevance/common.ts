export const relevanceScoringWeights = {
    containerMeaning: {
        // A weak container can still be useful if it is nearby and type-compatible.
        critical: 4,
        strong: 3,
        moderate: 1,
        weak: 0,
    },
    distance: {
        // Nearest semantic containers usually provide the most precise target context.
        nearest: 3,
        near: 2,
        related: 1,
        far: 0,
    },
    fit: {
        strong: 3,
        medium: 1,
        neutral: 0,
        weak: -2,
    },
} as const;

export function readContainerMeaningScoringCategory(
    containerMeaningScore: number,
): keyof typeof relevanceScoringWeights.containerMeaning {
    if (containerMeaningScore >= 0.8) return 'critical';
    if (containerMeaningScore >= 0.6) return 'strong';
    if (containerMeaningScore >= 0.35) return 'moderate';
    return 'weak';
}

export function readDistanceScoringCategory(distance: number): keyof typeof relevanceScoringWeights.distance {
    if (distance <= 0) return 'nearest';
    if (distance === 1) return 'near';
    if (distance === 2) return 'related';
    return 'far';
}
