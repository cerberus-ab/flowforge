import type {
    BoundingBox,
    ContainerElementLabel,
    ContainerElementRole,
    ContainerElementType,
} from '../../types/index.ts';
import { getMaxImportanceScore, getMinImportanceScore, normalizeImportanceScore } from './utils.ts';

const SMALL_CONTAINER_AREA = 40 * 40;

/**
 * Typical interpretation:
 *   - 6–9 → strong semantic scopes
 *   - 3–5 → moderate semantic scopes
 *   - ≤2 → weak or noisy scopes
 *
 */
const baseContainerScoringWeights = {
    // high-value semantic scopes
    ROLE_CRITICAL: 4,
    // focused task/content scopes
    ROLE_STRONG: 3,
    // useful semantic grouping scopes
    ROLE_MEANINGFUL: 2,
    // broad or weak semantic scopes
    ROLE_WEAK: 1,
    // low-value or noisy semantic scopes
    ROLE_NOISY: -1,
    // table rows are often too granular as semantic scopes
    ROLE_TOO_GRANULAR: -2,
    // labels are strong context signals for containers
    HAS_LABEL: 3,
    // heading, legend, and aria labels usually provide meaningful scope names
    HAS_STRONG_LABEL_SOURCE: 2,
    // title-only labels are weaker but still useful
    HAS_TITLE_LABEL_ONLY: 1,
    // generic unlabeled containers are often layout wrappers
    GENERIC_UNLABELED: -2,
    // tiny containers are unlikely to be useful semantic scopes
    SIZE_TOO_SMALL: -4,
} as const satisfies Record<string, number>;

const MIN_BASE_CONTAINER_SCORE = getMinImportanceScore(baseContainerScoringWeights);
const MAX_BASE_CONTAINER_SCORE = getMaxImportanceScore(baseContainerScoringWeights);

export interface ContainerElementBaseScoringData {
    role: ContainerElementRole;
    type: ContainerElementType;
    labels: ContainerElementLabel[];
    bbox: BoundingBox;
}

/**
 * Computes a base importance score for a container element as a semantic scope.
 *
 * The score estimates how useful the container is on its own, independent of any
 * specific target element. Pair-specific context signals such as target distance
 * should be scored separately.
 *
 * @returns Normalized base importance score [0..1]
 */
export function scoreBaseContainerElement(scoringData: ContainerElementBaseScoringData): number {
    let score = 0;
    const { role, labels, bbox } = scoringData;

    // by role
    if (role === 'alert dialog' || role === 'modal dialog' || role === 'dialog') {
        score += baseContainerScoringWeights.ROLE_CRITICAL;
    }
    if (role === 'form' || role === 'main content') {
        score += baseContainerScoringWeights.ROLE_CRITICAL;
    }
    if (role === 'search' || role === 'article') {
        score += baseContainerScoringWeights.ROLE_STRONG;
    }
    if (
        role === 'section' ||
        role === 'region' ||
        role === 'feed' ||
        role === 'note' ||
        role === 'navigation' ||
        role === 'menu' ||
        role === 'toolbar' ||
        role === 'tab panel'
    ) {
        score += baseContainerScoringWeights.ROLE_MEANINGFUL;
    }
    if (role === 'header' || role === 'sidebar' || role === 'figure' || role === 'table') {
        score += baseContainerScoringWeights.ROLE_WEAK;
    }
    if (role === 'footer') score += baseContainerScoringWeights.ROLE_NOISY;
    if (role === 'table row') score += baseContainerScoringWeights.ROLE_TOO_GRANULAR;
    // by labels
    if (labels.length > 0) score += baseContainerScoringWeights.HAS_LABEL;
    if (labels.some((label) => label.source !== 'title')) {
        score += baseContainerScoringWeights.HAS_STRONG_LABEL_SOURCE;
    } else if (labels.length > 0) {
        score += baseContainerScoringWeights.HAS_TITLE_LABEL_ONLY;
    }
    // by semantic noise
    if (
        (role === 'section' || role === 'region' || role === 'figure' || role === 'note' || role === 'table row') &&
        labels.length === 0
    ) {
        score += baseContainerScoringWeights.GENERIC_UNLABELED;
    }
    // by geometry
    if (bbox.width * bbox.height < SMALL_CONTAINER_AREA) score += baseContainerScoringWeights.SIZE_TOO_SMALL;

    return normalizeImportanceScore(score, MIN_BASE_CONTAINER_SCORE, MAX_BASE_CONTAINER_SCORE);
}
