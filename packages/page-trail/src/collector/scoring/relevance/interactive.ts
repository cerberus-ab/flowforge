import type {
    ContainerElementRole,
    ContainerElementType,
    InteractiveElementRole,
    InteractiveElementType,
} from '../../../types/index.ts';
import { ScoringFeat, type ScoringResult } from '../ScoringFeat.ts';
import { readContainerMeaningScoringCategory, readDistanceScoringCategory, relevanceScoringWeights } from './common.ts';

const scoringFeat = ScoringFeat.create(relevanceScoringWeights);

function readFitScoringCategory(
    targetRole: InteractiveElementRole,
    targetType: InteractiveElementType,
    containerRole: ContainerElementRole,
    containerType: ContainerElementType,
): keyof typeof relevanceScoringWeights.fit {
    if (containerRole === 'footer' || containerRole === 'table row') return 'weak';

    if (containerType === 'form' || containerType === 'dialog') return 'strong';
    if (containerRole === 'search' && (targetRole === 'searchbox' || targetType === 'input')) return 'strong';
    if (containerType === 'navigation' || containerType === 'widget') return 'strong';

    if (containerType === 'landmark' || containerType === 'section') return 'medium';
    if (containerType === 'table') return 'neutral';

    return 'neutral';
}

// Exports

export interface ContainerRelevanceForInteractiveTargetScoringData {
    targetRole: InteractiveElementRole;
    targetType: InteractiveElementType;
    containerRole: ContainerElementRole;
    containerType: ContainerElementType;
    containerMeaningScore: number;
    distance: number;
}

export function scoreContainerRelevanceForInteractiveTarget(
    scoringData: ContainerRelevanceForInteractiveTargetScoringData,
): ScoringResult {
    const { targetRole, targetType, containerRole, containerType, containerMeaningScore, distance } = scoringData;

    return scoringFeat.calc({
        containerMeaning: readContainerMeaningScoringCategory(containerMeaningScore),
        distance: readDistanceScoringCategory(distance),
        fit: readFitScoringCategory(targetRole, targetType, containerRole, containerType),
    });
}
