import type {
    BoundingBox,
    ContainerElementLabel,
    ContainerElementRole,
    ContainerElementType,
} from '../../../types/index.ts';
import { ScoringFeat, type ScoringResult } from '../ScoringFeat.ts';

// constants
const SMALL_CONTAINER_AREA = 40 * 40;

const scoringWeights = {
    type: {
        // focused container classes that usually define a strong local task scope
        focused: 3,
        // page/section/navigation classes that usually provide useful grouping context
        structural: 2,
        // widgets and tables can be useful but are often less stable as high-level scopes
        supporting: 1,
    },
    role: {
        // high-value context scopes: focused overlays, forms, and primary page content
        critical: 5,
        // focused task/content scopes
        strong: 4,
        // useful semantic grouping scopes
        meaningful: 3,
        // broad or weak semantic scopes
        weak: 1,
        // low-value or noisy scopes
        noisy: 0,
        // table rows are often too granular as stable context scopes
        tooGranular: -1,
    },
    label: {
        // heading, legend, and aria labels usually provide strong scope names
        strong: 4,
        // lower-level and ARIA headings provide visible scope names, but with weaker structure
        subheading: 3,
        // title-only labels are weaker but still useful
        titleOnly: 2,
        // generic unlabeled containers are often layout wrappers
        genericUnlabeled: -2,
    },
    // tiny containers are unlikely to be useful context scopes
    sizeTooSmall: -3,
} as const;

const scoringFeat = ScoringFeat.create(scoringWeights);

function readTypeScoringCategory(type: ContainerElementType): keyof typeof scoringWeights.type {
    if (type === 'dialog' || type === 'form') {
        return 'focused';
    }
    if (type === 'landmark' || type === 'navigation' || type === 'section') {
        return 'structural';
    }
    return 'supporting';
}

function readRoleScoringCategory(role: ContainerElementRole): keyof typeof scoringWeights.role | undefined {
    if (role === 'alert dialog' || role === 'modal dialog' || role === 'dialog') {
        return 'critical';
    }
    if (role === 'form' || role === 'main content') {
        return 'critical';
    }
    if (role === 'search' || role === 'article') {
        return 'strong';
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
        return 'meaningful';
    }
    if (role === 'header' || role === 'sidebar' || role === 'figure' || role === 'table') {
        return 'weak';
    }
    if (role === 'footer') return 'noisy';
    if (role === 'table row') return 'tooGranular';

    return undefined;
}

function readLabelScoringCategory(
    role: ContainerElementRole,
    labels: ContainerElementLabel[],
): keyof typeof scoringWeights.label | undefined {
    if (
        (role === 'section' || role === 'region' || role === 'figure' || role === 'note' || role === 'table row') &&
        labels.length === 0
    ) {
        return 'genericUnlabeled';
    }
    if (labels.some((label) => label.source !== 'subheading' && label.source !== 'title')) {
        return 'strong';
    }
    if (labels.some((label) => label.source === 'subheading')) {
        return 'subheading';
    }
    if (labels.length > 0) {
        return 'titleOnly';
    }
    return undefined;
}

// Exports

export interface ContainerMeaningScoringData {
    role: ContainerElementRole;
    type: ContainerElementType;
    labels: ContainerElementLabel[];
    bbox: BoundingBox;
}

export function scoreContainerMeaning(scoringData: ContainerMeaningScoringData): ScoringResult {
    const { role, type, labels, bbox } = scoringData;

    return scoringFeat.calc({
        type: readTypeScoringCategory(type),
        role: readRoleScoringCategory(role),
        label: readLabelScoringCategory(role, labels),
        sizeTooSmall: bbox.width * bbox.height < SMALL_CONTAINER_AREA,
    });
}
