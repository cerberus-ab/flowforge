import type { ContainerElementRole, ContainerElementType, ContentElementType } from '../../../types/index.ts';
import { ScoringFeat, type ScoringResult } from '../ScoringFeat.ts';
import { readContainerMeaningScoringCategory, readDistanceScoringCategory, relevanceScoringWeights } from './common.ts';

const scoringFeat = ScoringFeat.create(relevanceScoringWeights);

function readFitScoringCategory(
    targetType: ContentElementType,
    containerRole: ContainerElementRole,
    containerType: ContainerElementType,
): keyof typeof relevanceScoringWeights.fit {
    if (containerRole === 'footer' || containerRole === 'table row') return 'weak';

    if (containerRole === 'article' || containerRole === 'main content') return 'strong';
    if (containerType === 'section' || containerType === 'landmark') return 'strong';

    if (targetType === 'heading' && (containerRole === 'navigation' || containerType === 'navigation')) return 'medium';
    if (containerType === 'dialog' || containerType === 'table') return 'medium';

    if (containerType === 'form') return 'neutral';
    if (containerType === 'navigation' || containerType === 'widget') return 'weak';

    return 'neutral';
}

// Exports

export interface ContainerRelevanceForContentScoringData {
    targetType: ContentElementType;
    containerRole: ContainerElementRole;
    containerType: ContainerElementType;
    containerMeaningScore: number;
    distance: number;
}

export function scoreContainerRelevanceForContentTarget(
    scoringData: ContainerRelevanceForContentScoringData,
): ScoringResult {
    const { targetType, containerRole, containerType, containerMeaningScore, distance } = scoringData;

    return scoringFeat.calc({
        containerMeaning: readContainerMeaningScoringCategory(containerMeaningScore),
        distance: readDistanceScoringCategory(distance),
        fit: readFitScoringCategory(targetType, containerRole, containerType),
    });
}
